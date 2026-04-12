// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IStaking.sol";
import "../interfaces/INeuronToken.sol";
import "../interfaces/IReferral.sol";
import "../libraries/SafeMath.sol";

contract Staking is IStaking {
    using SafeMath for uint256;
    
    // Bond durations in seconds
    uint256 public constant BOND_45_DAYS = 45 days;
    uint256 public constant BOND_90_DAYS = 90 days;
    uint256 public constant BOND_180_DAYS = 180 days;
    uint256 public constant BOND_360_DAYS = 360 days;
    
    // Reward rates (APY in basis points, e.g., 1000 = 10%)
    uint256 public flexibleRate = 500; // 5% APY
    uint256[] public bondRates = [1500, 2500, 4000, 8000]; // 15%, 25%, 40%, 80% APY
    
    INeuronToken public neuronToken;
    IReferral public referralContract;
    
    address public owner;
    address public pendingOwner;
    address public rewardsPool;
    
    // User stakes: user => stakeId => StakeInfo
    mapping(address => mapping(uint256 => StakeInfo)) public stakes;
    mapping(address => uint256) public userStakeCount;
    mapping(address => uint256) public totalStaked;
    
    // Total staked across all users
    uint256 public globalTotalStaked;
    
    // Emergency pause
    bool public paused = false;
    
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event RewardsPoolUpdated(address indexed pool);
    event ReferralContractUpdated(address indexed referral);
    event Paused(bool paused);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Staking: not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Staking: paused");
        _;
    }
    
    constructor(address _neuronToken) {
        owner = msg.sender;
        neuronToken = INeuronToken(_neuronToken);
    }
    
    function stake(uint256 amount, uint256 lockDuration) external override whenNotPaused {
        require(amount > 0, "Staking: zero amount");
        require(lockDuration == 0 || isValidBondDuration(lockDuration), "Staking: invalid duration");
        
        uint256 rewardRate = getRewardRate(lockDuration);
        uint256 stakeId = userStakeCount[msg.sender];
        
        stakes[msg.sender][stakeId] = StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            endTime: lockDuration > 0 ? block.timestamp.add(lockDuration) : 0,
            rewardRate: rewardRate,
            lastClaimTime: block.timestamp,
            pendingRewards: 0,
            isFlexible: lockDuration == 0,
            active: true
        });
        
        userStakeCount[msg.sender] = userStakeCount[msg.sender].add(1);
        totalStaked[msg.sender] = totalStaked[msg.sender].add(amount);
        globalTotalStaked = globalTotalStaked.add(amount);
        
        // Transfer tokens from user
        neuronToken.transferFrom(msg.sender, address(this), amount);
        
        // Record stake in referral system
        if (address(referralContract) != address(0)) {
            referralContract.recordStake(msg.sender, amount);
            referralContract.processReferralRewards(msg.sender, amount);
        }
        
        emit Staked(msg.sender, stakeId, amount, lockDuration);
    }
    
    function unstake(uint256 stakeId) external override whenNotPaused {
        StakeInfo storage stakeInfo = stakes[msg.sender][stakeId];
        require(stakeInfo.active, "Staking: stake not active");
        
        if (!stakeInfo.isFlexible) {
            require(block.timestamp >= stakeInfo.endTime, "Staking: bond still locked");
        }
        
        // Calculate and add pending rewards
        uint256 pending = calculatePendingRewards(msg.sender, stakeId);
        uint256 totalAmount = stakeInfo.amount.add(pending);
        
        // Update state
        stakeInfo.active = false;
        totalStaked[msg.sender] = totalStaked[msg.sender].sub(stakeInfo.amount);
        globalTotalStaked = globalTotalStaked.sub(stakeInfo.amount);
        
        // Transfer tokens + rewards back to user
        neuronToken.transfer(msg.sender, totalAmount);
        
        emit Unstaked(msg.sender, stakeId, totalAmount);
        emit RewardsClaimed(msg.sender, stakeId, pending);
    }
    
    function claimRewards(uint256 stakeId) external override whenNotPaused {
        StakeInfo storage stakeInfo = stakes[msg.sender][stakeId];
        require(stakeInfo.active, "Staking: stake not active");
        
        uint256 pending = calculatePendingRewards(msg.sender, stakeId);
        require(pending > 0, "Staking: no rewards");
        
        stakeInfo.lastClaimTime = block.timestamp;
        stakeInfo.pendingRewards = 0;
        
        // Transfer rewards from rewards pool
        if (rewardsPool != address(0)) {
            neuronToken.transferFrom(rewardsPool, msg.sender, pending);
        } else {
            // If no rewards pool, mint new tokens (controlled emission)
            neuronToken.mint(msg.sender, pending);
        }
        
        emit RewardsClaimed(msg.sender, stakeId, pending);
    }
    
    function compoundRewards(uint256 stakeId) external override whenNotPaused {
        StakeInfo storage stakeInfo = stakes[msg.sender][stakeId];
        require(stakeInfo.active, "Staking: stake not active");
        
        uint256 pending = calculatePendingRewards(msg.sender, stakeId);
        require(pending > 0, "Staking: no rewards");
        
        stakeInfo.amount = stakeInfo.amount.add(pending);
        stakeInfo.lastClaimTime = block.timestamp;
        stakeInfo.pendingRewards = 0;
        
        totalStaked[msg.sender] = totalStaked[msg.sender].add(pending);
        globalTotalStaked = globalTotalStaked.add(pending);
        
        emit RewardsCompounded(msg.sender, stakeId, pending);
    }
    
    function calculatePendingRewards(address user, uint256 stakeId) public view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user][stakeId];
        if (!stakeInfo.active) return 0;
        
        uint256 timeElapsed = block.timestamp.sub(stakeInfo.lastClaimTime);
        uint256 annualReward = stakeInfo.amount.mul(stakeInfo.rewardRate).div(10000);
        uint256 reward = annualReward.mul(timeElapsed).div(365 days);
        
        return reward.add(stakeInfo.pendingRewards);
    }
    
    function getRewardRate(uint256 lockDuration) public view returns (uint256) {
        if (lockDuration == 0) {
            return flexibleRate;
        } else if (lockDuration == BOND_45_DAYS) {
            return bondRates[0];
        } else if (lockDuration == BOND_90_DAYS) {
            return bondRates[1];
        } else if (lockDuration == BOND_180_DAYS) {
            return bondRates[2];
        } else if (lockDuration == BOND_360_DAYS) {
            return bondRates[3];
        }
        revert("Staking: invalid duration");
    }
    
    function isValidBondDuration(uint256 duration) public pure returns (bool) {
        return duration == BOND_45_DAYS || 
               duration == BOND_90_DAYS || 
               duration == BOND_180_DAYS || 
               duration == BOND_360_DAYS;
    }
    
    function getStakeInfo(address user, uint256 stakeId) external view override returns (StakeInfo memory) {
        return stakes[user][stakeId];
    }
    
    function getTotalStaked(address user) external view override returns (uint256) {
        return totalStaked[user];
    }
    
    function getPendingRewards(address user, uint256 stakeId) external view override returns (uint256) {
        return calculatePendingRewards(user, stakeId);
    }
    
    function getUserStakes(address user) external view returns (uint256[] memory) {
        uint256 count = userStakeCount[user];
        uint256[] memory activeStakes = new uint256[](count);
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < count; i++) {
            if (stakes[user][i].active) {
                activeStakes[activeCount] = i;
                activeCount++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeStakes[i];
        }
        
        return result;
    }
    
    // Admin functions
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Staking: zero address");
        pendingOwner = newOwner;
    }
    
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Staking: not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
    
    function setRewardRates(uint256 _flexibleRate, uint256[] calldata _bondRates) external override onlyOwner {
        require(_bondRates.length == 4, "Staking: invalid bond rates length");
        flexibleRate = _flexibleRate;
        bondRates = _bondRates;
    }
    
    function setRewardsPool(address _rewardsPool) external onlyOwner {
        rewardsPool = _rewardsPool;
        emit RewardsPoolUpdated(_rewardsPool);
    }
    
    function setReferralContract(address _referral) external onlyOwner {
        referralContract = IReferral(_referral);
        emit ReferralContractUpdated(_referral);
    }
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }
    
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        neuronToken.transfer(owner, amount);
    }
}
