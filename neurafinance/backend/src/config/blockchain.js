const { ethers } = require('ethers');
require('dotenv').config();

// Check if blockchain is properly configured
const hasPrivateKey = process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length > 10;
const hasRpcUrl = process.env.POLYGON_RPC_URL && !process.env.POLYGON_RPC_URL.includes('YOUR_API_KEY');

let provider = null;
let wallet = null;
let isDemoMode = true;

if (hasRpcUrl && hasPrivateKey) {
  try {
    provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    isDemoMode = false;
    console.log('[Blockchain] Connected to Polygon RPC');
  } catch (error) {
    console.warn('[Blockchain] Failed to initialize:', error.message);
    console.warn('[Blockchain] Running in DEMO mode');
  }
} else {
  console.warn('[Blockchain] Missing PRIVATE_KEY or RPC URL - running in DEMO mode');
}

const CONTRACTS = {
  NEURON_TOKEN: process.env.NEURON_TOKEN_ADDRESS || '',
  TREASURY: process.env.TREASURY_ADDRESS || '',
  STAKING: process.env.STAKING_ADDRESS || '',
  REFERRAL: process.env.REFERRAL_ADDRESS || '',
  DAO: process.env.DAO_ADDRESS || '',
  LENDING: process.env.LENDING_ADDRESS || '',
  STABLECOIN: process.env.STABLECOIN_ADDRESS || '',
  AI_ENGINE: process.env.AI_ENGINE_ADDRESS || ''
};

function getContract(address, abi) {
  if (!wallet || !address) return null;
  return new ethers.Contract(address, abi, wallet);
}

module.exports = {
  provider,
  wallet,
  CONTRACTS,
  getContract,
  isDemoMode
};
