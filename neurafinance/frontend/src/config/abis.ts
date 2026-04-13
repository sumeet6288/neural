// Minimal Staking ABI for frontend interactions
export const STAKING_ABI = [
  "function stake(uint256 amount, uint256 lockDuration) external",
  "function unstake(uint256 stakeId) external",
  "function claimRewards(uint256 stakeId) external",
  "function compoundRewards(uint256 stakeId) external",
  "function getStakeInfo(address user, uint256 stakeId) external view returns (tuple(uint256 amount, uint256 startTime, uint256 endTime, uint256 rewardRate, uint256 lastClaimTime, uint256 pendingRewards, bool isFlexible, bool active))",
  "function getUserStakes(address user) external view returns (uint256[])",
  "function getTotalStaked(address user) external view returns (uint256)",
  "function globalTotalStaked() external view returns (uint256)",
  "function calculatePendingRewards(address user, uint256 stakeId) external view returns (uint256)",
  "function getRewardRate(uint256 lockDuration) external view returns (uint256)"
];

// Minimal NEURON Token ABI
export const NEURON_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
  "function totalSupply() external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string memory)"
];

// Treasury ABI
export const TREASURY_ABI = [
  "function getTotalValueLocked() external view returns (uint256)",
  "function getTokenPrice() external view returns (uint256)",
  "function getBalance(address token) external view returns (uint256)"
];

// AI Engine ABI
export const AI_ENGINE_ABI = [
  "function getSystemHealth() external view returns (uint256)",
  "function getCurrentPrice() external view returns (uint256)",
  "function checkPriceStability() external view returns (bool isStable, uint256 deviation)",
  "function calculateEmission(uint256 totalSupply, uint256 stakedAmount) external view returns (uint256)"
];

// Lending ABI
export const LENDING_ABI = [
  "function borrow(address collateralToken, uint256 collateralAmount, uint256 borrowAmount) external returns (uint256)",
  "function repay(uint256 loanId, uint256 amount) external",
  "function liquidate(uint256 loanId) external",
  "function getLoan(uint256 loanId) external view returns (tuple(uint256 id, address borrower, address collateralToken, uint256 collateralAmount, uint256 borrowedAmount, uint256 interestRate, uint256 startTime, uint256 dueTime, uint256 totalRepaid, bool active, bool liquidated))",
  "function getHealthFactor(uint256 loanId) external view returns (uint256)",
  "function getUserLoans(address user) external view returns (uint256[])"
];

// Referral ABI - matching actual Referral.sol contract
export const REFERRAL_ABI = [
  "function registerReferrer(address referrer) external",
  "function getUserInfo(address user) external view returns (tuple(address referrer, uint256 referralCount, uint256 teamVolume, uint256 rank, uint256 totalEarned))",
  "function getRankRequirements(uint256 rank) external view returns (tuple(string name, uint256 minStake, uint256 minTeamVolume, uint256 minReferrals, uint256 bonusPercentage))",
  "function calculateRank(address user) external view returns (uint256)",
  "function getReferrals(address referrer) external view returns (address[])",
  "function getReferralCount(address referrer) external view returns (uint256)",
  "function updateRank(address user) external",
];

// Price Feed ABI (Chainlink)
export const PRICE_FEED_ABI = [
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() external view returns (uint8)"
];

// All ABIS export for usePolygonData
export const ABIS = {
  NEURON_TOKEN: NEURON_TOKEN_ABI,
  STAKING: STAKING_ABI,
  TREASURY: TREASURY_ABI,
  AI_ENGINE: AI_ENGINE_ABI,
  LENDING: LENDING_ABI,
  REFERRAL: REFERRAL_ABI,
  PRICE_FEED: PRICE_FEED_ABI,
};
