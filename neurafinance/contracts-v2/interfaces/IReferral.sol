// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IReferral {
    // Structs
    struct UserInfo {
        address referrer;
        uint256 directReferrals;
        uint256 totalTeamVolume;
        uint256 rank;
        uint256 totalEarned;
    }
    
    struct RankInfo {
        string name;
        uint256 minDirect;
        uint256 minVolume;
        uint256 feeShareBonus;    // In basis points
        uint256 governanceMultiplier; // In basis points
    }
    
    // Events
    event ReferrerSet(address indexed user, address indexed referrer);
    event ReferralRewardPaid(address indexed referrer, address indexed user, uint256 amount, uint256 level);
    event RankUpgraded(address indexed user, uint256 oldRank, uint256 newRank);
    
    // View functions
    function getUserInfo(address user) external view returns (UserInfo memory);
    function getRankInfo(uint256 rank) external view returns (RankInfo memory);
    function getReferralReward(uint256 stakeAmount, uint256 level) external view returns (uint256);
    function getUserRank(address user) external view returns (uint256);
    
    // Core functions
    function setReferrer(address referrer) external;
    function processReferralRewards(address user, uint256 stakeAmount) external;
    function updateTeamVolume(address user, uint256 amount) external;
    
    // Admin
    function setRankRequirements(uint256 rank, uint256 minDirect, uint256 minVolume, uint256 feeShare, uint256 govMultiplier) external;
}