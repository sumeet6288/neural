const { ethers } = require('ethers');
require('dotenv').config();

// Initialize provider
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

// Initialize wallet
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract addresses from environment
const CONTRACTS = {
  NEURON_TOKEN: process.env.NEURON_TOKEN_ADDRESS,
  TREASURY: process.env.TREASURY_ADDRESS,
  STAKING: process.env.STAKING_ADDRESS,
  REFERRAL: process.env.REFERRAL_ADDRESS,
  DAO: process.env.DAO_ADDRESS,
  LENDING: process.env.LENDING_ADDRESS,
  STABLECOIN: process.env.STABLECOIN_ADDRESS,
  AI_ENGINE: process.env.AI_ENGINE_ADDRESS
};

// Initialize contract instances
function getContract(address, abi) {
  return new ethers.Contract(address, abi, wallet);
}

module.exports = {
  provider,
  wallet,
  CONTRACTS,
  getContract
};
