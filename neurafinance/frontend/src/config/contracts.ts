// Contract Addresses - Update these with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  // Polygon Mainnet
  137: {
    NEURON_TOKEN: '0x...', // Replace with actual address
    STAKING: '0x...',
    TREASURY: '0x...',
    AI_ENGINE: '0x...',
    REFERRAL: '0x...',
    LENDING: '0x...',
    PRICE_FEED: '0x...', // Chainlink NEURON/USD
  },
  // Mumbai Testnet
  80001: {
    NEURON_TOKEN: '0x...',
    STAKING: '0x...',
    TREASURY: '0x...',
    AI_ENGINE: '0x...',
    REFERRAL: '0x...',
    LENDING: '0x...',
    PRICE_FEED: '0x...',
  },
  // Hardhat Local
  31337: {
    NEURON_TOKEN: '0x...',
    STAKING: '0x...',
    TREASURY: '0x...',
    AI_ENGINE: '0x...',
    REFERRAL: '0x...',
    LENDING: '0x...',
    PRICE_FEED: '0x...',
  },
};

// RPC Providers
export const RPC_URLS = {
  137: 'https://polygon-rpc.com',
  80001: 'https://rpc-mumbai.maticvigil.com',
  31337: 'http://localhost:8545',
};

// Chainlink Price Feed Addresses
export const PRICE_FEEDS = {
  137: {
    MATIC_USD: '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0',
    ETH_USD: '0xF9680D99D6C9589e2a93a78A04A279e509205945',
  },
  80001: {
    MATIC_USD: '0xd0D5e3db44DE05E9F294BB0a3bEEaF030DE24Ada',
    ETH_USD: '0x0715A7794a1dc8e42615F059dD6e406A6594651A',
  },
};

// Contract ABIs (Minimal for frontend)
export const TOKEN_ABI = [
  'function totalSupply() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address, uint256) returns (bool)',
  'function approve(address, uint256) returns (bool)',
  'function allowance(address, address) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

export const STAKING_ABI = [
  'function totalStaked() view returns (uint256)',
  'function getUserStakes(address user) view returns (uint256[])',
  'function getStakeInfo(address user, uint256 stakeId) view returns (tuple(uint256 amount, uint256 startTime, uint256 endTime, uint256 lastCompoundTime, uint256 rewardRate, uint8 stakeType, bool active, bool autoCompound))',
  'function calculatePendingRewards(address user, uint256 stakeId) view returns (uint256)',
  'function calculateAPY(uint8 stakeType) view returns (uint256)',
  'function stake(uint256 amount, uint8 stakeType, address referrer)',
  'function unstake(uint256 stakeId)',
  'function claimRewards(uint256 stakeId)',
  'function compoundRewards(uint256 stakeId)',
  'event Staked(address indexed user, uint256 indexed stakeId, uint256 amount, uint8 stakeType)',
  'event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 reward)',
  'event RewardsClaimed(address indexed user, uint256 indexed stakeId, uint256 amount)',
];

export const AI_ENGINE_ABI = [
  'function getSystemHealth() view returns (tuple(uint256 treasuryBacking, uint256 stakingRatio, uint256 priceStability, uint256 growthRate, uint256 overallScore))',
  'function getEmissionRate() view returns (uint256)',
  'function getHealthMultiplier() view returns (uint256)',
  'function calculateEmission() view returns (uint256)',
  'function lastCycleTime() view returns (uint256)',
  'function currentEmissionRate() view returns (uint256)',
  'event HealthUpdated(uint256 newScore, uint256 timestamp)',
];

export const TREASURY_ABI = [
  'function getTreasuryValue() view returns (uint256)',
  'function getBackingRatio() view returns (uint256)',
  'function totalRewardsDistributed() view returns (uint256)',
  'function totalBuybacks() view returns (uint256)',
  'event Deposit(address indexed token, uint256 amount, uint256 value)',
  'event RewardsFunded(uint256 amount)',
];

export const REFERRAL_ABI = [
  'function getUserInfo(address user) view returns (tuple(address referrer, uint256 directReferrals, uint256 totalTeamVolume, uint256 rank, uint256 totalEarned))',
  'function getReferralReward(uint256 stakeAmount, uint256 level) view returns (uint256)',
  'function getUserRank(address user) view returns (uint256)',
  'event ReferralRewardPaid(address indexed referrer, address indexed user, uint256 amount, uint256 level)',
];

export const PRICE_FEED_ABI = [
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() view returns (uint8)',
];

// Network Config
export const NETWORK_CONFIG = {
  137: {
    name: 'Polygon Mainnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorer: 'https://polygonscan.com',
  },
  80001: {
    name: 'Mumbai Testnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorer: 'https://mumbai.polygonscan.com',
  },
  31337: {
    name: 'Hardhat Local',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    blockExplorer: '',
  },
};
