// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IStaking {
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 rewardRate;
        uint256 lastClaimTime;
        uint256 pendingRewards;
        bool isFlexible;
        bool active;
    }
    
    function stake(uint256 amount, uint256 lockDuration) external;
    function unstake(uint256 stakeId) external;
    function claimRewards(uint256 stakeId) external;
    function compoundRewards(uint256 stakeId) external;
    function getStakeInfo(address user, uint256 stakeId) external view returns (StakeInfo memory);
    function getTotalStaked(address user) external view returns (uint256);
    function getPendingRewards(address user, uint256 stakeId) external view returns (uint256);
    function setRewardRates(uint256 flexibleRate, uint256[] calldata bondRates) external;
    function globalTotalStaked() external view returns (uint256);
    
    event Staked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 lockDuration);
    event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 indexed stakeId, uint256 amount);
    event RewardsCompounded(address indexed user, uint256 indexed stakeId, uint256 amount);
}
