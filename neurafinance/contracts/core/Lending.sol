// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/ILending.sol";
import "../interfaces/INeuronToken.sol";
import "../interfaces/IStablecoin.sol";
import "../interfaces/ITreasury.sol";
import "../libraries/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Lending is ILending, ReentrancyGuard {
    using SafeMath for uint256;
    
    // Loans storage
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoans;
    uint256 public loanCount;
    
    // Collateral assets
    mapping(address => CollateralAsset) public collateralAssets;
    address[] public supportedCollaterals;
    
    // User collateral deposits
    mapping(address => mapping(address => uint256)) public userCollateral;
    
    // Core contracts
    INeuronToken public neuronToken;
    IStablecoin public stablecoin;
    ITreasury public treasury;
    
    address public owner;
    address public pendingOwner;
    
    // Configuration
    uint256 public liquidationBonus = 500; // 5% bonus to liquidators
    uint256 public liquidationFee = 200; // 2% fee to protocol
    uint256 public constant PERCENT_DENOMINATOR = 10000;
    
    // Interest accrual
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    // Timelock for emergency operations
    uint256 public constant TIMELOCK_DELAY = 72 hours;
    mapping(bytes32 => uint256) public timelockExpiry;
    
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event CollateralAssetAdded(address indexed token, uint256 ltvRatio);
    event CollateralAssetUpdated(address indexed token, uint256 ltvRatio);
    event EmergencyWithdrawScheduled(bytes32 indexed requestId, address token, uint256 amount, uint256 executeAfter);
    event EmergencyWithdrawExecuted(bytes32 indexed requestId, address token, uint256 amount, address recipient);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Lending: not owner");
        _;
    }
    
    modifier validCollateral(address token) {
        require(collateralAssets[token].active, "Lending: invalid collateral");
        _;
    }
    
    constructor(address _neuronToken, address _stablecoin, address _treasury) {
        owner = msg.sender;
        neuronToken = INeuronToken(_neuronToken);
        stablecoin = IStablecoin(_stablecoin);
        treasury = ITreasury(_treasury);
    }
    
    function addCollateralAsset(
        address token,
        uint256 ltvRatio,
        uint256 liquidationThreshold,
        uint256 interestRate
    ) external onlyOwner {
        require(token != address(0), "Lending: zero address");
        require(ltvRatio <= 8000, "Lending: LTV too high"); // Max 80%
        require(liquidationThreshold > ltvRatio, "Lending: threshold must exceed LTV");
        
        collateralAssets[token] = CollateralAsset({
            token: token,
            ltvRatio: ltvRatio,
            liquidationThreshold: liquidationThreshold,
            interestRate: interestRate,
            active: true
        });
        
        supportedCollaterals.push(token);
        emit CollateralAssetAdded(token, ltvRatio);
    }
    
    function updateCollateralAsset(
        address token,
        uint256 ltvRatio,
        uint256 liquidationThreshold,
        uint256 interestRate,
        bool active
    ) external onlyOwner {
        require(collateralAssets[token].token != address(0), "Lending: asset not found");
        
        collateralAssets[token].ltvRatio = ltvRatio;
        collateralAssets[token].liquidationThreshold = liquidationThreshold;
        collateralAssets[token].interestRate = interestRate;
        collateralAssets[token].active = active;
        
        emit CollateralAssetUpdated(token, ltvRatio);
    }
    
    function depositCollateral(address token, uint256 amount) external override validCollateral(token) {
        require(amount > 0, "Lending: zero amount");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        userCollateral[msg.sender][token] = userCollateral[msg.sender][token].add(amount);
        
        emit CollateralDeposited(msg.sender, token, amount);
    }
    
    function borrow(
        address collateralToken,
        uint256 collateralAmount,
        uint256 borrowAmount
    ) external override validCollateral(collateralToken) returns (uint256) {
        require(collateralAmount > 0, "Lending: zero collateral");
        require(borrowAmount > 0, "Lending: zero borrow");
        
        CollateralAsset storage asset = collateralAssets[collateralToken];
        
        // Transfer collateral
        IERC20(collateralToken).transferFrom(msg.sender, address(this), collateralAmount);
        userCollateral[msg.sender][collateralToken] = userCollateral[msg.sender][collateralToken].add(collateralAmount);
        
        // Check max borrow
        uint256 maxBorrow = getMaxBorrowAmount(collateralToken, collateralAmount);
        require(borrowAmount <= maxBorrow, "Lending: exceeds max borrow");
        
        // Create loan
        uint256 loanId = loanCount++;
        uint256 dueTime = block.timestamp.add(90 days); // 90 day loan term
        
        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            collateralToken: collateralToken, // Track collateral token
            collateralAmount: collateralAmount,
            borrowedAmount: borrowAmount,
            interestRate: asset.interestRate,
            startTime: block.timestamp,
            dueTime: dueTime,
            totalRepaid: 0,
            active: true,
            liquidated: false
        });
        
        userLoans[msg.sender].push(loanId);
        
        // Mint stablecoin to borrower
        stablecoin.mint(msg.sender, borrowAmount);
        
        emit CollateralDeposited(msg.sender, collateralToken, collateralAmount);
        emit LoanCreated(loanId, msg.sender, collateralAmount, borrowAmount);
        
        return loanId;
    }
    
    function repay(uint256 loanId, uint256 amount) external override nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.active, "Lending: loan not active");
        require(!loan.liquidated, "Lending: loan liquidated");
        require(msg.sender == loan.borrower, "Lending: not borrower");
        require(amount > 0, "Lending: zero amount");
        
        uint256 totalOwed = getTotalOwed(loanId);
        uint256 repayAmount = amount > totalOwed ? totalOwed : amount;
        
        // Transfer stablecoin from borrower
        stablecoin.transferFrom(msg.sender, address(this), repayAmount);
        
        // Split repayment: principal to burn, interest to treasury
        uint256 interest = calculateInterest(loanId);
        uint256 principal = repayAmount > interest ? repayAmount.sub(interest) : 0;
        
        if (principal > 0) {
            stablecoin.burn(principal);
        }
        
        if (interest > 0) {
            stablecoin.transfer(address(treasury), interest);
        }
        
        loan.totalRepaid = loan.totalRepaid.add(repayAmount);
        
        // Check if fully repaid
        if (loan.totalRepaid >= totalOwed) {
            loan.active = false;
            
            // Return collateral
            _returnCollateral(loan.borrower, loan.collateralAmount, loanId);
        }
        
        emit LoanRepaid(loanId, repayAmount);
    }
    
    function liquidate(uint256 loanId) external override nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.active, "Lending: loan not active");
        require(!loan.liquidated, "Lending: already liquidated");
        
        uint256 healthFactor = getHealthFactor(loanId);
        require(healthFactor < 1e18, "Lending: loan healthy");
        
        loan.liquidated = true;
        loan.active = false;
        
        uint256 totalOwed = getTotalOwed(loanId);
        uint256 collateralValue = getCollateralValue(loan.borrower, address(neuronToken));
        
        // Liquidator pays debt
        stablecoin.transferFrom(msg.sender, address(this), totalOwed);
        stablecoin.burn(totalOwed);
        
        // Liquidator gets collateral with bonus
        uint256 liquidatorReward = loan.collateralAmount.mul(PERCENT_DENOMINATOR.add(liquidationBonus)).div(PERCENT_DENOMINATOR);
        uint256 protocolFee = loan.collateralAmount.mul(liquidationFee).div(PERCENT_DENOMINATOR);
        
        // Transfer to liquidator
        IERC20(loan.collateralToken).transfer(msg.sender, liquidatorReward);
        
        // Transfer fee to treasury
        if (protocolFee > 0) {
            IERC20(loan.collateralToken).transfer(address(treasury), protocolFee);
        }
        
        emit LoanLiquidated(loanId, msg.sender);
    }
    
    function _returnCollateral(address borrower, uint256 amount, uint256 loanId) internal {
        Loan storage loan = loans[loanId];
        IERC20(loan.collateralToken).transfer(borrower, amount);
    }
    
    function calculateInterest(uint256 loanId) public view returns (uint256) {
        Loan storage loan = loans[loanId];
        uint256 timeElapsed = block.timestamp.sub(loan.startTime);
        uint256 annualInterest = loan.borrowedAmount.mul(loan.interestRate).div(PERCENT_DENOMINATOR);
        return annualInterest.mul(timeElapsed).div(SECONDS_PER_YEAR);
    }
    
    function getTotalOwed(uint256 loanId) public view returns (uint256) {
        Loan storage loan = loans[loanId];
        uint256 interest = calculateInterest(loanId);
        return loan.borrowedAmount.add(interest);
    }
    
    function getLoan(uint256 loanId) external view override returns (Loan memory) {
        return loans[loanId];
    }
    
    function getCollateralValue(address user, address token) public view override returns (uint256) {
        return userCollateral[user][token];
    }
    
    function getMaxBorrowAmount(address token, uint256 collateralAmount) public view override returns (uint256) {
        CollateralAsset storage asset = collateralAssets[token];
        uint256 collateralValue = collateralAmount; // Simplified - should use price oracle
        return collateralValue.mul(asset.ltvRatio).div(PERCENT_DENOMINATOR);
    }
    
    function getHealthFactor(uint256 loanId) public view override returns (uint256) {
        Loan storage loan = loans[loanId];
        if (!loan.active || loan.liquidated) return type(uint256).max;
        
        uint256 collateralValue = loan.collateralAmount; // Simplified - use price oracle
        uint256 totalOwed = getTotalOwed(loanId);
        
        if (totalOwed == 0) return type(uint256).max;
        
        return collateralValue.mul(1e18).div(totalOwed);
    }
    
    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }
    
    function getSupportedCollaterals() external view returns (address[] memory) {
        return supportedCollaterals;
    }
    
    // Admin functions
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Lending: zero address");
        pendingOwner = newOwner;
    }
    
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Lending: not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
    
    function setLiquidationConfig(uint256 bonus, uint256 fee) external onlyOwner {
        require(bonus <= 1000 && fee <= 500, "Lending: config too high");
        liquidationBonus = bonus;
        liquidationFee = fee;
    }
    
    function setTreasury(address _treasury) external onlyOwner {
        treasury = ITreasury(_treasury);
    }
    
    function emergencyWithdraw(address token, uint256 amount, address recipient) external onlyOwner {
        require(recipient != address(0), "Lending: zero recipient");
        require(amount > 0, "Lending: zero amount");
        require(IERC20(token).balanceOf(address(this)) >= amount, "Lending: insufficient balance");
        
        bytes32 requestId = keccak256(abi.encodePacked(token, amount, recipient, block.timestamp));
        uint256 executeAfter = block.timestamp + TIMELOCK_DELAY;
        
        timelockExpiry[requestId] = executeAfter;
        
        emit EmergencyWithdrawScheduled(requestId, token, amount, executeAfter);
    }
    
    function executeEmergencyWithdraw(address token, uint256 amount, address recipient, bytes32 requestId) external onlyOwner nonReentrant {
        require(timelockExpiry[requestId] > 0, "Lending: request not found");
        require(block.timestamp >= timelockExpiry[requestId], "Lending: timelock not expired");
        require(IERC20(token).balanceOf(address(this)) >= amount, "Lending: insufficient balance");
        
        delete timelockExpiry[requestId];
        
        IERC20(token).transfer(recipient, amount);
        emit EmergencyWithdrawExecuted(requestId, token, amount, recipient);
    }
}
