// Polygon Network Configuration
export const POLYGON_CONFIG = {
  chainId: 137,
  name: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: [
    'https://polygon-rpc.com',
    'https://rpc-mainnet.matic.network',
    'https://matic-mainnet.chainstacklabs.com',
  ],
  blockExplorer: 'https://polygonscan.com',
};

export const MUMBAI_CONFIG = {
  chainId: 80001,
  name: 'Polygon Mumbai',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: [
    'https://rpc-mumbai.maticvigil.com',
    'https://matic-mumbai.chainstacklabs.com',
  ],
  blockExplorer: 'https://mumbai.polygonscan.com',
};

// Contract Addresses - UPDATE THESE WITH YOUR DEPLOYED CONTRACTS
export const CONTRACT_ADDRESSES = {
  [POLYGON_CONFIG.chainId]: {
    NEURON_TOKEN: process.env.NEXT_PUBLIC_NEURON_TOKEN || '0x0000000000000000000000000000000000000000',
    STAKING: process.env.NEXT_PUBLIC_STAKING || '0x0000000000000000000000000000000000000000',
    TREASURY: process.env.NEXT_PUBLIC_TREASURY || '0x0000000000000000000000000000000000000000',
    AI_ENGINE: process.env.NEXT_PUBLIC_AI_ENGINE || '0x0000000000000000000000000000000000000000',
    REFERRAL: process.env.NEXT_PUBLIC_REFERRAL || '0x0000000000000000000000000000000000000000',
    PRICE_FEED: process.env.NEXT_PUBLIC_PRICE_FEED || '0x0000000000000000000000000000000000000000',
  },
  [MUMBAI_CONFIG.chainId]: {
    NEURON_TOKEN: process.env.NEXT_PUBLIC_NEURON_TOKEN_MUMBAI || '0x0000000000000000000000000000000000000000',
    STAKING: process.env.NEXT_PUBLIC_STAKING_MUMBAI || '0x0000000000000000000000000000000000000000',
    TREASURY: process.env.NEXT_PUBLIC_TREASURY_MUMBAI || '0x0000000000000000000000000000000000000000',
    AI_ENGINE: process.env.NEXT_PUBLIC_AI_ENGINE_MUMBAI || '0x0000000000000000000000000000000000000000',
    REFERRAL: process.env.NEXT_PUBLIC_REFERRAL_MUMBAI || '0x0000000000000000000000000000000000000000',
    PRICE_FEED: process.env.NEXT_PUBLIC_PRICE_FEED_MUMBAI || '0x0000000000000000000000000000000000000000',
  },
};

// Chainlink Price Feeds on Polygon
export const CHAINLINK_FEEDS = {
  [POLYGON_CONFIG.chainId]: {
    MATIC_USD: '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0',
    ETH_USD: '0xF9680D99D6C9589e2a93a78A04A279e509205945',
    BTC_USD: '0xc907E116054Ad103354f2D350FD2514433f57F6f',
    USDC_USD: '0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7',
  },
  [MUMBAI_CONFIG.chainId]: {
    MATIC_USD: '0xd0D5e3db44DE05E9F294BB0a3bEEaF030DE24Ada',
    ETH_USD: '0x0715A7794a1dc8e42615F059dD6e406A6594651A',
    BTC_USD: '0x007A22900a3B98143368Bd5906f8E17e9867581b',
  },
};

// Supported Networks
export const SUPPORTED_NETWORKS = [POLYGON_CONFIG.chainId, MUMBAI_CONFIG.chainId];

// Get RPC URL
export function getRpcUrl(chainId: number): string {
  if (chainId === POLYGON_CONFIG.chainId) {
    return POLYGON_CONFIG.rpcUrls[0];
  }
  if (chainId === MUMBAI_CONFIG.chainId) {
    return MUMBAI_CONFIG.rpcUrls[0];
  }
  return POLYGON_CONFIG.rpcUrls[0];
}

// Get Network Config
export function getNetworkConfig(chainId: number) {
  if (chainId === POLYGON_CONFIG.chainId) return POLYGON_CONFIG;
  if (chainId === MUMBAI_CONFIG.chainId) return MUMBAI_CONFIG;
  return POLYGON_CONFIG;
}
