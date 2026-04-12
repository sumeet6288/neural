// Complete Contract ABIs for Production

export const NEURON_TOKEN_ABI = [
  // View functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function getCirculatingSupply() view returns (uint256)',
  'function totalBurned() view returns (uint256)',
  
  // State-changing functions
  'function transfer(address recipient, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
  'function burn(uint256 amount)',
  'function burnFrom(address account, uint256 amount)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event Burn(address indexed from, uint256 amount, string reason)',
  'event Mint(address indexed to, uint256 amount, string reason)',
];

export const STAKING_ABI = [
  // View functions
  'function totalStaked() view returns (uint256)',
  'function getUserStakes(address user) view returns (uint256[])',
  'function getStakeInfo(address user, uint256 stakeId) view returns (tuple(uint256 amount, uint256 startTime, uint256 endTime, uint256 lastCompoundTime, uint256 rewardRate, uint8 stakeType, bool active, bool autoCompound))',
  'function calculatePendingRewards(address user, uint256 stakeId) view returns (uint256)',
  'function calculateAPY(uint8 stakeType) view returns (uint256)',
  'function CYCLE_DURATION() view returns (uint256)',
  'function BASIS_POINTS() view returns (uint256)',
  
  // State-changing functions
  'function stake(uint256 amount, uint8 stakeType, address referrer)',
  'function unstake(uint256 stakeId)',
  'function claimRewards(uint256 stakeId)',
  'function compoundRewards(uint256 stakeId)',
  'function toggleAutoCompound(uint256 stakeId)',
  
  // Events
  'event Staked(address indexed user, uint256 indexed stakeId, uint256 amount, uint8 stakeType)',
  'event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 reward)',
  'event RewardsClaimed(address indexed user, uint256 indexed stakeId, uint256 amount)',
  'event RewardsCompounded(address indexed user, uint256 indexed stakeId, uint256 amount)',
  'event AutoCompoundToggled(address indexed user, uint256 indexed stakeId, bool enabled)',
];

export const AI_ENGINE_ABI = [
  // View functions
  'function getSystemHealth() view returns (tuple(uint256 treasuryBacking, uint256 stakingRatio, uint256 priceStability, uint256 growthRate, uint256 overallScore))',
  'function getEmissionRate() view returns (uint256)',
  'function getHealthMultiplier() view returns (uint256)',
  'function calculateEmission() view returns (uint256)',
  'function lastCycleTime() view returns (uint256)',
  'function currentEmissionRate() view returns (uint256)',
  'function launchTime() view returns (uint256)',
  'function totalEmitted() view returns (uint256)',
  
  // Constants
  'function CYCLE_DURATION() view returns (uint256)',
  'function BASIS_POINTS() view returns (uint256)',
  'function TARGET_BACKING_RATIO() view returns (uint256)',
  
  // Events
  'event ModuleTriggered(uint8 indexed module, uint256 timestamp)',
  'event HealthUpdated(uint256 newScore, uint256 timestamp)',
  'event EmissionAdjusted(uint256 oldRate, uint256 newRate)',
];

export const TREASURY_ABI = [
  // View functions
  'function getTreasuryValue() view returns (uint256)',
  'function getBackingRatio() view returns (uint256)',
  'function getTokenValue(address token) view returns (uint256)',
  'function canBuyback(uint256 neuronAmount) view returns (bool)',
  'function totalRewardsDistributed() view returns (uint256)',
  'function totalReferralRewards() view returns (uint256)',
  'function totalBuybacks() view returns (uint256)',
  
  // State-changing functions
  'function depositETH() payable',
  'function depositToken(address token, uint256 amount)',
  'function executeBuyback(uint256 neuronAmount)',
  'function executeStabilization()',
  'function fundRewards(uint256 amount)',
  'function fundReferralRewards(uint256 amount)',
  
  // Events
  'event Deposit(address indexed token, uint256 amount, uint256 value)',
  'event Withdrawal(address indexed token, uint256 amount, address indexed recipient)',
  'event BuybackExecuted(uint256 neuronAmount, uint256 cost)',
  'event StabilizationExecuted(bool isBuy, uint256 amount)',
  'event RewardsFunded(uint256 amount)',
];

export const REFERRAL_ABI = [
  // View functions
  'function getUserInfo(address user) view returns (tuple(address referrer, uint256 directReferrals, uint256 totalTeamVolume, uint256 rank, uint256 totalEarned))',
  'function getRankInfo(uint256 rank) view returns (tuple(string name, uint256 minDirect, uint256 minVolume, uint256 feeShareBonus, uint256 governanceMultiplier))',
  'function getReferralReward(uint256 stakeAmount, uint256 level) view returns (uint256)',
  'function getUserRank(address user) view returns (uint256)',
  'function levelRewards(uint256) view returns (uint256)',
  
  // State-changing functions
  'function setReferrer(address referrer)',
  'function processReferralRewards(address user, uint256 stakeAmount)',
  
  // Events
  'event ReferrerSet(address indexed user, address indexed referrer)',
  'event ReferralRewardPaid(address indexed referrer, address indexed user, uint256 amount, uint256 level)',
  'event RankUpgraded(address indexed user, uint256 oldRank, uint256 newRank)',
];

export const PRICE_FEED_ABI = [
  // View functions
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() view returns (uint8)',
  'function description() view returns (string)',
  'function version() view returns (uint256)',
  
  // Events
  'event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt)',
  'event NewRound(uint256 indexed roundId, address indexed startedBy, uint256 startedAt)',
];

// Export all ABIs
export const ABIS = {
  NEURON_TOKEN: NEURON_TOKEN_ABI,
  STAKING: STAKING_ABI,
  AI_ENGINE: AI_ENGINE_ABI,
  TREASURY: TREASURY_ABI,
  REFERRAL: REFERRAL_ABI,
  PRICE_FEED: PRICE_FEED_ABI,
};
