// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IAIEngine.sol";
import "../interfaces/INeuronToken.sol";
import "../interfaces/ITreasury.sol";
import "../interfaces/IStaking.sol";
import "../libraries/MathUtils.sol";

/**
 * @title AIEngine V2
 * @notice Coordinates all AI modules: NEE, ALS, ARP, SIG, ALP
 * @dev 12-hour cycle execution with health-based adjustments
 */
contract AIEngine is IAIEngine, AccessControl, ReentrancyGuard {
    
    using MathUtils for uint256;
    
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Constants
    uint256 public constant CYCLE_DURATION = 12 hours;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant TARGET_BACKING_RATIO = 3000; // 30%
    uint256 public constant MIN_BACKING_RATIO = 2000;    // 20%
    uint256 public constant PRICE_BAND = 500;            // ±5%
    uint256 public constant TARGET_PRICE = 1e18;         // $1.00
    
    // Emission schedule (annual rates in basis points)
    uint256[5] public yearlyRates = [500, 400, 300, 250, 200]; // 5%, 4%, 3%, 2.5%, 2%
    
    // Contracts
    INeuronToken public neuronToken;
    ITreasury public treasury;
    IStaking public staking;
    
    // Price oracle (Chainlink)
    address public priceFeed;
    
    // State
    uint256 public launchTime;
    uint256 public lastCycleTime;
    uint256 public currentEmissionRate; // Annual rate in basis points
    uint256 public totalEmitted;
    
    // Health tracking
    SystemHealth public lastHealth;
    mapping(uint256 => uint256) public historicalHealth; // timestamp => score
    
    // ALS state
    uint256 public lastStabilizationTime;
    uint256 public stabilizationCooldown = 12 hours;
    
    // ARP state
    uint256 public totalAutoCompounded;
    
    constructor(
        address _neuronToken,
        address _treasury,
        address _staking,
        address _priceFeed
    ) {
        require(_neuronToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        require(_staking != address(0), "Invalid staking");
        
        neuronToken = INeuronToken(_neuronToken);
        treasury = ITreasury(_treasury);
        staking = IStaking(_staking);
        priceFeed = _priceFeed;
        
        launchTime = block.timestamp;
        lastCycleTime = block.timestamp;
        currentEmissionRate = yearlyRates[0]; // Start with 5%
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
    }
    
    /**
     * @notice Execute full 12-hour cycle (keeper function)
     */
    function executeCycle() external override onlyRole(KEEPER_ROLE) nonReentrant {
        require(block.timestamp >= lastCycleTime + CYCLE_DURATION, "Cycle too soon");
        
        // 1. Update health metrics
        _updateHealth();
        
        // 2. NEE - Calculate and emit tokens
        uint256 emission = triggerNEE();
        
        // 3. ALS - Price stabilization
        triggerALS();
        
        // 4. ARP - Process auto-compounds
        triggerARP();
        
        // 5. SIG - Validate system integrity
        triggerSIG();
        
        // 6. ALP - Adjust parameters
        triggerALP();
        
        lastCycleTime = block.timestamp;
        
        emit ModuleTriggered(ModuleType.NEE, block.timestamp);
    }
    
    /**
     * @notice NEE: Neural Emission Engine
     * Calculates emission based on health and mints to treasury
     */
    function triggerNEE() public override onlyRole(KEEPER_ROLE) returns (uint256) {
        uint256 emission = calculateEmission();
        
        if (emission > 0) {
            // Mint to treasury (not directly to users)
            string memory reason = "NEE_emission";
            neuronToken.mint(address(treasury), emission, reason);
            totalEmitted += emission;
        }
        
        return emission;
    }
    
    /**
     * @notice Calculate emission amount
     */
    function calculateEmission() public view returns (uint256) {
        uint256 totalSupply = neuronToken.totalSupply();
        uint256 maxSupply = neuronToken.maxSupply();
        
        if (totalSupply >= maxSupply) return 0;
        
        // Get current year rate
        uint256 yearsSinceLaunch = (block.timestamp - launchTime) / 365 days;
        uint256 yearIndex = yearsSinceLaunch > 4 ? 4 : yearsSinceLaunch;
        uint256 baseRate = yearlyRates[yearIndex];
        
        // Calculate base emission per 12-hour cycle
        // Emission = Supply * Rate / (365 * 2)
        uint256 baseEmission = (totalSupply * baseRate) / (BASIS_POINTS * 730);
        
        // Apply health multiplier
        uint256 healthMultiplier = getHealthMultiplier();
        uint256 adjustedEmission = (baseEmission * healthMultiplier) / BASIS_POINTS;
        
        // Cap at remaining supply
        uint256 remaining = maxSupply - totalSupply;
        return adjustedEmission > remaining ? remaining : adjustedEmission;
    }
    
    /**
     * @notice ALS: Adaptive Liquidity Stabilizer
     * Maintains price within corridor using buyback/sell
     */
    function triggerALS() public override onlyRole(KEEPER_ROLE) {
        if (block.timestamp < lastStabilizationTime + stabilizationCooldown) {
            return; // Cooldown active
        }
        
        (bool shouldAct, bool isBuy) = shouldStabilize();
        
        if (shouldAct) {
            if (isBuy) {
                // Price too low - buyback and burn
                uint256 buyAmount = calculateBuybackAmount();
                if (buyAmount > 0 && treasury.canBuyback(buyAmount)) {
                    treasury.executeBuyback(buyAmount);
                    lastStabilizationTime = block.timestamp;
                    emit ModuleTriggered(ModuleType.ALS, block.timestamp);
                }
            }
            // Selling from treasury is more complex and rare
        }
    }
    
    /**
     * @notice ARP: Auto Reinvest Protocol
     * Triggers auto-compound for opted-in stakes
     */
    function triggerARP() public override onlyRole(KEEPER_ROLE) {
        // This is a placeholder - actual batch compounding happens in Staking contract
        // The keeper calls batchAutoCompound on Staking with pre-calculated list
        emit ModuleTriggered(ModuleType.ARP, block.timestamp);
    }
    
    /**
     * @notice SIG: Supply Integrity Guard
     * Validates system integrity and can pause if critical
     */
    function triggerSIG() public override onlyRole(KEEPER_ROLE) {
        SystemHealth memory health = getSystemHealth();
        
        // Critical checks
        require(health.treasuryBacking >= MIN_BACKING_RATIO, "SIG: Backing too low");
        require(neuronToken.totalSupply() <= neuronToken.maxSupply(), "SIG: Supply exceeded");
        
        emit ModuleTriggered(ModuleType.SIG, block.timestamp);
    }
    
    /**
     * @notice ALP: Adaptive Logic Predictor
     * Adjusts parameters based on trends
     */
    function triggerALP() public override onlyRole(KEEPER_ROLE) {
        SystemHealth memory health = getSystemHealth();
        
        // Adjust emission rate based on health trend
        if (health.overallScore >= 8000) {
            // Healthy - can maintain or slightly increase
            if (currentEmissionRate < yearlyRates[0]) {
                currentEmissionRate = yearlyRates[0];
                emit EmissionAdjusted(currentEmissionRate - 100, currentEmissionRate);
            }
        } else if (health.overallScore < 4000) {
            // Critical - reduce emission
            uint256 newRate = (currentEmissionRate * 50) / 100; // 50% reduction
            if (newRate < 100) newRate = 100; // Min 1%
            emit EmissionAdjusted(currentEmissionRate, newRate);
            currentEmissionRate = newRate;
        }
        
        emit ModuleTriggered(ModuleType.ALP, block.timestamp);
    }
    
    /**
     * @notice Get current system health
     */
    function getSystemHealth() public view override returns (SystemHealth memory) {
        uint256 backing = treasury.getBackingRatio();
        uint256 staked = staking.totalStaked();
        uint256 supply = neuronToken.totalSupply();
        uint256 stakingRatio = supply > 0 ? (staked * BASIS_POINTS) / supply : 0;
        
        // Price stability (deviation from $1.00)
        uint256 price = getCurrentPrice();
        uint256 priceDeviation = price > TARGET_PRICE 
            ? ((price - TARGET_PRICE) * BASIS_POINTS) / TARGET_PRICE
            : ((TARGET_PRICE - price) * BASIS_POINTS) / TARGET_PRICE;
        uint256 priceStability = priceDeviation > BASIS_POINTS 
            ? 0 
            : BASIS_POINTS - priceDeviation;
        
        // Calculate component scores (0-10000)
        uint256 backingScore = MathUtils.min((backing * BASIS_POINTS) / TARGET_BACKING_RATIO, BASIS_POINTS);
        uint256 stakingScore = MathUtils.min((stakingRatio * BASIS_POINTS) / 5000, BASIS_POINTS); // Target 50%
        
        // Overall score (weighted average)
        uint256 overall = (
            backingScore * 30 +
            stakingScore * 25 +
            priceStability * 25 +
            BASIS_POINTS * 20 // Growth placeholder
        ) / 100;
        
        return SystemHealth({
            treasuryBacking: backing,
            stakingRatio: stakingRatio,
            priceStability: priceStability,
            growthRate: 1000, // Placeholder 10%
            overallScore: overall
        });
    }
    
    /**
     * @notice Get health multiplier for emission
     */
    function getHealthMultiplier() public view override returns (uint256) {
        uint256 backing = treasury.getBackingRatio();
        
        if (backing >= TARGET_BACKING_RATIO) {
            return BASIS_POINTS; // 100%
        }
        
        // Linear reduction below target
        // At 20% backing, multiplier = 66%
        return (backing * BASIS_POINTS) / TARGET_BACKING_RATIO;
    }
    
    /**
     * @notice Check if stabilization is needed
     */
    function shouldStabilize() public view override returns (bool, bool) {
        uint256 price = getCurrentPrice();
        
        if (price < (TARGET_PRICE * (BASIS_POINTS - PRICE_BAND)) / BASIS_POINTS) {
            return (true, true); // Price low, should buy
        }
        
        if (price > (TARGET_PRICE * (BASIS_POINTS + PRICE_BAND)) / BASIS_POINTS) {
            return (true, false); // Price high, should sell
        }
        
        return (false, false);
    }
    
    /**
     * @notice Validate mint request (called by other contracts)
     */
    function validateMintRequest(uint256 amount) external view override returns (bool) {
        // Check max supply
        if (neuronToken.totalSupply() + amount > neuronToken.maxSupply()) {
            return false;
        }
        
        // Check backing ratio
        if (treasury.getBackingRatio() < MIN_BACKING_RATIO) {
            return false;
        }
        
        // Check daily emission limit (0.05% of supply)
        uint256 dailyLimit = (neuronToken.totalSupply() * 50) / BASIS_POINTS / 100;
        if (amount > dailyLimit) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @notice Get current emission rate
     */
    function getEmissionRate() external view override returns (uint256) {
        return currentEmissionRate;
    }
    
    /**
     * @notice Get current price from oracle
     */
    function getCurrentPrice() public view returns (uint256) {
        // Placeholder - actual implementation would use Chainlink
        // For now, use treasury backing as price proxy
        uint256 supply = neuronToken.getCirculatingSupply();
        if (supply == 0) return TARGET_PRICE;
        
        uint256 treasuryValue = treasury.getTreasuryValue();
        return (treasuryValue * 1e18) / supply;
    }
    
    /**
     * @notice Calculate buyback amount
     */
    function calculateBuybackAmount() internal view returns (uint256) {
        // Max 10% of treasury per action
        uint256 treasuryValue = treasury.getTreasuryValue();
        return (treasuryValue * 1000) / BASIS_POINTS;
    }
    
    /**
     * @notice Update health metrics (internal)
     */
    function _updateHealth() internal {
        lastHealth = getSystemHealth();
        historicalHealth[block.timestamp] = lastHealth.overallScore;
        emit HealthUpdated(lastHealth.overallScore, block.timestamp);
    }
    
    /**
     * @notice Set price feed address
     */
    function setPriceFeed(address _priceFeed) external onlyRole(ADMIN_ROLE) {
        priceFeed = _priceFeed;
    }
    
    /**
     * @notice Set yearly emission rates
     */
    function setYearlyRates(uint256[5] calldata rates) external onlyRole(ADMIN_ROLE) {
        for (uint256 i = 0; i < 5; i++) {
            require(rates[i] <= 1000, "Rate too high"); // Max 10%
        }
        yearlyRates = rates;
    }
    
    /**
     * @notice Set stabilization cooldown
     */
    function setStabilizationCooldown(uint256 cooldown) external onlyRole(ADMIN_ROLE) {
        stabilizationCooldown = cooldown;
    }
}