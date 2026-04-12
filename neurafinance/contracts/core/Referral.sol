// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IReferral.sol";
import "../interfaces/INeuronToken.sol";
import "../libraries/SafeMath.sol";

contract Referral is IReferral {
    using SafeMath for uint256;
    
    // 15 Rank levels
    RankInfo[15] public ranks;
    
    // User data
    mapping(address => UserInfo) public users;
    mapping(address => address[]) public referrals; // referrer => list of referees
    
    // Configuration
    uint256 public directRewardPercent = 1000; // 10%
    uint256 public rankBonusPercent = 500; // 5% base for rank bonuses
    uint256 public constant PERCENT_DENOMINATOR = 10000;
    
    INeuronToken public neuronToken;
    
    address public owner;
    address public pendingOwner;
    address public stakingContract;
    
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event StakingContractUpdated(address indexed staking);
    event RankRequirementsUpdated(uint256 indexed rank, string name);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Referral: not owner");
        _;
    }
    
    modifier onlyStaking() {
        require(msg.sender == stakingContract, "Referral: not staking contract");
        _;
    }
    
    constructor(address _neuronToken) {
        owner = msg.sender;
        neuronToken = INeuronToken(_neuronToken);
        
        // Initialize rank requirements
        _initializeRanks();
    }
    
    function _initializeRanks() internal {
        ranks[0] = RankInfo("Novice", 100 * 10**18, 0, 0, 0);
        ranks[1] = RankInfo("Explorer", 500 * 10**18, 1000 * 10**18, 3, 100);
        ranks[2] = RankInfo("Seeker", 1000 * 10**18, 5000 * 10**18, 5, 200);
        ranks[3] = RankInfo("Apprentice", 2500 * 10**18, 15000 * 10**18, 8, 300);
        ranks[4] = RankInfo("Journeyman", 5000 * 10**18, 50000 * 10**18, 12, 500);
        ranks[5] = RankInfo("Adept", 10000 * 10**18, 150000 * 10**18, 18, 700);
        ranks[6] = RankInfo("Expert", 25000 * 10**18, 500000 * 10**18, 25, 1000);
        ranks[7] = RankInfo("Elite", 50000 * 10**18, 1500000 * 10**18, 35, 1300);
        ranks[8] = RankInfo("Master", 100000 * 10**18, 5000000 * 10**18, 50, 1700);
        ranks[9] = RankInfo("Grandmaster", 250000 * 10**18, 15000000 * 10**18, 75, 2200);
        ranks[10] = RankInfo("Legend", 500000 * 10**18, 50000000 * 10**18, 100, 2800);
        ranks[11] = RankInfo("Mythic", 1000000 * 10**18, 150000000 * 10**18, 150, 3500);
        ranks[12] = RankInfo("Immortal", 2500000 * 10**18, 500000000 * 10**18, 220, 4300);
        ranks[13] = RankInfo("Transcendent", 5000000 * 10**18, 1500000000 * 10**18, 300, 5200);
        ranks[14] = RankInfo("Cosmic", 10000000 * 10**18, 5000000000 * 10**18, 500, 6500);
    }
    
    function registerReferrer(address referrer) external override {
        require(referrer != address(0), "Referral: zero referrer");
        require(referrer != msg.sender, "Referral: cannot refer self");
        require(users[msg.sender].referrer == address(0), "Referral: already registered");
        
        users[msg.sender].referrer = referrer;
        referrals[referrer].push(msg.sender);
        users[referrer].referralCount = users[referrer].referralCount.add(1);
        
        emit ReferrerRegistered(msg.sender, referrer);
    }
    
    function recordStake(address user, uint256 amount) external override onlyStaking {
        // Update team volume for all upline referrers
        address current = users[user].referrer;
        uint256 depth = 0;
        uint256 maxDepth = 5; // Track up to 5 levels
        
        while (current != address(0) && depth < maxDepth) {
            users[current].teamVolume = users[current].teamVolume.add(amount);
            
            // Check for rank upgrade
            _checkRankUpgrade(current);
            
            current = users[current].referrer;
            depth++;
        }
    }
    
    function processReferralRewards(address user, uint256 stakeAmount) external override onlyStaking {
        address referrer = users[user].referrer;
        if (referrer == address(0)) return;
        
        // Direct referral reward (10%)
        uint256 directReward = stakeAmount.mul(directRewardPercent).div(PERCENT_DENOMINATOR);
        users[referrer].totalEarned = users[referrer].totalEarned.add(directReward);
        neuronToken.mint(referrer, directReward);
        
        emit ReferralRewardPaid(referrer, user, directReward);
        
        // Rank bonus (ROI-on-ROI)
        uint256 currentRank = users[referrer].rank;
        if (currentRank > 0) {
            uint256 rankBonus = stakeAmount.mul(ranks[currentRank].bonusPercentage).div(PERCENT_DENOMINATOR);
            users[referrer].totalEarned = users[referrer].totalEarned.add(rankBonus);
            neuronToken.mint(referrer, rankBonus);
            
            emit ReferralRewardPaid(referrer, user, rankBonus);
        }
    }
    
    function _checkRankUpgrade(address user) internal {
        uint256 currentRank = users[user].rank;
        uint256 newRank = calculateRank(user);
        
        if (newRank > currentRank) {
            users[user].rank = newRank;
            emit RankUpgraded(user, newRank);
        }
    }
    
    function calculateRank(address user) public view override returns (uint256) {
        UserInfo storage info = users[user];
        
        for (uint256 i = 14; i > 0; i--) {
            RankInfo storage rank = ranks[i];
            if (info.teamVolume >= rank.minTeamVolume &&
                info.referralCount >= rank.minReferrals) {
                return i;
            }
        }
        
        return 0;
    }
    
    function getUserInfo(address user) external view override returns (UserInfo memory) {
        return users[user];
    }
    
    function getRankRequirements(uint256 rank) external view override returns (RankInfo memory) {
        require(rank < 15, "Referral: invalid rank");
        return ranks[rank];
    }
    
    function getReferrals(address referrer) external view returns (address[] memory) {
        return referrals[referrer];
    }
    
    function getReferralCount(address referrer) external view returns (uint256) {
        return referrals[referrer].length;
    }
    
    // Admin functions
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Referral: zero address");
        pendingOwner = newOwner;
    }
    
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Referral: not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
    
    function setStakingContract(address _staking) external onlyOwner {
        stakingContract = _staking;
        emit StakingContractUpdated(_staking);
    }
    
    function setDirectRewardPercent(uint256 percent) external onlyOwner {
        require(percent <= 2000, "Referral: percent too high"); // Max 20%
        directRewardPercent = percent;
    }
    
    function setRankRequirements(
        uint256 rank,
        string calldata name,
        uint256 minStake,
        uint256 minTeamVolume,
        uint256 minReferrals,
        uint256 bonusPercentage
    ) external onlyOwner {
        require(rank < 15, "Referral: invalid rank");
        ranks[rank] = RankInfo(name, minStake, minTeamVolume, minReferrals, bonusPercentage);
        emit RankRequirementsUpdated(rank, name);
    }
    
    function updateRank(address user) external {
        _checkRankUpgrade(user);
    }
}
