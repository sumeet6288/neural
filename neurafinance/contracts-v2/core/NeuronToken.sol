// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/INeuronToken.sol";

/**
 * @title NeuronToken V2
 * @notice ERC20 token with controlled minting, burn mechanisms, and fee distribution
 * @dev Max supply capped, emission controlled by AI Engine
 */
contract NeuronToken is INeuronToken, ERC20, AccessControl, ReentrancyGuard {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    
    // Tokenomics
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18; // 100M max
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 1e18; // 10M initial
    
    // Fee structure (in basis points)
    uint256 public transferFee = 50;        // 0.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Fee distribution
    uint256 public treasuryShare = 4000;    // 40% of fees
    uint256 public liquidityShare = 3000;   // 30% of fees
    uint256 public burnShare = 3000;        // 30% burned
    
    // State
    uint256 public totalBurned;
    mapping(address => bool) public feeExempt;
    
    // Treasury and liquidity addresses
    address public treasury;
    address public liquidityPool;
    
    // Events
    event FeeUpdated(uint256 newFee);
    event FeeSharesUpdated(uint256 treasury, uint256 liquidity, uint256 burn);
    event FeeExemptionUpdated(address account, bool exempt);
    
    constructor(
        address _treasury,
        address _liquidityPool
    ) ERC20("NeuraFinance Token", "NEURON") {
        require(_treasury != address(0), "Invalid treasury");
        require(_liquidityPool != address(0), "Invalid liquidity pool");
        
        treasury = _treasury;
        liquidityPool = _liquidityPool;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        // Mint initial supply to treasury
        _mint(_treasury, INITIAL_SUPPLY);
        
        // Exempt protocol addresses from fees
        feeExempt[_treasury] = true;
        feeExempt[_liquidityPool] = true;
        feeExempt[address(this)] = true;
    }
    
    /**
     * @notice Controlled minting - only minter role, with max supply check
     */
    function mint(
        address to,
        uint256 amount,
        string calldata reason
    ) external override onlyRole(MINTER_ROLE) nonReentrant {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Cannot mint zero");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        
        _mint(to, amount);
        emit Mint(to, amount, reason);
    }
    
    /**
     * @notice Burn tokens from sender
     */
    function burn(uint256 amount) external override {
        _burn(msg.sender, amount);
        totalBurned += amount;
        emit Burn(msg.sender, amount, "user_burn");
    }
    
    /**
     * @notice Burn tokens from account (with approval)
     */
    function burnFrom(address account, uint256 amount) external override {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
        totalBurned += amount;
        emit Burn(account, amount, "burn_from");
    }
    
    /**
     * @notice Get circulating supply (total - burned - treasury)
     */
    function getCirculatingSupply() external view override returns (uint256) {
        uint256 treasuryBalance = balanceOf(treasury);
        return totalSupply() - totalBurned - treasuryBalance;
    }
    
    /**
     * @notice Override transfer to apply fees
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (feeExempt[from] || feeExempt[to] || transferFee == 0) {
            super._transfer(from, to, amount);
            return;
        }
        
        uint256 fee = (amount * transferFee) / FEE_DENOMINATOR;
        uint256 burnAmount = (fee * burnShare) / FEE_DENOMINATOR;
        uint256 treasuryAmount = (fee * treasuryShare) / FEE_DENOMINATOR;
        uint256 liquidityAmount = fee - burnAmount - treasuryAmount;
        uint256 transferAmount = amount - fee;
        
        // Burn portion
        if (burnAmount > 0) {
            super._burn(from, burnAmount);
            totalBurned += burnAmount;
        }
        
        // Send to treasury
        if (treasuryAmount > 0) {
            super._transfer(from, treasury, treasuryAmount);
        }
        
        // Send to liquidity pool
        if (liquidityAmount > 0) {
            super._transfer(from, liquidityPool, liquidityAmount);
        }
        
        // Transfer remainder
        super._transfer(from, to, transferAmount);
        
        emit FeeDistributed(treasuryAmount, liquidityAmount, burnAmount);
    }
    
    /**
     * @notice Set fee exemption for an account
     */
    function setFeeExempt(address account, bool exempt) external override onlyRole(FEE_MANAGER_ROLE) {
        feeExempt[account] = exempt;
        emit FeeExemptionUpdated(account, exempt);
    }
    
    /**
     * @notice Check if account is fee exempt
     */
    function isFeeExempt(address account) external view override returns (bool) {
        return feeExempt[account];
    }
    
    /**
     * @notice Update transfer fee
     */
    function setTransferFee(uint256 newFee) external onlyRole(FEE_MANAGER_ROLE) {
        require(newFee <= 500, "Fee too high"); // Max 5%
        transferFee = newFee;
        emit FeeUpdated(newFee);
    }
    
    /**
     * @notice Update fee distribution shares
     */
    function setFeeShares(
        uint256 _treasury,
        uint256 _liquidity,
        uint256 _burn
    ) external onlyRole(FEE_MANAGER_ROLE) {
        require(_treasury + _liquidity + _burn == FEE_DENOMINATOR, "Shares must sum to 100%");
        treasuryShare = _treasury;
        liquidityShare = _liquidity;
        burnShare = _burn;
        emit FeeSharesUpdated(_treasury, _liquidity, _burn);
    }
    
    /**
     * @notice Update treasury address
     */
    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "Invalid address");
        feeExempt[treasury] = false;
        treasury = newTreasury;
        feeExempt[newTreasury] = true;
    }
    
    /**
     * @notice Update liquidity pool address
     */
    function setLiquidityPool(address newPool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newPool != address(0), "Invalid address");
        feeExempt[liquidityPool] = false;
        liquidityPool = newPool;
        feeExempt[newPool] = true;
    }
    
    /**
     * @notice Grant minter role
     */
    function addMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, minter);
    }
    
    /**
     * @notice Revoke minter role
     */
    function removeMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, minter);
    }
    
    /**
     * @notice Get max supply
     */
    function maxSupply() external pure override returns (uint256) {
        return MAX_SUPPLY;
    }
}