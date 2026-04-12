// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/ITreasury.sol";
import "../interfaces/INeuronToken.sol";
import "../interfaces/IStablecoin.sol";
import "../libraries/SafeMath.sol";

contract Treasury is ITreasury {
    using SafeMath for uint256;
    
    address public owner;
    address public pendingOwner;
    
    // Core tokens
    INeuronToken public neuronToken;
    IStablecoin public stablecoin;
    
    // Supported stablecoins
    mapping(address => bool) public supportedStables;
    mapping(address => uint256) public balances;
    
    // Authorized callers
    mapping(address => bool) public authorizedCallers;
    
    // Buyback configuration
    uint256 public buybackThreshold = 80; // 80% of peg
    uint256 public buybackCooldown = 1 days;
    uint256 public lastBuybackTime;
    
    // Liquidity management
    uint256 public liquidityReserveRatio = 30; // 30% reserved for liquidity
    
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event CallerAuthorized(address indexed caller);
    event CallerRevoked(address indexed caller);
    event StablecoinAdded(address indexed token);
    event StablecoinRemoved(address indexed token);
    event BuybackThresholdUpdated(uint256 threshold);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Treasury: not owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedCallers[msg.sender], "Treasury: not authorized");
        _;
    }
    
    constructor(address _neuronToken, address _stablecoin) {
        owner = msg.sender;
        neuronToken = INeuronToken(_neuronToken);
        stablecoin = IStablecoin(_stablecoin);
    }
    
    receive() external payable {}
    
    function deposit(address token, uint256 amount) external override {
        require(supportedStables[token] || token == address(neuronToken), "Treasury: unsupported token");
        require(amount > 0, "Treasury: zero amount");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        balances[token] = balances[token].add(amount);
        
        emit Deposit(token, amount, msg.sender);
    }
    
    function withdraw(address token, uint256 amount, address recipient) external override onlyAuthorized {
        require(recipient != address(0), "Treasury: zero recipient");
        require(balances[token] >= amount, "Treasury: insufficient balance");
        
        balances[token] = balances[token].sub(amount);
        IERC20(token).transfer(recipient, amount);
        
        emit Withdrawal(token, amount, recipient);
    }
    
    function executeBuyback(uint256 amount) external override onlyAuthorized {
        require(block.timestamp >= lastBuybackTime.add(buybackCooldown), "Treasury: buyback on cooldown");
        require(amount > 0, "Treasury: zero amount");
        
        // Get the price from oracle (simplified - in production use Chainlink)
        uint256 currentPrice = getTokenPrice();
        require(currentPrice <= buybackThreshold.mul(1e18).div(100), "Treasury: price above threshold");
        
        // Execute buyback using stable reserves
        address primaryStable = getPrimaryStable();
        require(balances[primaryStable] >= amount, "Treasury: insufficient stable reserves");
        
        // Transfer to DEX for buyback (simplified)
        balances[primaryStable] = balances[primaryStable].sub(amount);
        
        lastBuybackTime = block.timestamp;
        emit BuybackExecuted(amount, currentPrice);
    }
    
    function addLiquidity(uint256 tokenAmount, uint256 stableAmount) external override onlyAuthorized {
        require(tokenAmount > 0 && stableAmount > 0, "Treasury: zero amounts");
        
        address primaryStable = getPrimaryStable();
        require(balances[address(neuronToken)] >= tokenAmount, "Treasury: insufficient token balance");
        require(balances[primaryStable] >= stableAmount, "Treasury: insufficient stable balance");
        
        balances[address(neuronToken)] = balances[address(neuronToken)].sub(tokenAmount);
        balances[primaryStable] = balances[primaryStable].sub(stableAmount);
        
        // Add to DEX liquidity pool (simplified - would integrate with DEX router)
        emit LiquidityAdded(tokenAmount, stableAmount);
    }
    
    function getBalance(address token) external view override returns (uint256) {
        return balances[token];
    }
    
    function getTotalValueLocked() external view override returns (uint256) {
        uint256 totalValue = 0;
        
        // Add NEURON token value
        uint256 neuronBalance = balances[address(neuronToken)];
        uint256 neuronPrice = getTokenPrice();
        totalValue = totalValue.add(neuronBalance.mul(neuronPrice).div(1e18));
        
        // Add stablecoin values (assuming 1:1 with USD)
        // In production, would iterate through supported stables
        
        return totalValue;
    }
    
    function getTokenPrice() public view returns (uint256) {
        // In production: integrate with Chainlink or DEX oracle
        // For now, return mock price
        return 1e18; // $1.00
    }
    
    function getPrimaryStable() public view returns (address) {
        // Return the primary stablecoin (USDC preferred)
        // Simplified - in production would have a list
        return address(stablecoin);
    }
    
    // Admin functions
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Treasury: zero address");
        pendingOwner = newOwner;
    }
    
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Treasury: not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
    
    function authorizeCaller(address caller) external onlyOwner {
        authorizedCallers[caller] = true;
        emit CallerAuthorized(caller);
    }
    
    function revokeCaller(address caller) external onlyOwner {
        authorizedCallers[caller] = false;
        emit CallerRevoked(caller);
    }
    
    function addSupportedStable(address token) external onlyOwner {
        supportedStables[token] = true;
        emit StablecoinAdded(token);
    }
    
    function removeSupportedStable(address token) external onlyOwner {
        supportedStables[token] = false;
        emit StablecoinRemoved(token);
    }
    
    function setBuybackThreshold(uint256 threshold) external onlyOwner {
        require(threshold <= 100, "Treasury: invalid threshold");
        buybackThreshold = threshold;
        emit BuybackThresholdUpdated(threshold);
    }
    
    function setBuybackCooldown(uint256 cooldown) external onlyOwner {
        buybackCooldown = cooldown;
    }
    
    function setLiquidityReserveRatio(uint256 ratio) external onlyOwner {
        require(ratio <= 100, "Treasury: invalid ratio");
        liquidityReserveRatio = ratio;
    }
    
    function emergencyWithdraw(address token, uint256 amount, address recipient) external onlyOwner {
        require(recipient != address(0), "Treasury: zero recipient");
        IERC20(token).transfer(recipient, amount);
    }
}
