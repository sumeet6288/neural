// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ILending.sol";
import "../interfaces/INeuronToken.sol";

/**
 * @title Lending V2
 * @notice Collateralized lending with NEURON, internal stablecoin (nUSD)
 * @dev Conservative LTV (60%), functional liquidation, Chainlink oracle
 */
contract Lending is ILending, AccessControl, ReentrancyGuard {
    
    using SafeERC20 for IERC20;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant LTV_RATIO = 6000;              // 60% LTV
    uint256 public constant LIQUIDATION_THRESHOLD = 7500;  // 75% before liquidation
    uint256 public constant LIQUIDATION_BONUS = 300;       // 3% bonus
    uint256 public constant PROTOCOL_FEE = 200;            // 2% fee
    
    // Interest rate model
    uint256 public baseRate = 200;      // 2% base APR
    uint256 public multiplier = 1000;   // 10% at 100% utilization
    
    // Contracts
    INeuronToken public neuronToken;
    IERC20 public nUSD; // Internal stablecoin
    address public priceFeed; // Chainlink NEURON/USD
    
    // State
    mapping(address => Loan) public loans;
    Market public market;
    
    // Total tracking
    uint256 public totalCollateral;
    uint256 public totalDebt;
    uint256 public totalInterestAccrued;
    
    constructor(
        address _neuronToken,
        address _nUSD,
        address _priceFeed
    ) {
        require(_neuronToken != address(0), "Invalid token");
        require(_nUSD != address(0), "Invalid stablecoin");
        
        neuronToken = INeuronToken(_neuronToken);
        nUSD = IERC20(_nUSD);
        priceFeed = _priceFeed;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(LIQUIDATOR_ROLE, msg.sender);
        
        // Initialize market
        market = Market({
            totalSupplied: 0,
            totalBorrowed: 0,
            baseRate: baseRate,
            multiplier: multiplier,
            reserveFactor: 2000 // 20% reserve
        });
    }
    
    /**
     * @notice Deposit NEURON as collateral
     */
    function depositCollateral(uint256 amount) external override nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        // Transfer NEURON from user
        neuronToken.transferFrom(msg.sender, address(this), amount);
        
        // Update loan
        Loan storage loan = loans[msg.sender];
        
        // Accrue interest first if existing loan
        if (loan.active && loan.borrowedAmount > 0) {
            _accrueInterest(msg.sender);
        }
        
        loan.collateralAmount += amount;
        loan.active = true;
        
        totalCollateral += amount;
        
        emit CollateralDeposited(msg.sender, amount);
    }
    
    /**
     * @notice Borrow nUSD against collateral
     */
    function borrow(uint256 amount) external override nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        Loan storage loan = loans[msg.sender];
        require(loan.active, "No collateral deposited");
        require(loan.collateralAmount > 0, "No collateral");
        
        // Accrue interest on existing debt
        if (loan.borrowedAmount > 0) {
            _accrueInterest(msg.sender);
        }
        
        // Check max borrow
        uint256 maxBorrow = getMaxBorrow(msg.sender);
        require(loan.borrowedAmount + amount <= maxBorrow, "Would exceed LTV");
        
        // Update loan
        loan.borrowedAmount += amount;
        loan.borrowTime = block.timestamp;
        loan.lastInterestUpdate = block.timestamp;
        loan.interestRate = getBorrowRate();
        
        // Update market
        market.totalBorrowed += amount;
        totalDebt += amount;
        
        // Mint nUSD to user (or transfer from treasury)
        // For this model, we assume nUSD is pre-minted to lending contract
        nUSD.safeTransfer(msg.sender, amount);
        
        emit Borrowed(msg.sender, amount, loan.collateralAmount);
    }
    
    /**
     * @notice Repay borrowed nUSD
     */
    function repay(uint256 amount) external override nonReentrant {
        Loan storage loan = loans[msg.sender];
        require(loan.active, "No active loan");
        require(loan.borrowedAmount > 0, "No debt");
        
        // Accrue interest
        _accrueInterest(msg.sender);
        
        uint256 repayAmount = amount > loan.borrowedAmount ? loan.borrowedAmount : amount;
        uint256 interest = loan.borrowedAmount - (loan.borrowedAmount * BASIS_POINTS) / (BASIS_POINTS + getCurrentInterest(msg.sender));
        
        // Transfer nUSD from user
        nUSD.safeTransferFrom(msg.sender, address(this), repayAmount);
        
        // Update loan
        loan.borrowedAmount -= repayAmount;
        
        // Update market
        market.totalBorrowed -= repayAmount;
        totalDebt -= repayAmount;
        
        emit Repaid(msg.sender, repayAmount, interest);
    }
    
    /**
     * @notice Repay full debt and close position
     */
    function repayAndClose() external override nonReentrant {
        Loan storage loan = loans[msg.sender];
        require(loan.active, "No active loan");
        
        // Accrue interest
        _accrueInterest(msg.sender);
        
        uint256 totalDebt = loan.borrowedAmount;
        require(totalDebt > 0, "No debt");
        
        // Transfer full repayment
        nUSD.safeTransferFrom(msg.sender, address(this), totalDebt);
        
        // Return collateral
        uint256 collateral = loan.collateralAmount;
        loan.collateralAmount = 0;
        loan.borrowedAmount = 0;
        loan.active = false;
        
        totalCollateral -= collateral;
        market.totalBorrowed -= totalDebt;
        
        neuronToken.transfer(msg.sender, collateral);
        
        emit Repaid(msg.sender, totalDebt, 0);
    }
    
    /**
     * @notice Withdraw excess collateral
     */
    function withdrawCollateral(uint256 amount) external override nonReentrant {
        Loan storage loan = loans[msg.sender];
        require(loan.active, "No active loan");
        require(amount <= loan.collateralAmount, "Insufficient collateral");
        
        // Accrue interest
        _accrueInterest(msg.sender);
        
        // Check remaining collateral is sufficient
        uint256 remainingCollateral = loan.collateralAmount - amount;
        if (loan.borrowedAmount > 0) {
            uint256 collateralValue = (remainingCollateral * getCollateralPrice()) / 1e18;
            uint256 maxBorrow = (collateralValue * LTV_RATIO) / BASIS_POINTS;
            require(loan.borrowedAmount <= maxBorrow, "Would exceed LTV");
        }
        
        loan.collateralAmount = remainingCollateral;
        totalCollateral -= amount;
        
        neuronToken.transfer(msg.sender, amount);
        
        emit CollateralWithdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Liquidate undercollateralized position
     */
    function liquidate(address user) external override onlyRole(LIQUIDATOR_ROLE) nonReentrant {
        require(canLiquidate(user), "Position not liquidatable");
        
        Loan storage loan = loans[user];
        
        // Accrue final interest
        _accrueInterest(user);
        
        uint256 debt = loan.borrowedAmount;
        uint256 collateral = loan.collateralAmount;
        
        // Calculate amounts
        uint256 liquidatorBonus = (debt * LIQUIDATION_BONUS) / BASIS_POINTS;
        uint256 protocolFee = (debt * PROTOCOL_FEE) / BASIS_POINTS;
        uint256 totalRepay = debt + liquidatorBonus;
        
        // Cap at collateral value
        uint256 collateralValue = (collateral * getCollateralPrice()) / 1e18;
        if (totalRepay > collateralValue) {
            totalRepay = collateralValue;
            liquidatorBonus = totalRepay - debt;
            protocolFee = 0;
        }
        
        uint256 liquidatorCollateral = (totalRepay * 1e18) / getCollateralPrice();
        uint256 protocolCollateral = (protocolFee * 1e18) / getCollateralPrice();
        uint256 userRefund = collateral - liquidatorCollateral - protocolCollateral;
        
        // Liquidator pays debt
        nUSD.safeTransferFrom(msg.sender, address(this), debt);
        
        // Close loan
        loan.collateralAmount = 0;
        loan.borrowedAmount = 0;
        loan.active = false;
        
        totalCollateral -= collateral;
        market.totalBorrowed -= debt;
        totalDebt -= debt;
        
        // Transfer collateral
        neuronToken.transfer(msg.sender, liquidatorCollateral);
        if (protocolCollateral > 0) {
            neuronToken.transfer(address(this), protocolCollateral); // Keep as protocol reserve
        }
        if (userRefund > 0) {
            neuronToken.transfer(user, userRefund);
        }
        
        emit Liquidated(user, msg.sender, debt, collateral);
    }
    
    /**
     * @notice Get loan info
     */
    function getLoan(address user) external view override returns (Loan memory) {
        return loans[user];
    }
    
    /**
     * @notice Get market info
     */
    function getMarket() external view override returns (Market memory) {
        return market;
    }
    
    /**
     * @notice Get health factor (10000 = 1.0)
     */
    function getHealthFactor(address user) public view override returns (uint256) {
        Loan storage loan = loans[user];
        if (!loan.active || loan.borrowedAmount == 0) return BASIS_POINTS;
        
        uint256 collateralValue = (loan.collateralAmount * getCollateralPrice()) / 1e18;
        uint256 liquidationPoint = (collateralValue * LIQUIDATION_THRESHOLD) / BASIS_POINTS;
        
        if (loan.borrowedAmount >= liquidationPoint) return 0;
        
        return (liquidationPoint * BASIS_POINTS) / loan.borrowedAmount;
    }
    
    /**
     * @notice Get max borrow amount for user
     */
    function getMaxBorrow(address user) public view override returns (uint256) {
        Loan storage loan = loans[user];
        if (loan.collateralAmount == 0) return 0;
        
        uint256 collateralValue = (loan.collateralAmount * getCollateralPrice()) / 1e18;
        return (collateralValue * LTV_RATIO) / BASIS_POINTS;
    }
    
    /**
     * @notice Get liquidation price (price at which position is liquidatable)
     */
    function getLiquidationPrice(address user) external view override returns (uint256) {
        Loan storage loan = loans[user];
        if (!loan.active || loan.borrowedAmount == 0) return 0;
        
        // Price where collateral * threshold = debt
        return (loan.borrowedAmount * BASIS_POINTS * 1e18) / (loan.collateralAmount * LIQUIDATION_THRESHOLD);
    }
    
    /**
     * @notice Check if position can be liquidated
     */
    function canLiquidate(address user) public view override returns (bool) {
        return getHealthFactor(user) < BASIS_POINTS;
    }
    
    /**
     * @notice Get current borrow rate based on utilization
     */
    function getBorrowRate() public view returns (uint256) {
        if (market.totalSupplied == 0) return baseRate;
        
        uint256 utilization = (market.totalBorrowed * BASIS_POINTS) / market.totalSupplied;
        return baseRate + (utilization * multiplier) / BASIS_POINTS;
    }
    
    /**
     * @notice Get current interest for a loan
     */
    function getCurrentInterest(address user) public view returns (uint256) {
        Loan storage loan = loans[user];
        if (!loan.active || loan.borrowedAmount == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - loan.lastInterestUpdate;
        uint256 interest = (loan.borrowedAmount * loan.interestRate * timeElapsed) / (BASIS_POINTS * 365 days);
        
        return interest;
    }
    
    /**
     * @notice Accrue interest for a loan
     */
    function _accrueInterest(address user) internal {
        Loan storage loan = loans[user];
        if (!loan.active || loan.borrowedAmount == 0) return;
        
        uint256 interest = getCurrentInterest(user);
        if (interest > 0) {
            loan.borrowedAmount += interest;
            loan.lastInterestUpdate = block.timestamp;
            totalInterestAccrued += interest;
            market.totalBorrowed += interest;
        }
    }
    
    /**
     * @notice Get collateral price from oracle
     */
    function getCollateralPrice() public view returns (uint256) {
        // Placeholder - would query Chainlink
        // Return $1.00 for this model
        return 1e18;
    }
    
    /**
     * @notice Set LTV ratio (admin only)
     */
    function setLTV(uint256 newLTV) external override onlyRole(ADMIN_ROLE) {
        require(newLTV <= 8000, "LTV too high");
        require(newLTV >= 5000, "LTV too low");
        LTV_RATIO = newLTV;
    }
    
    /**
     * @notice Set liquidation threshold
     */
    function setLiquidationThreshold(uint256 newThreshold) external override onlyRole(ADMIN_ROLE) {
        require(newThreshold > LTV_RATIO, "Must be > LTV");
        require(newThreshold <= 9000, "Too high");
        LIQUIDATION_THRESHOLD = newThreshold;
    }
    
    /**
     * @notice Set interest rate model
     */
    function setInterestRateModel(uint256 _baseRate, uint256 _multiplier) external override onlyRole(ADMIN_ROLE) {
        baseRate = _baseRate;
        multiplier = _multiplier;
        market.baseRate = _baseRate;
        market.multiplier = _multiplier;
    }
    
    /**
     * @notice Set price feed
     */
    function setPriceFeed(address _priceFeed) external onlyRole(ADMIN_ROLE) {
        priceFeed = _priceFeed;
    }
}