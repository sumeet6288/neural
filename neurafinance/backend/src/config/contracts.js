// Contract ABIs and configurations
const NEURON_TOKEN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function burnFrom(address account, uint256 amount)",
  "function setFeeRecipients(address treasury, address liquidity, address rewards)",
  "function setFeePercentages(uint256 buyFee, uint256 sellFee)",
  "function whitelistAddress(address account, bool isWhitelisted)",
  "function isWhitelisted(address account) view returns (bool)",
  "function owner() view returns (address)",
  "function authorizeMinter(address minter)",
  "function revokeMinter(address minter)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Mint(address indexed to, uint256 amount)",
  "event Burn(address indexed from, uint256 amount)"
];

const TREASURY_ABI = [
  "function deposit(address token, uint256 amount)",
  "function withdraw(address token, uint256 amount, address recipient)",
  "function executeBuyback(uint256 amount)",
  "function addLiquidity(uint256 tokenAmount, uint256 stableAmount)",
  "function getBalance(address token) view returns (uint256)",
  "function getTotalValueLocked() view returns (uint256)",
  "function getTokenPrice() view returns (uint256)",
  "function authorizedCallers(address) view returns (bool)",
  "function authorizeCaller(address caller)",
  "function revokeCaller(address caller)",
  "function owner() view returns (address)",
  "event Deposit(address indexed token, uint256 amount, address indexed from)",
  "event Withdrawal(address indexed token, uint256 amount, address indexed to)",
  "event BuybackExecuted(uint256 amount, uint256 price)"
];

const STAKING_ABI = [
  "function stake(uint256 amount, uint256 lockDuration)",
  "function unstake(uint256 stakeId)",
  "function claimRewards(uint256 stakeId)",
  "function compoundRewards(uint256 stakeId)",
  "function getStakeInfo(address user, uint256 stakeId) view returns (tuple(uint256 amount, uint256 startTime, uint256 endTime, uint256 rewardRate, uint256 lastClaimTime, uint256 pendingRewards, bool isFlexible, bool active))",
  "function getTotalStaked(address user) view returns (uint256)",
  "function getPendingRewards(address user, uint256 stakeId) view returns (uint256)",
  "function setRewardRates(uint256 flexibleRate, uint256[] bondRates)",
  "function globalTotalStaked() view returns (uint256)",
  "function owner() view returns (address)",
  "event Staked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 lockDuration)",
  "event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 indexed stakeId, uint256 amount)"
];

const REFERRAL_ABI = [
  "function registerReferrer(address referrer)",
  "function recordStake(address user, uint256 amount)",
  "function processReferralRewards(address user, uint256 stakeAmount)",
  "function getUserInfo(address user) view returns (tuple(address referrer, uint256 referralCount, uint256 teamVolume, uint256 rank, uint256 totalEarned))",
  "function getRankRequirements(uint256 rank) view returns (tuple(string name, uint256 minStake, uint256 minTeamVolume, uint256 minReferrals, uint256 bonusPercentage))",
  "function calculateRank(address user) view returns (uint256)",
  "function referrals(address, uint256) view returns (address)",
  "event ReferrerRegistered(address indexed user, address indexed referrer)",
  "event RankUpgraded(address indexed user, uint256 newRank)"
];

const DAO_ABI = [
  "function createProposal(string title, string description, address target, bytes callData) returns (uint256)",
  "function castVote(uint256 proposalId, bool support)",
  "function executeProposal(uint256 proposalId)",
  "function cancelProposal(uint256 proposalId)",
  "function getVotingPower(address user) view returns (uint256)",
  "function getProposal(uint256 proposalId) view returns (tuple(uint256 id, address proposer, string title, string description, bytes callData, address target, uint256 forVotes, uint256 againstVotes, uint256 startTime, uint256 endTime, bool executed, bool canceled))",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalCount() view returns (uint256)",
  "event ProposalCreated(uint256 indexed id, address indexed proposer, string title, uint256 startTime, uint256 endTime)",
  "event VoteCast(address indexed voter, uint256 indexed proposalId, bool support, uint256 votes)",
  "event ProposalExecuted(uint256 indexed proposalId)"
];

const LENDING_ABI = [
  "function depositCollateral(address token, uint256 amount)",
  "function borrow(address collateralToken, uint256 collateralAmount, uint256 borrowAmount) returns (uint256)",
  "function repay(uint256 loanId, uint256 amount)",
  "function liquidate(uint256 loanId)",
  "function getLoan(uint256 loanId) view returns (tuple(uint256 id, address borrower, uint256 collateralAmount, uint256 borrowedAmount, uint256 interestRate, uint256 startTime, uint256 dueTime, uint256 totalRepaid, bool active, bool liquidated))",
  "function getCollateralValue(address user, address token) view returns (uint256)",
  "function getMaxBorrowAmount(address token, uint256 collateralAmount) view returns (uint256)",
  "function getHealthFactor(uint256 loanId) view returns (uint256)",
  "function loanCount() view returns (uint256)",
  "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 collateralAmount, uint256 borrowedAmount)",
  "event LoanRepaid(uint256 indexed loanId, uint256 amount)",
  "event LoanLiquidated(uint256 indexed loanId, address indexed liquidator)"
];

const STABLECOIN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function burnFrom(address account, uint256 amount)",
  "function setTreasury(address _treasury)",
  "function setCollateralRatio(uint256 ratio)",
  "function getCollateralRatio() view returns (uint256)",
  "function collateralRatio() view returns (uint256)",
  "event Minted(address indexed to, uint256 amount, uint256 collateral)",
  "event Burned(address indexed from, uint256 amount)"
];

const AI_ENGINE_ABI = [
  "function calculateEmission(uint256 totalSupply, uint256 stakedAmount) view returns (uint256)",
  "function requestMint(uint256 amount)",
  "function requestBurn(uint256 amount)",
  "function checkPriceStability() view returns (bool isStable, uint256 deviation)",
  "function triggerBuyback(uint256 amount)",
  "function triggerSellPressure(uint256 amount)",
  "function collectFees()",
  "function reinvestToLiquidity(uint256 amount)",
  "function distributeToTreasury(uint256 amount)",
  "function validateMintRequest(uint256 amount) view returns (bool)",
  "function validateSupplyHealth() view returns (bool)",
  "function getMaxMintable() view returns (uint256)",
  "function adjustEmissionRate()",
  "function adjustRewardRates()",
  "function getSystemHealth() view returns (uint256)",
  "function triggerSystemUpdate()",
  "function getCurrentPrice() view returns (uint256)",
  "function lastSystemUpdate() view returns (uint256)",
  "function updateInterval() view returns (uint256)",
  "event EmissionCalculated(uint256 amount, uint256 timestamp)",
  "event BuybackTriggered(uint256 amount, uint256 price)",
  "event FeesCollected(uint256 amount)",
  "event SupplyValidated(bool healthy, uint256 ratio)",
  "event ParametersAdjusted(uint256 emissionRate, uint256 rewardRate)",
  "event SystemUpdateTriggered(uint256 timestamp, uint256 healthScore)"
];

module.exports = {
  NEURON_TOKEN_ABI,
  TREASURY_ABI,
  STAKING_ABI,
  REFERRAL_ABI,
  DAO_ABI,
  LENDING_ABI,
  STABLECOIN_ABI,
  AI_ENGINE_ABI
};
