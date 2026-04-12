// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ITreasury.sol";
import "../interfaces/INeuronToken.sol";

/**
 * @title Treasury V2
 * @notice Multi-asset treasury with buyback, stabilization, and backing management
 * @dev All rewards funded from here, not minted
 */
contract Treasury is ITreasury, AccessControl, ReentrancyGuard {
    
    using SafeERC20 for IERC20;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant BUYBACK_ROLE = keccak256("BUYBACK_ROLE");
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant TARGET_BACKING_RATIO = 3000; // 30%
    uint256 public constant MAX_BUYBACK_PERCENT = 1000;   // 10% of treasury
    
    // Contracts
    INeuronToken public neuronToken;
    address public staking;
    address public referral;
    
    // Supported tokens and price feeds
    struct TokenInfo {
        bool supported;
        address priceFeed;
        uint256 decimals;
    }
    mapping(address => TokenInfo) public tokenInfo;
    address[] public supportedTokens;
    
    // Reserves
    uint256 public constant LIQUIDITY_RESERVE_RATIO = 2500; // 25%
    uint256 public constant REWARD_RESERVE_RATIO = 5000;    // 50%
    
    // Tracking
    uint256 public totalValueLocked;
    uint256 public totalRewardsDistributed;
    uint256 public totalReferralRewards;
    uint256 public totalBuybacks;
    
    // Events
    event TokenAdded(address token, address priceFeed);
    event TokenRemoved(address token);
    
    constructor(address _neuronToken) {
        require(_neuronToken != address(0), "Invalid token");
        neuronToken = INeuronToken(_neuronToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(BUYBACK_ROLE, msg.sender);
        _grantRole(REWARD_MANAGER_ROLE, msg.sender);
    }
    
    /**
     * @notice Deposit ETH to treasury
     */
    function depositETH() external payable override {
        require(msg.value > 0, "Must send ETH");
        
        // ETH is always supported with price = 1 (for simplicity)
        uint256 value = msg.value; // Assume 1 ETH = $1 for this model
        totalValueLocked += value;
        
        emit Deposit(address(0), msg.value, value);
    }
    
    /**
     * @notice Deposit ERC20 tokens to treasury
     */
    function depositToken(address token, uint256 amount) external override {
        require(tokenInfo[token].supported, "Token not supported");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 value = getTokenValue(token) * amount / (10 ** tokenInfo[token].decimals);
        totalValueLocked += value;
        
        emit Deposit(token, amount, value);
    }
    
    /**
     * @notice Execute buyback: Buy NEURON from market and burn
     */
    function executeBuyback(uint256 neuronAmount) external override onlyRole(BUYBACK_ROLE) nonReentrant {
        require(canBuyback(neuronAmount), "Cannot execute buyback");
        
        // Calculate cost (assume $1 per NEURON for simplicity)
        uint256 cost = neuronAmount; // In wei units
        
        // Check we have enough reserves
        require(address(this).balance >= cost, "Insufficient ETH reserves");
        
        // Transfer NEURON from market (placeholder - would use DEX)
        // For now, burn from treasury holdings if available
        uint256 treasuryBalance = neuronToken.balanceOf(address(this));
        uint256 burnAmount = neuronAmount > treasuryBalance ? treasuryBalance : neuronAmount;
        
        if (burnAmount > 0) {
            neuronToken.burn(burnAmount);
            totalBuybacks += burnAmount;
        }
        
        emit BuybackExecuted(neuronAmount, cost);
    }
    
    /**
     * @notice Execute price stabilization
     */
    function executeStabilization() external override onlyRole(BUYBACK_ROLE) {
        // Placeholder for full stabilization logic
        emit StabilizationExecuted(true, 0);
    }
    
    /**
     * @notice Fund rewards for staking (called by Staking contract)
     */
    function fundRewards(uint256 amount) external override onlyRole(REWARD_MANAGER_ROLE) {
        require(amount <= getAvailableRewards(), "Insufficient reward reserves");
        
        // Approve staking contract to pull rewards
        neuronToken.approve(msg.sender, amount);
        totalRewardsDistributed += amount;
        
        emit RewardsFunded(amount);
    }
    
    /**
     * @notice Fund referral rewards
     */
    function fundReferralRewards(uint256 amount) external override onlyRole(REWARD_MANAGER_ROLE) {
        require(amount <= getAvailableRewards(), "Insufficient reward reserves");
        require(referral != address(0), "Referral not set");
        
        neuronToken.transfer(referral, amount);
        totalReferralRewards += amount;
    }
    
    /**
     * @notice Get total treasury value in USD
     */
    function getTreasuryValue() external view override returns (uint256) {
        uint256 total = address(this).balance; // ETH value
        
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            address token = supportedTokens[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            uint256 value = (balance * getTokenValue(token)) / (10 ** tokenInfo[token].decimals);
            total += value;
        }
        
        return total;
    }
    
    /**
     * @notice Get value of specific token holdings
     */
    function getTokenValue(address token) public view override returns (uint256) {
        if (token == address(0)) {
            // ETH - return 1e18 (assume $1 for model)
            return 1e18;
        }
        
        if (!tokenInfo[token].supported) return 0;
        
        // Placeholder - would query Chainlink price feed
        // For now, return 1e18 for all supported tokens
        return 1e18;
    }
    
    /**
     * @notice Get backing ratio (treasury value / market cap)
     */
    function getBackingRatio() external view override returns (uint256) {
        uint256 treasuryValue = this.getTreasuryValue();
        uint256 circulatingSupply = neuronToken.getCirculatingSupply();
        
        if (circulatingSupply == 0) return BASIS_POINTS; // 100%
        
        // Price from backing
        uint256 impliedPrice = (treasuryValue * 1e18) / circulatingSupply;
        uint256 marketCap = (circulatingSupply * impliedPrice) / 1e18;
        
        if (marketCap == 0) return BASIS_POINTS;
        
        return (treasuryValue * BASIS_POINTS) / marketCap;
    }
    
    /**
     * @notice Check if buyback can be executed
     */
    function canBuyback(uint256 neuronAmount) public view override returns (bool) {
        uint256 maxBuyback = (this.getTreasuryValue() * MAX_BUYBACK_PERCENT) / BASIS_POINTS;
        return neuronAmount <= maxBuyback && neuronAmount > 0;
    }
    
    /**
     * @notice Get available rewards from reserve
     */
    function getAvailableRewards() public view returns (uint256) {
        uint256 balance = neuronToken.balanceOf(address(this));
        return (balance * REWARD_RESERVE_RATIO) / BASIS_POINTS;
    }
    
    /**
     * @notice Add supported token
     */
    function addSupportedToken(
        address token,
        address priceFeed
    ) external override onlyRole(ADMIN_ROLE) {
        require(token != address(0), "Invalid token");
        require(!tokenInfo[token].supported, "Already supported");
        
        tokenInfo[token] = TokenInfo({
            supported: true,
            priceFeed: priceFeed,
            decimals: 18 // Assume 18 decimals
        });
        supportedTokens.push(token);
        
        emit TokenAdded(token, priceFeed);
    }
    
    /**
     * @notice Remove supported token
     */
    function removeSupportedToken(address token) external override onlyRole(ADMIN_ROLE) {
        require(tokenInfo[token].supported, "Not supported");
        
        tokenInfo[token].supported = false;
        
        // Remove from array
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == token) {
                supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                supportedTokens.pop();
                break;
            }
        }
        
        emit TokenRemoved(token);
    }
    
    /**
     * @notice Emergency withdraw (multisig required in production)
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address recipient
    ) external override onlyRole(ADMIN_ROLE) {
        require(recipient != address(0), "Invalid recipient");
        
        if (token == address(0)) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(recipient, amount);
        }
        
        emit Withdrawal(token, amount, recipient);
    }
    
    /**
     * @notice Set staking contract
     */
    function setStaking(address _staking) external onlyRole(ADMIN_ROLE) {
        staking = _staking;
    }
    
    /**
     * @notice Set referral contract
     */
    function setReferral(address _referral) external onlyRole(ADMIN_ROLE) {
        referral = _referral;
    }
    
    /**
     * @notice Receive ETH
     */
    receive() external payable {
        emit Deposit(address(0), msg.value, msg.value);
    }
}