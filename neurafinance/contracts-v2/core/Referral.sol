// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IReferral.sol";
import "../interfaces/INeuronToken.sol";
import "../interfaces/ITreasury.sol";

/**
 * @title Referral V2
 * @notice 3-level sustainable referral system with treasury-funded rewards
 * @dev No infinite minting - all rewards come from treasury reserve
 */
contract Referral is IReferral, AccessControl, ReentrancyGuard {
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant STAKING_ROLE = keccak256("STAKING_ROLE");
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_LEVELS = 3;
    
    // Level rewards (in basis points, from treasury)
    uint256[3] public levelRewards = [300, 100, 50]; // 3%, 1%, 0.5%
    
    // Rank system (5 tiers)
    mapping(uint256 => RankInfo) public ranks;
    uint256 public constant MAX_RANK = 5;
    
    // User data
    mapping(address => UserInfo) public users;
    mapping(address => address[]) public directReferrals;
    
    // Contracts
    INeuronToken public neuronToken;
    ITreasury public treasury;
    
    // Events
    event LevelRewardsUpdated(uint256[3] newRewards);
    
    constructor(address _neuronToken, address _treasury) {
        require(_neuronToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        
        neuronToken = INeuronToken(_neuronToken);
        treasury = ITreasury(_treasury);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        // Initialize ranks
        ranks[1] = RankInfo("Member", 0, 0, 0, 10000);      // 1x governance
        ranks[2] = RankInfo("Advocate", 5, 10000 * 1e18, 2000, 12000);   // +20% fees, 1.2x
        ranks[3] = RankInfo("Ambassador", 20, 100000 * 1e18, 5000, 15000); // +50% fees, 1.5x
        ranks[4] = RankInfo("Partner", 50, 500000 * 1e18, 10000, 20000);   // +100% fees, 2x
        ranks[5] = RankInfo("Council", 100, 1000000 * 1e18, 20000, 25000); // +200% fees, 2.5x
    }
    
    /**
     * @notice Set referrer for new user
     */
    function setReferrer(address referrer) external override {
        require(referrer != address(0), "Invalid referrer");
        require(referrer != msg.sender, "Cannot refer self");
        require(users[msg.sender].referrer == address(0), "Referrer already set");
        
        users[msg.sender].referrer = referrer;
        directReferrals[referrer].push(msg.sender);
        users[referrer].directReferrals++;
        
        emit ReferrerSet(msg.sender, referrer);
        
        // Check rank upgrade for referrer
        _checkRankUpgrade(referrer);
    }
    
    /**
     * @notice Process referral rewards when user stakes
     */
    function processReferralRewards(address user, uint256 stakeAmount) external override onlyRole(STAKING_ROLE) nonReentrant {
        address referrer = users[user].referrer;
        if (referrer == address(0)) return;
        
        // Pay rewards for each level
        _payLevelReward(referrer, user, stakeAmount, 0);
        
        // Level 2
        address level2 = users[referrer].referrer;
        if (level2 != address(0)) {
            _payLevelReward(level2, user, stakeAmount, 1);
            
            // Level 3
            address level3 = users[level2].referrer;
            if (level3 != address(0)) {
                _payLevelReward(level3, user, stakeAmount, 2);
            }
        }
        
        // Update team volume for all upline
        _updateTeamVolume(referrer, stakeAmount);
    }
    
    /**
     * @notice Pay reward for a specific level
     */
    function _payLevelReward(address referrer, address user, uint256 stakeAmount, uint256 level) internal {
        uint256 reward = getReferralReward(stakeAmount, level);
        if (reward == 0) return;
        
        // Apply rank bonus to fee share (not additional reward)
        uint256 rank = users[referrer].rank;
        if (rank > 0) {
            uint256 bonus = ranks[rank].feeShareBonus;
            // Bonus increases the referrer's future fee share, not this reward
            // This prevents inflation while incentivizing rank growth
        }
        
        // Transfer from treasury (not minted!)
        // Treasury must approve this contract
        neuronToken.transferFrom(address(treasury), referrer, reward);
        users[referrer].totalEarned += reward;
        
        emit ReferralRewardPaid(referrer, user, reward, level);
    }
    
    /**
     * @notice Update team volume for upline
     */
    function updateTeamVolume(address user, uint256 amount) external override onlyRole(STAKING_ROLE) {
        _updateTeamVolume(user, amount);
    }
    
    function _updateTeamVolume(address user, uint256 amount) internal {
        address current = user;
        while (current != address(0) && users[current].referrer != address(0)) {
            current = users[current].referrer;
            users[current].totalTeamVolume += amount;
            _checkRankUpgrade(current);
        }
    }
    
    /**
     * @notice Check and upgrade rank
     */
    function _checkRankUpgrade(address user) internal {
        uint256 currentRank = users[user].rank;
        if (currentRank >= MAX_RANK) return;
        
        for (uint256 i = currentRank + 1; i <= MAX_RANK; i++) {
            RankInfo storage rank = ranks[i];
            if (users[user].directReferrals >= rank.minDirect &&
                users[user].totalTeamVolume >= rank.minVolume) {
                users[user].rank = i;
                emit RankUpgraded(user, currentRank, i);
                currentRank = i;
            } else {
                break;
            }
        }
    }
    
    /**
     * @notice Get referral reward for a level
     */
    function getReferralReward(uint256 stakeAmount, uint256 level) public view override returns (uint256) {
        if (level >= MAX_LEVELS) return 0;
        return (stakeAmount * levelRewards[level]) / BASIS_POINTS;
    }
    
    /**
     * @notice Get user info
     */
    function getUserInfo(address user) external view override returns (UserInfo memory) {
        return users[user];
    }
    
    /**
     * @notice Get rank info
     */
    function getRankInfo(uint256 rank) external view override returns (RankInfo memory) {
        return ranks[rank];
    }
    
    /**
     * @notice Get user rank
     */
    function getUserRank(address user) external view override returns (uint256) {
        return users[user].rank;
    }
    
    /**
     * @notice Set level rewards (admin only)
     */
    function setLevelRewards(uint256[3] calldata newRewards) external onlyRole(ADMIN_ROLE) {
        uint256 total = newRewards[0] + newRewards[1] + newRewards[2];
        require(total <= 1000, "Total rewards too high"); // Max 10% total
        levelRewards = newRewards;
        emit LevelRewardsUpdated(newRewards);
    }
    
    /**
     * @notice Set rank requirements
     */
    function setRankRequirements(
        uint256 rank,
        uint256 minDirect,
        uint256 minVolume,
        uint256 feeShare,
        uint256 govMultiplier
    ) external override onlyRole(ADMIN_ROLE) {
        require(rank > 0 && rank <= MAX_RANK, "Invalid rank");
        ranks[rank] = RankInfo({
            name: ranks[rank].name,
            minDirect: minDirect,
            minVolume: minVolume,
            feeShareBonus: feeShare,
            governanceMultiplier: govMultiplier
        });
    }
    
    /**
     * @notice Get total referral cost for a stake
     */
    function calculateTotalReferralCost(uint256 stakeAmount) external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < MAX_LEVELS; i++) {
            total += getReferralReward(stakeAmount, i);
        }
        return total;
    }
    
    /**
     * @notice Get user's direct referrals
     */
    function getDirectReferrals(address user) external view returns (address[] memory) {
        return directReferrals[user];
    }
    
    /**
     * @notice Set treasury (in case of upgrade)
     */
    function setTreasury(address _treasury) external onlyRole(ADMIN_ROLE) {
        treasury = ITreasury(_treasury);
    }
}