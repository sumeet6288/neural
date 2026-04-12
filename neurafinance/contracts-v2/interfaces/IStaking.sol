// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IStaking {
    // Enums
    enum StakeType { FLEXIBLE, BOND_30, BOND_90, BOND_180 }
    
    // Structs
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 lastCompoundTime;
        uint256 rewardRate;      // In basis points (e.g., 8000 = 80% APY)
        StakeType stakeType;
        bool active;
        bool autoCompound;
    }
    
    // Events
    event Staked(address indexed user, uint256 indexed stakeId, uint256 amount, StakeType stakeType);
    event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 reward);
    event RewardsClaimed(address indexed user, uint256 indexed stakeId, uint256 amount);
    event RewardsCompounded(address indexed user, uint256 indexed stakeId, uint256 amount);
    event AutoCompoundToggled(address indexed user, uint256 indexed stakeId, bool enabled);
    
    // View functions
    function getStakeInfo(address user, uint256 stakeId) external view returns (StakeInfo memory);
    function getUserStakes(address user) external view returns (uint256[] memory);
    function calculatePendingRewards(address user, uint256 stakeId) external view returns (uint256);
    function calculateAPY(StakeType stakeType) external view returns (uint256);
    function totalStaked() external view returns (uint256);
    
    // User functions
    function stake(uint256 amount, StakeType stakeType, address referrer) external;
    function unstake(uint256 stakeId) external;
    function claimRewards(uint256 stakeId) external;
    function compoundRewards(uint256 stakeId) external;
    function toggleAutoCompound(uint256 stakeId) external;
    
    // Admin functions
    function setRewardRates(uint256 flexibleRate, uint256 bond30Rate, uint256 bond90Rate, uint256 bond180Rate) external;
    function emergencyWithdraw(uint256 amount) external;
}