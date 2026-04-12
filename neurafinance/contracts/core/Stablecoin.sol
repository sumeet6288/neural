// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IStablecoin.sol";
import "../interfaces/ITreasury.sol";
import "../libraries/SafeMath.sol";

contract Stablecoin is IStablecoin {
    using SafeMath for uint256;
    
    string public constant name = "Neura USD";
    string public constant symbol = "nUSD";
    uint8 public constant decimals = 18;
    
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // Access control
    address public owner;
    address public pendingOwner;
    mapping(address => bool) public authorizedMinters;
    
    // Treasury
    address public treasury;
    
    // Collateral ratio (150% = 15000)
    uint256 public collateralRatio = 15000;
    uint256 public constant RATIO_DENOMINATOR = 10000;
    
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event TreasuryUpdated(address indexed treasury);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Stablecoin: not owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedMinters[msg.sender], "Stablecoin: not authorized");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }
    
    function allowance(address _owner, address spender) external view override returns (uint256) {
        return _allowances[_owner][spender];
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        _transfer(sender, recipient, amount);
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "Stablecoin: transfer exceeds allowance");
        _approve(sender, msg.sender, currentAllowance - amount);
        return true;
    }
    
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "Stablecoin: transfer from zero address");
        require(recipient != address(0), "Stablecoin: transfer to zero address");
        require(_balances[sender] >= amount, "Stablecoin: insufficient balance");
        
        _balances[sender] = _balances[sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(amount);
        
        emit Transfer(sender, recipient, amount);
    }
    
    function _approve(address _owner, address spender, uint256 amount) internal {
        require(_owner != address(0), "Stablecoin: approve from zero address");
        require(spender != address(0), "Stablecoin: approve to zero address");
        _allowances[_owner][spender] = amount;
        emit Approval(_owner, spender, amount);
    }
    
    function mint(address to, uint256 amount) external override onlyAuthorized {
        require(to != address(0), "Stablecoin: mint to zero address");
        require(amount > 0, "Stablecoin: zero amount");
        
        // Check treasury backing
        if (treasury != address(0)) {
            uint256 treasuryValue = ITreasury(treasury).getTotalValueLocked();
            uint256 requiredBacking = _totalSupply.add(amount).mul(collateralRatio).div(RATIO_DENOMINATOR);
            require(treasuryValue >= requiredBacking, "Stablecoin: insufficient backing");
        }
        
        _totalSupply = _totalSupply.add(amount);
        _balances[to] = _balances[to].add(amount);
        
        emit Transfer(address(0), to, amount);
        emit Minted(to, amount, 0);
    }
    
    function burn(uint256 amount) external override {
        _burn(msg.sender, amount);
    }
    
    function burnFrom(address account, uint256 amount) external override {
        uint256 currentAllowance = _allowances[account][msg.sender];
        require(currentAllowance >= amount, "Stablecoin: burn exceeds allowance");
        _approve(account, msg.sender, currentAllowance - amount);
        _burn(account, amount);
    }
    
    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "Stablecoin: burn from zero address");
        require(_balances[account] >= amount, "Stablecoin: burn exceeds balance");
        
        _balances[account] = _balances[account].sub(amount);
        _totalSupply = _totalSupply.sub(amount);
        
        emit Transfer(account, address(0), amount);
        emit Burned(account, amount);
    }
    
    function setTreasury(address _treasury) external override onlyOwner {
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    
    function setCollateralRatio(uint256 ratio) external override onlyOwner {
        require(ratio >= 10000 && ratio <= 30000, "Stablecoin: invalid ratio"); // 100% - 300%
        collateralRatio = ratio;
        emit CollateralRatioUpdated(ratio);
    }
    
    function getCollateralRatio() external view override returns (uint256) {
        return collateralRatio;
    }
    
    // Admin functions
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Stablecoin: zero address");
        pendingOwner = newOwner;
    }
    
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Stablecoin: not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
    
    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }
    
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }
}
