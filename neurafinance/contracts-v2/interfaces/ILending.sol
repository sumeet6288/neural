// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ILending {
    // Structs
    struct Loan {
        uint256 collateralAmount;
        uint256 borrowedAmount;
        uint256 borrowTime;
        uint256 interestRate;      // In basis points
        uint256 lastInterestUpdate;
        bool active;
    }
    
    struct Market {
        uint256 totalSupplied;
        uint256 totalBorrowed;
        uint256 baseRate;          // In basis points
        uint256 multiplier;        // In basis points
        uint256 reserveFactor;     // In basis points
    }
    
    // Events
    event CollateralDeposited(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount, uint256 collateral);
    event Repaid(address indexed user, uint256 amount, uint256 interest);
    event Liquidated(address indexed user, address indexed liquidator, uint256 debt, uint256 collateral);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    
    // View functions
    function getLoan(address user) external view returns (Loan memory);
    function getMarket() external view returns (Market memory);
    function getHealthFactor(address user) external view returns (uint256); // In basis points
    function getMaxBorrow(address user) external view returns (uint256);
    function getLiquidationPrice(address user) external view returns (uint256);
    function canLiquidate(address user) external view returns (bool);
    
    // User functions
    function depositCollateral(uint256 amount) external;
    function borrow(uint256 amount) external;
    function repay(uint256 amount) external;
    function repayAndClose() external;
    function withdrawCollateral(uint256 amount) external;
    
    // Liquidation
    function liquidate(address user) external;
    
    // Admin
    function setLTV(uint256 newLTV) external;
    function setLiquidationThreshold(uint256 newThreshold) external;
    function setInterestRateModel(uint256 baseRate, uint256 multiplier) external;
}