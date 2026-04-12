// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IAIEngine.sol";
import "../interfaces/INeuronToken.sol";
import "../interfaces/ITreasury.sol";
import "../interfaces/IStaking.sol";
import "../libraries/SafeMath.sol";

/**
 * @title AIEngine
 * @notice Central AI simulation engine that coordinates all AI modules
 * @dev This contract acts as the orchestrator for NEE, ALS, ARP, SIG, and ALP modules
 */
contract AIEngine is IAIEngine {
    using SafeMath for uint256;
    
    // Core contracts
    INeuronToken public neuronToken;
    ITreasury public treasury;
    IStaking public stakingContract;
    
    // AI Module addresses
    address public neeModule;  // Neural Emission Engine
    address public alsModule;  // Adaptive Liquidity Stabilizer
    address public arpModule;  // Auto Reinvest Protocol
    address public sigModule;  // Supply Integrity Guard
    address public alpModule;  // Adaptive Logic Predictor
    
    // Access control
    address public owner;
    address public pendingOwner;
    
    // System parameters
    uint256 public lastSystemUpdate;
    uint256 public updateInterval = 12 hours;
    
    // System health metrics
    uint256 public targetSupplyRatio = 50; // 50% of supply should be staked
    uint256 public maxEmissionRate = 1000; // 10% max annual emission
    
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ModuleUpdated(string moduleName, address moduleAddress);
    event SystemUpdateTriggered(uint256 timestamp, uint256 healthScore);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "AIEngine: not owner");
        _;
    }
    
    modifier onlyModule() {
        require(
            msg.sender == neeModule || 
            msg.sender == alsModule || 
            msg.sender == arpModule || 
            msg.sender == sigModule || 
            msg.sender == alpModule ||
            msg.sender == owner,
            "AIEngine: not authorized module"
        );
        _;
    }
    
    constructor(address _neuronToken, address _treasury, address _staking) {
        owner = msg.sender;
        neuronToken = INeuronToken(_neuronToken);
        treasury = ITreasury(_treasury);
        stakingContract = IStaking(_staking);
        lastSystemUpdate = block.timestamp;
    }
    
    // ============ NEE - Neural Emission Engine ============
    
    function calculateEmission(uint256 totalSupply, uint256 stakedAmount) external view override returns (uint256) {
        // Dynamic emission based on staking ratio
        uint256 stakingRatio = stakedAmount.mul(100).div(totalSupply);
        
        // Higher staking = lower emission (deflationary pressure)
        // Lower staking = higher emission (incentive to stake)
        if (stakingRatio >= targetSupplyRatio) {
            return totalSupply.mul(maxEmissionRate.div(2)).div(10000).div(365 days / updateInterval);
        } else {
            return totalSupply.mul(maxEmissionRate).div(10000).div(365 days / updateInterval);
        }
    }
    
    function requestMint(uint256 amount) external override onlyModule {
        require(validateMintRequest(amount), "AIEngine: mint request invalid");
        neuronToken.mint(address(treasury), amount);
        emit EmissionCalculated(amount, block.timestamp);
    }
    
    function requestBurn(uint256 amount) external override onlyModule {
        // Burn from treasury
        neuronToken.burnFrom(address(treasury), amount);
    }
    
    // ============ ALS - Adaptive Liquidity Stabilizer ============
    
    function checkPriceStability() external view override returns (bool isStable, uint256 deviation) {
        uint256 currentPrice = getCurrentPrice();
        uint256 targetPrice = 1e18; // $1.00
        
        if (currentPrice >= targetPrice) {
            deviation = currentPrice.sub(targetPrice).mul(100).div(targetPrice);
        } else {
            deviation = targetPrice.sub(currentPrice).mul(100).div(targetPrice);
        }
        
        isStable = deviation <= 5; // Within 5% is stable
        return (isStable, deviation);
    }
    
    function triggerBuyback(uint256 amount) external override onlyModule {
        treasury.executeBuyback(amount);
        emit BuybackTriggered(amount, getCurrentPrice());
    }
    
    function triggerSellPressure(uint256 amount) external override onlyModule {
        // Sell tokens from treasury to stabilize price if too high
        // Implementation depends on DEX integration
        treasury.withdraw(address(neuronToken), amount, address(this));
        // Execute sell on DEX (simplified)
    }
    
    // ============ ARP - Auto Reinvest Protocol ============
    
    function collectFees() external override onlyModule {
        // Collect fees from various sources
        // This would integrate with fee collection mechanisms
        emit FeesCollected(0); // Amount would be calculated
    }
    
    function reinvestToLiquidity(uint256 amount) external override onlyModule {
        // Reinvest collected fees to liquidity pools
        treasury.addLiquidity(amount.div(2), amount.div(2));
    }
    
    function distributeToTreasury(uint256 amount) external override onlyModule {
        // Distribute fees to treasury for backing
        // Implementation depends on fee sources
    }
    
    // ============ SIG - Supply Integrity Guard ============
    
    function validateMintRequest(uint256 amount) public view override returns (bool) {
        uint256 currentSupply = neuronToken.totalSupply();
        uint256 maxSupply = 100000000 * 10**18; // 100M max supply cap
        
        if (currentSupply.add(amount) > maxSupply) {
            return false;
        }
        
        // Check treasury backing ratio
        uint256 treasuryValue = treasury.getTotalValueLocked();
        uint256 requiredBacking = currentSupply.add(amount).mul(30).div(100); // 30% backing required
        
        return treasuryValue >= requiredBacking;
    }
    
    function validateSupplyHealth() external view override returns (bool) {
        uint256 supply = neuronToken.totalSupply();
        uint256 staked = stakingContract.globalTotalStaked();
        
        // Healthy if at least 30% of supply is staked
        return staked.mul(100).div(supply) >= 30;
    }
    
    function getMaxMintable() external view override returns (uint256) {
        uint256 currentSupply = neuronToken.totalSupply();
        uint256 maxSupply = 100000000 * 10**18; // 100M max
        
        if (currentSupply >= maxSupply) return 0;
        return maxSupply.sub(currentSupply);
    }
    
    // ============ ALP - Adaptive Logic Predictor ============
    
    function adjustEmissionRate() external override onlyModule {
        // Adjust emission based on system health
        uint256 health = getSystemHealth();
        
        if (health > 80) {
            // Healthy system - reduce emission
            maxEmissionRate = maxEmissionRate.mul(95).div(100);
        } else if (health < 40) {
            // Unhealthy system - increase incentives
            maxEmissionRate = maxEmissionRate.mul(105).div(100);
            if (maxEmissionRate > 2000) maxEmissionRate = 2000; // Cap at 20%
        }
        
        emit ParametersAdjusted(maxEmissionRate, 0);
    }
    
    function adjustRewardRates() external override onlyModule {
        // Adjust staking rewards based on participation
        // Implementation would call staking contract
        emit ParametersAdjusted(maxEmissionRate, 0);
    }
    
    function getSystemHealth() public view override returns (uint256 healthScore) {
        uint256 supply = neuronToken.totalSupply();
        uint256 staked = stakingContract.globalTotalStaked();
        
        if (supply == 0) return 0;
        
        // Staking ratio (0-40 points)
        uint256 stakingRatio = staked.mul(100).div(supply);
        uint256 stakingScore = stakingRatio.mul(40).div(100);
        if (stakingScore > 40) stakingScore = 40;
        
        // Treasury backing (0-30 points)
        uint256 treasuryValue = treasury.getTotalValueLocked();
        uint256 backingRatio = supply > 0 ? treasuryValue.mul(100).div(supply) : 0;
        uint256 backingScore = backingRatio.mul(30).div(50); // 50% backing = full score
        if (backingScore > 30) backingScore = 30;
        
        // Price stability (0-30 points)
        (bool isStable, uint256 deviation) = this.checkPriceStability();
        uint256 stabilityScore = isStable ? 30 : deviation > 20 ? 10 : 20;
        
        healthScore = stakingScore.add(backingScore).add(stabilityScore);
        return healthScore;
    }
    
    // ============ Helper Functions ============
    
    function getCurrentPrice() public view returns (uint256) {
        // In production: integrate with Chainlink or DEX oracle
        // For now, return simulated price based on treasury backing
        uint256 supply = neuronToken.totalSupply();
        uint256 treasuryValue = treasury.getTotalValueLocked();
        
        if (supply == 0) return 1e18;
        
        return treasuryValue.mul(1e18).div(supply);
    }
    
    function triggerSystemUpdate() external {
        require(block.timestamp >= lastSystemUpdate.add(updateInterval), "AIEngine: update too soon");
        
        uint256 health = getSystemHealth();
        
        // Run all AI modules
        this.adjustEmissionRate();
        this.adjustRewardRates();
        
        // Check price stability and act if needed
        (bool isStable, ) = this.checkPriceStability();
        if (!isStable) {
            // Trigger stabilization
            uint256 treasuryBalance = treasury.getBalance(address(neuronToken));
            if (treasuryBalance > 0) {
                this.triggerBuyback(treasuryBalance.div(10)); // Use 10% of treasury
            }
        }
        
        lastSystemUpdate = block.timestamp;
        emit SystemUpdateTriggered(block.timestamp, health);
    }
    
    // ============ Admin Functions ============
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AIEngine: zero address");
        pendingOwner = newOwner;
    }
    
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "AIEngine: not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
    
    function setModule(string calldata moduleName, address moduleAddress) external onlyOwner {
        if (keccak256(bytes(moduleName)) == keccak256(bytes("NEE"))) {
            neeModule = moduleAddress;
        } else if (keccak256(bytes(moduleName)) == keccak256(bytes("ALS"))) {
            alsModule = moduleAddress;
        } else if (keccak256(bytes(moduleName)) == keccak256(bytes("ARP"))) {
            arpModule = moduleAddress;
        } else if (keccak256(bytes(moduleName)) == keccak256(bytes("SIG"))) {
            sigModule = moduleAddress;
        } else if (keccak256(bytes(moduleName)) == keccak256(bytes("ALP"))) {
            alpModule = moduleAddress;
        } else {
            revert("AIEngine: invalid module name");
        }
        emit ModuleUpdated(moduleName, moduleAddress);
    }
    
    function setCoreContracts(address _token, address _treasury, address _staking) external onlyOwner {
        neuronToken = INeuronToken(_token);
        treasury = ITreasury(_treasury);
        stakingContract = IStaking(_staking);
    }
    
    function setUpdateInterval(uint256 interval) external onlyOwner {
        updateInterval = interval;
    }
    
    function setTargetSupplyRatio(uint256 ratio) external onlyOwner {
        require(ratio <= 100, "AIEngine: invalid ratio");
        targetSupplyRatio = ratio;
    }
}
