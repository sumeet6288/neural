// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ILending {
    struct Loan {
        uint256 id;
        address borrower;
        address collateralToken; // Added to track which token was used as collateral
        uint256 collateralAmount;
        uint256 borrowedAmount;
        uint256 interestRate;
        uint256 startTime;
        uint256 dueTime;
        uint256 totalRepaid;
        bool active;
        bool liquidated;
    }
    
    struct CollateralAsset {
        address token;
        uint256 ltvRatio;
        uint256 liquidationThreshold;
        uint256 interestRate;
        bool active;
    }
    
    function depositCollateral(address token, uint256 amount) external;
    function borrow(address collateralToken, uint256 collateralAmount, uint256 borrowAmount) external returns (uint256 loanId);
    function repay(uint256 loanId, uint256 amount) external;
    function liquidate(uint256 loanId) external;
    function getLoan(uint256 loanId) external view returns (Loan memory);
    function getCollateralValue(address user, address token) external view returns (uint256);
    function getMaxBorrowAmount(address token, uint256 collateralAmount) external view returns (uint256);
    function getHealthFactor(uint256 loanId) external view returns (uint256);
    
    event CollateralDeposited(address indexed user, address indexed token, uint256 amount);
    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 collateralAmount, uint256 borrowedAmount);
    event LoanRepaid(uint256 indexed loanId, uint256 amount);
    event LoanLiquidated(uint256 indexed loanId, address indexed liquidator);
}
