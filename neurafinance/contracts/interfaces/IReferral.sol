// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IReferral {
    struct RankInfo {
        string name;
        uint256 minStake;
        uint256 minTeamVolume;
        uint256 minReferrals;
        uint256 bonusPercentage;
    }
    
    struct UserInfo {
        address referrer;
        uint256 referralCount;
        uint256 teamVolume;
        uint256 rank;
        uint256 totalEarned;
    }
    
    function registerReferrer(address referrer) external;
    function recordStake(address user, uint256 amount) external;
    function processReferralRewards(address user, uint256 stakeAmount) external;
    function getUserInfo(address user) external view returns (UserInfo memory);
    function getRankRequirements(uint256 rank) external view returns (RankInfo memory);
    function calculateRank(address user) external view returns (uint256);
    
    event ReferrerRegistered(address indexed user, address indexed referrer);
    event RankUpgraded(address indexed user, uint256 newRank);
    event ReferralRewardPaid(address indexed referrer, address indexed referee, uint256 amount);
}
