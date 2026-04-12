// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ITreasury {
    function deposit(address token, uint256 amount) external;
    function withdraw(address token, uint256 amount, address recipient) external;
    function executeBuyback(uint256 amount) external;
    function addLiquidity(uint256 tokenAmount, uint256 stableAmount) external;
    function getBalance(address token) external view returns (uint256);
    function getTotalValueLocked() external view returns (uint256);
    
    event Deposit(address indexed token, uint256 amount, address indexed from);
    event Withdrawal(address indexed token, uint256 amount, address indexed to);
    event BuybackExecuted(uint256 amount, uint256 price);
    event LiquidityAdded(uint256 tokenAmount, uint256 stableAmount);
}
