// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IStaking.sol";
import "../interfaces/INeuronToken.sol";
import "../interfaces/ITreasury.sol";
import "../interfaces/IReferral.sol";
import "../libraries/MathUtils.sol";

/**
 * @title Staking V2
 * @notice Secure staking with correct compound interest, 12-hour cycles
 * @dev Rewards funded from treasury, not minted
 */
contract Staking is IStaking, ReentrancyGuard, AccessControl, Pausable {
    
    using MathUtils for uint256;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    
    // Constants
    uint256 public constant CYCLE_DURATION = 12 hours;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant DEPOSIT_FEE = 50; // 0.5%
    
    // Reward rates (in basis points, annual)
    uint256 public flexibleRate = 4000;   // 40% APY
    uint256 public bond30Rate = 6000;     // 60% APY
    uint256 public bond90Rate = 8000;     // 80% APY
    uint256 public bond180Rate = 12000;   // 120% APY
    
    // Bond durations
    uint256 public constant BOND_30_DAYS = 30 days;
    uint256 public constant BOND_90_DAYS = 90 days;
    uint256 public constant BOND_180_DAYS = 180 days;
    
    // Contracts
    INeuronToken public neuronToken;
    ITreasury public treasury;
    IReferral public referral;
    
    // State
    mapping(address => mapping(uint256 => StakeInfo)) public stakes;
    mapping(address => uint256[]) public userStakeIds;
    mapping(address => uint256) public nextStakeId;
    uint256 public totalStakedAmount;
    
    // Events
    event DepositFeeUpdated(uint256 newFee);
    
    constructor(
        address _neuronToken,
        address _treasury,
        address _referral
    ) {
        require(_neuronToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        
        neuronToken = INeuronToken(_neuronToken);
        treasury = ITreasury(_treasury);
        if (_referral != address(0)) {
            referral = IReferral(_referral);
        }
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REWARD_MANAGER_ROLE, msg.sender);
    }
    
    /**
     * @notice Stake tokens with optional bond period
     */
    function stake(
        uint256 amount,
        StakeType stakeType,
        address referrer
    ) external override nonReentrant whenNotPaused {
        require(amount >= 100 * 1e18, "Minimum stake: 100 NEURON");
        
        // Calculate deposit fee
        uint256 fee = (amount * DEPOSIT_FEE) / BASIS_POINTS;
        uint256 stakeAmount = amount - fee;
        
        // Transfer tokens from user
        neuronToken.transferFrom(msg.sender, address(this), amount);
        
        // Send fee to treasury
        if (fee > 0) {
            neuronToken.transfer(address(treasury), fee);
        }
        
        // Determine lock period and rate
        uint256 lockPeriod = getLockPeriod(stakeType);
        uint256 rate = getRate(stakeType);
        
        // Create stake
        uint256 stakeId = nextStakeId[msg.sender]++;
        stakes[msg.sender][stakeId] = StakeInfo({
            amount: stakeAmount,
            startTime: block.timestamp,
            endTime: lockPeriod > 0 ? block.timestamp + lockPeriod : 0,
            lastCompoundTime: block.timestamp,
            rewardRate: rate,
            stakeType: stakeType,
            active: true,
            autoCompound: false
        });
        
        userStakeIds[msg.sender].push(stakeId);
        totalStakedAmount += stakeAmount;
        
        // Process referral if provided
        if (address(referral) != address(0) && referrer != address(0)) {
            referral.processReferralRewards(msg.sender, stakeAmount);
        }
        
        emit Staked(msg.sender, stakeId, stakeAmount, stakeType);
    }
    
    /**
     * @notice Unstake and claim rewards
     */
    function unstake(uint256 stakeId) external override nonReentrant {
        StakeInfo storage stakeInfo = stakes[msg.sender][stakeId];
        require(stakeInfo.active, "Stake not active");
        
        // Check lock period
        if (stakeInfo.endTime > 0) {
            require(block.timestamp >= stakeInfo.endTime, "Bond still locked");
        }
        
        // Calculate rewards
        uint256 reward = calculatePendingRewards(msg.sender, stakeId);
        uint256 totalReturn = stakeInfo.amount + reward;
        
        // Mark as inactive
        stakeInfo.active = false;
        totalStakedAmount -= stakeInfo.amount;
        
        // Transfer principal + rewards from treasury
        neuronToken.transferFrom(address(treasury), msg.sender, totalReturn);
        
        emit Unstaked(msg.sender, stakeId, stakeInfo.amount, reward);
    }
    
    /**
     * @notice Claim rewards without unstaking (flexible only)
     */
    function claimRewards(uint256 stakeId) external override nonReentrant {
        StakeInfo storage stakeInfo = stakes[msg.sender][stakeId];
        require(stakeInfo.active, "Stake not active");
        require(stakeInfo.stakeType == StakeType.FLEXIBLE, "Only flexible stakes");
        
        uint256 reward = calculatePendingRewards(msg.sender, stakeId);
        require(reward > 0, "No rewards to claim");
        
        // Update last compound time
        stakeInfo.lastCompoundTime = block.timestamp;
        
        // Transfer rewards from treasury
        neuronToken.transferFrom(address(treasury), msg.sender, reward);
        
        emit RewardsClaimed(msg.sender, stakeId, reward);
    }
    
    /**
     * @notice Compound rewards into stake
     */
    function compoundRewards(uint256 stakeId) external override nonReentrant {
        StakeInfo storage stakeInfo = stakes[msg.sender][stakeId];
        require(stakeInfo.active, "Stake not active");
        
        uint256 reward = calculatePendingRewards(msg.sender, stakeId);
        require(reward > 0, "No rewards to compound");
        
        // Update stake amount
        uint256 oldAmount = stakeInfo.amount;
        stakeInfo.amount += reward;
        stakeInfo.lastCompoundTime = block.timestamp;
        
        // Update totals
        totalStakedAmount = totalStakedAmount - oldAmount + stakeInfo.amount;
        
        // Transfer reward from treasury to this contract (already counted in stake)
        neuronToken.transferFrom(address(treasury), address(this), reward);
        
        emit RewardsCompounded(msg.sender, stakeId, reward);
    }
    
    /**
     * @notice Toggle auto-compound for a stake
     */
    function toggleAutoCompound(uint256 stakeId) external override {
        StakeInfo storage stakeInfo = stakes[msg.sender][stakeId];
        require(stakeInfo.active, "Stake not active");
        
        stakeInfo.autoCompound = !stakeInfo.autoCompound;
        emit AutoCompoundToggled(msg.sender, stakeId, stakeInfo.autoCompound);
    }
    
    /**
     * @notice Calculate pending rewards using compound interest
     */
    function calculatePendingRewards(
        address user,
        uint256 stakeId
    ) public view override returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user][stakeId];
        if (!stakeInfo.active) return 0;
        
        uint256 periods = MathUtils.getPeriodsElapsed(
            stakeInfo.lastCompoundTime,
            block.timestamp
        );
        
        return MathUtils.calculateCompoundReward(
            stakeInfo.amount,
            stakeInfo.rewardRate,
            periods
        );
    }
    
    /**
     * @notice Get APY for stake type
     */
    function calculateAPY(StakeType stakeType) external view override returns (uint256) {
        return getRate(stakeType);
    }
    
    /**
     * @notice Get user's active stakes
     */
    function getUserStakes(address user) external view override returns (uint256[] memory) {
        return userStakeIds[user];
    }
    
    /**
     * @notice Get stake info
     */
    function getStakeInfo(
        address user,
        uint256 stakeId
    ) external view override returns (StakeInfo memory) {
        return stakes[user][stakeId];
    }
    
    /**
     * @notice Total staked amount
     */
    function totalStaked() external view override returns (uint256) {
        return totalStakedAmount;
    }
    
    /**
     * @notice Get lock period for stake type
     */
    function getLockPeriod(StakeType stakeType) internal pure returns (uint256) {
        if (stakeType == StakeType.BOND_30) return BOND_30_DAYS;
        if (stakeType == StakeType.BOND_90) return BOND_90_DAYS;
        if (stakeType == StakeType.BOND_180) return BOND_180_DAYS;
        return 0; // Flexible
    }
    
    /**
     * @notice Get rate for stake type
     */
    function getRate(StakeType stakeType) internal view returns (uint256) {
        if (stakeType == StakeType.BOND_30) return bond30Rate;
        if (stakeType == StakeType.BOND_90) return bond90Rate;
        if (stakeType == StakeType.BOND_180) return bond180Rate;
        return flexibleRate;
    }
    
    /**
     * @notice Set reward rates
     */
    function setRewardRates(
        uint256 _flexible,
        uint256 _bond30,
        uint256 _bond90,
        uint256 _bond180
    ) external override onlyRole(REWARD_MANAGER_ROLE) {
        require(_flexible <= 10000, "Rate too high");
        require(_bond30 <= 15000, "Rate too high");
        require(_bond90 <= 20000, "Rate too high");
        require(_bond180 <= 30000, "Rate too high");
        
        flexibleRate = _flexible;
        bond30Rate = _bond30;
        bond90Rate = _bond90;
        bond180Rate = _bond180;
    }
    
    /**
     * @notice Batch auto-compound for multiple users (keeper function)
     */
    function batchAutoCompound(address[] calldata users, uint256[] calldata stakeIds) external onlyRole(KEEPER_ROLE) {
        require(users.length == stakeIds.length, "Length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            StakeInfo storage stakeInfo = stakes[users[i]][stakeIds[i]];
            if (stakeInfo.active && stakeInfo.autoCompound) {
                uint256 reward = calculatePendingRewards(users[i], stakeIds[i]);
                if (reward > 0) {
                    uint256 oldAmount = stakeInfo.amount;
                    stakeInfo.amount += reward;
                    stakeInfo.lastCompoundTime = block.timestamp;
                    totalStakedAmount = totalStakedAmount - oldAmount + stakeInfo.amount;
                    
                    neuronToken.transferFrom(address(treasury), address(this), reward);
                    emit RewardsCompounded(users[i], stakeIds[i], reward);
                }
            }
        }
    }
    
    /**
     * @notice Emergency withdraw (admin only)
     */
    function emergencyWithdraw(uint256 amount) external override onlyRole(ADMIN_ROLE) {
        neuronToken.transfer(msg.sender, amount);
    }
    
    /**
     * @notice Pause staking
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause staking
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Update referral contract
     */
    function setReferral(address _referral) external onlyRole(ADMIN_ROLE) {
        referral = IReferral(_referral);
    }
}