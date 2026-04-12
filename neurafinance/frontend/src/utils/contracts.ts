// Contract ABIs
export const NEURON_TOKEN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address recipient, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function setFeeRecipients(address treasury, address liquidity, address rewards)",
  "function setFeePercentages(uint256 buyFee, uint256 sellFee)",
  "function whitelistAddress(address account, bool isWhitelisted)",
  "function isWhitelisted(address account) view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const STAKING_ABI = [
  "function stake(uint256 amount, uint256 lockDuration)",
  "function unstake(uint256 stakeId)",
  "function claimRewards(uint256 stakeId)",
  "function compoundRewards(uint256 stakeId)",
  "function getStakeInfo(address user, uint256 stakeId) view returns (tuple(uint256 amount, uint256 startTime, uint256 endTime, uint256 rewardRate, uint256 lastClaimTime, uint256 pendingRewards, bool isFlexible, bool active))",
  "function getTotalStaked(address user) view returns (uint256)",
  "function getPendingRewards(address user, uint256 stakeId) view returns (uint256)",
  "function globalTotalStaked() view returns (uint256)",
  "event Staked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 lockDuration)",
  "event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount)"
];

export const TREASURY_ABI = [
  "function deposit(address token, uint256 amount)",
  "function withdraw(address token, uint256 amount, address recipient)",
  "function getBalance(address token) view returns (uint256)",
  "function getTotalValueLocked() view returns (uint256)"
];

export const LENDING_ABI = [
  "function depositCollateral(address token, uint256 amount)",
  "function borrow(address collateralToken, uint256 collateralAmount, uint256 borrowAmount) returns (uint256)",
  "function repay(uint256 loanId, uint256 amount)",
  "function getLoan(uint256 loanId) view returns (tuple(uint256 id, address borrower, uint256 collateralAmount, uint256 borrowedAmount, uint256 interestRate, uint256 startTime, uint256 dueTime, uint256 totalRepaid, bool active, bool liquidated))",
  "function getHealthFactor(uint256 loanId) view returns (uint256)"
];

export const DAO_ABI = [
  "function createProposal(string title, string description, address target, bytes callData) returns (uint256)",
  "function castVote(uint256 proposalId, bool support)",
  "function executeProposal(uint256 proposalId)",
  "function getVotingPower(address user) view returns (uint256)",
  "function getProposal(uint256 proposalId) view returns (tuple(uint256 id, address proposer, string title, string description, bytes callData, address target, uint256 forVotes, uint256 againstVotes, uint256 startTime, uint256 endTime, bool executed, bool canceled))",
  "function state(uint256 proposalId) view returns (uint8)"
];

export const REFERRAL_ABI = [
  "function registerReferrer(address referrer)",
  "function getUserInfo(address user) view returns (tuple(address referrer, uint256 referralCount, uint256 teamVolume, uint256 rank, uint256 totalEarned))",
  "function calculateRank(address user) view returns (uint256)"
];

export const AI_ENGINE_ABI = [
  "function getSystemHealth() view returns (uint256)",
  "function getCurrentPrice() view returns (uint256)",
  "function checkPriceStability() view returns (bool isStable, uint256 deviation)"
];

// Contract addresses (update after deployment)
export const CONTRACTS = {
  NEURON_TOKEN: process.env.NEXT_PUBLIC_NEURON_TOKEN_ADDRESS || '',
  STAKING: process.env.NEXT_PUBLIC_STAKING_ADDRESS || '',
  TREASURY: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '',
  LENDING: process.env.NEXT_PUBLIC_LENDING_ADDRESS || '',
  DAO: process.env.NEXT_PUBLIC_DAO_ADDRESS || '',
  REFERRAL: process.env.NEXT_PUBLIC_REFERRAL_ADDRESS || '',
  AI_ENGINE: process.env.NEXT_PUBLIC_AI_ENGINE_ADDRESS || '',
};

// Bond durations
export const BOND_DURATIONS = {
  FLEXIBLE: 0,
  DAYS_45: 45 * 24 * 60 * 60, // 45 days in seconds
  DAYS_90: 90 * 24 * 60 * 60,
  DAYS_180: 180 * 24 * 60 * 60,
  DAYS_360: 360 * 24 * 60 * 60,
};

export const BOND_OPTIONS = [
  { label: 'Flexible', duration: BOND_DURATIONS.FLEXIBLE, apy: 5 },
  { label: '45 Days', duration: BOND_DURATIONS.DAYS_45, apy: 15 },
  { label: '90 Days', duration: BOND_DURATIONS.DAYS_90, apy: 25 },
  { label: '180 Days', duration: BOND_DURATIONS.DAYS_180, apy: 40 },
  { label: '360 Days', duration: BOND_DURATIONS.DAYS_360, apy: 80 },
];

// Rank names
export const RANK_NAMES = [
  'Novice',
  'Explorer',
  'Seeker',
  'Apprentice',
  'Journeyman',
  'Adept',
  'Expert',
  'Elite',
  'Master',
  'Grandmaster',
  'Legend',
  'Mythic',
  'Immortal',
  'Transcendent',
  'Cosmic',
];

// Format large numbers
export function formatNumber(num: number | string, decimals = 2): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  
  if (n >= 1e9) return (n / 1e9).toFixed(decimals) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(decimals) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(decimals) + 'K';
  return n.toFixed(decimals);
}

// Format token amount (18 decimals)
export function formatTokenAmount(amount: string | bigint, decimals = 18): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
  const whole = amountBigInt / divisor;
  const fraction = amountBigInt % divisor;
  
  return `${whole}.${fraction.toString().padStart(decimals, '0').slice(0, 4)}`;
}

// Calculate power for BigInt
function bigIntPow(base: bigint, exponent: number): bigint {
  let result = BigInt(1);
  for (let i = 0; i < exponent; i++) {
    result *= base;
  }
  return result;
}

// Format address for display
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
