// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/INeuronToken.sol";
import "../interfaces/IAIEngine.sol";
import "../libraries/SafeMath.sol";

contract NeuronToken is INeuronToken {
    using SafeMath for uint256;

    string public constant name = "NeuraFinance Token";
    string public constant symbol = "NEURON";
    uint8 public constant decimals = 18;
    
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // Access control
    address public owner;
    address public pendingOwner;
    mapping(address => bool) public authorizedMinters;
    mapping(address => bool) public whitelisted;
    
    // Fee configuration
    uint256 public buyFee = 300; // 3%
    uint256 public sellFee = 500; // 5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    address public treasuryRecipient;
    address public liquidityRecipient;
    address public rewardsRecipient;
    
    uint256 public maxTxAmount = 100000 * 10**18; // 100k tokens
    bool public limitsEnabled = true;
    
    // AI Engine
    address public aiEngine;
    
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event FeesUpdated(uint256 buyFee, uint256 sellFee);
    event FeeRecipientsUpdated(address treasury, address liquidity, address rewards);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "NeuronToken: not owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedMinters[msg.sender], "NeuronToken: not authorized");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        _totalSupply = 10000000 * 10**18; // 10M initial supply
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
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
        require(currentAllowance >= amount, "NeuronToken: transfer exceeds allowance");
        _approve(sender, msg.sender, currentAllowance - amount);
        return true;
    }
    
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "NeuronToken: transfer from zero address");
        require(recipient != address(0), "NeuronToken: transfer to zero address");
        require(_balances[sender] >= amount, "NeuronToken: insufficient balance");
        
        if (limitsEnabled && !whitelisted[sender] && !whitelisted[recipient]) {
            require(amount <= maxTxAmount, "NeuronToken: exceeds max tx amount");
        }
        
        uint256 fee = 0;
        
        // Apply fees only on non-whitelisted addresses
        if (!whitelisted[sender] && !whitelisted[recipient]) {
            // Buy fee: when sender is pair (DEX)
            // Sell fee: when recipient is pair (DEX)
            // For simplicity, we'll apply a standard fee here
            // In production, detect DEX pairs
            if (recipient == liquidityRecipient) {
                fee = amount.mul(sellFee).div(FEE_DENOMINATOR);
            } else if (sender == liquidityRecipient) {
                fee = amount.mul(buyFee).div(FEE_DENOMINATOR);
            }
        }
        
        uint256 transferAmount = amount.sub(fee);
        
        _balances[sender] = _balances[sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(transferAmount);
        
        if (fee > 0) {
            _distributeFees(fee);
        }
        
        emit Transfer(sender, recipient, transferAmount);
    }
    
    function _distributeFees(uint256 fee) internal {
        if (treasuryRecipient == address(0)) {
            _balances[address(this)] = _balances[address(this)].add(fee);
            return;
        }
        
        uint256 treasuryShare = fee.mul(40).div(100); // 40%
        uint256 liquidityShare = fee.mul(30).div(100); // 30%
        uint256 rewardsShare = fee.sub(treasuryShare).sub(liquidityShare); // 30%
        
        _balances[treasuryRecipient] = _balances[treasuryRecipient].add(treasuryShare);
        _balances[liquidityRecipient] = _balances[liquidityRecipient].add(liquidityShare);
        _balances[rewardsRecipient] = _balances[rewardsRecipient].add(rewardsShare);
        
        emit Transfer(address(this), treasuryRecipient, treasuryShare);
        emit Transfer(address(this), liquidityRecipient, liquidityShare);
        emit Transfer(address(this), rewardsRecipient, rewardsShare);
        
        emit FeeDistributed(treasuryRecipient, treasuryShare, "treasury");
        emit FeeDistributed(liquidityRecipient, liquidityShare, "liquidity");
        emit FeeDistributed(rewardsRecipient, rewardsShare, "rewards");
    }
    
    function _approve(address _owner, address spender, uint256 amount) internal {
        require(_owner != address(0), "NeuronToken: approve from zero address");
        require(spender != address(0), "NeuronToken: approve to zero address");
        _allowances[_owner][spender] = amount;
        emit Approval(_owner, spender, amount);
    }
    
    function mint(address to, uint256 amount) external override onlyAuthorized {
        require(to != address(0), "NeuronToken: mint to zero address");
        
        // Validate through AI Engine if set
        if (aiEngine != address(0)) {
            require(IAIEngine(aiEngine).validateMintRequest(amount), "NeuronToken: mint validation failed");
        }
        
        _totalSupply = _totalSupply.add(amount);
        _balances[to] = _balances[to].add(amount);
        emit Transfer(address(0), to, amount);
        emit Mint(to, amount);
    }
    
    function burn(uint256 amount) external override {
        _burn(msg.sender, amount);
    }
    
    function burnFrom(address account, uint256 amount) external override {
        uint256 currentAllowance = _allowances[account][msg.sender];
        require(currentAllowance >= amount, "NeuronToken: burn exceeds allowance");
        _approve(account, msg.sender, currentAllowance - amount);
        _burn(account, amount);
    }
    
    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "NeuronToken: burn from zero address");
        require(_balances[account] >= amount, "NeuronToken: burn exceeds balance");
        
        _balances[account] = _balances[account].sub(amount);
        _totalSupply = _totalSupply.sub(amount);
        emit Transfer(account, address(0), amount);
        emit Burn(account, amount);
    }
    
    // Admin functions
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "NeuronToken: new owner is zero address");
        pendingOwner = newOwner;
    }
    
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "NeuronToken: not pending owner");
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
    
    function setFeeRecipients(address _treasury, address _liquidity, address _rewards) external override onlyOwner {
        require(_treasury != address(0) && _liquidity != address(0) && _rewards != address(0), "NeuronToken: zero address");
        treasuryRecipient = _treasury;
        liquidityRecipient = _liquidity;
        rewardsRecipient = _rewards;
        emit FeeRecipientsUpdated(_treasury, _liquidity, _rewards);
    }
    
    function setFeePercentages(uint256 _buyFee, uint256 _sellFee) external override onlyOwner {
        require(_buyFee <= 1000 && _sellFee <= 1500, "NeuronToken: fee too high"); // Max 10% / 15%
        buyFee = _buyFee;
        sellFee = _sellFee;
        emit FeesUpdated(_buyFee, _sellFee);
    }
    
    function setMaxTxAmount(uint256 _maxTxAmount) external override onlyOwner {
        maxTxAmount = _maxTxAmount;
    }
    
    function setLimitsEnabled(bool enabled) external onlyOwner {
        limitsEnabled = enabled;
    }
    
    function whitelistAddress(address account, bool whitelistedStatus) external override onlyOwner {
        whitelisted[account] = whitelistedStatus;
    }
    
    function isWhitelisted(address account) external view override returns (bool) {
        return whitelisted[account];
    }
    
    function setAIEngine(address _aiEngine) external onlyOwner {
        aiEngine = _aiEngine;
    }
}
