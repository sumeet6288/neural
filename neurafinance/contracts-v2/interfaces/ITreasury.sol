// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ITreasury {
    // Events
    event Deposit(address indexed token, uint256 amount, uint256 value);
    event Withdrawal(address indexed token, uint256 amount, address indexed recipient);
    event BuybackExecuted(uint256 neuronAmount, uint256 cost);
    event StabilizationExecuted(bool isBuy, uint256 amount);
    event RewardsFunded(uint256 amount);
    
    // View functions
    function getTreasuryValue() external view returns (uint256);
    function getTokenValue(address token) external view returns (uint256);
    function getBackingRatio() external view returns (uint256); // In basis points
    function canBuyback(uint256 neuronAmount) external view returns (bool);
    
    // Deposit functions
    function depositETH() external payable;
    function depositToken(address token, uint256 amount) external;
    
    // Buyback/Stabilization
    function executeBuyback(uint256 neuronAmount) external;
    function executeStabilization() external;
    
    // Funding
    function fundRewards(uint256 amount) external;
    function fundReferralRewards(uint256 amount) external;
    
    // Admin
    function addSupportedToken(address token, address priceFeed) external;
    function removeSupportedToken(address token) external;
    function emergencyWithdraw(address token, uint256 amount, address recipient) external;
}