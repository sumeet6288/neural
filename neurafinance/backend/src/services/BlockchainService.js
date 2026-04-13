const { provider, wallet, CONTRACTS, getContract, isDemoMode } = require('../config/blockchain');
const {
  NEURON_TOKEN_ABI,
  TREASURY_ABI,
  STAKING_ABI,
  LENDING_ABI,
  STABLECOIN_ABI,
  AI_ENGINE_ABI
} = require('../config/contracts');
const logger = require('../utils/logger');

// Demo data for when blockchain is not connected
const DEMO_DATA = {
  totalSupply: '7986831940000000000000000',
  maxSupply: '21000000000000000000000000',
  totalStaked: '5234567890000000000000000',
  tvl: '3711771810000000000000000',
  tokenPrice: '2170000000000000000',
  healthScore: 98,
  stablecoinSupply: '1250000000000000000000000',
  collateralRatio: '1500000000000000000',
  blockNumber: 52847392,
  stakingRatio: 65.54,
  priceStability: { isStable: true, deviation: 50 },
};

class BlockchainService {
  constructor() {
    this.contracts = {};
    this.demoMode = isDemoMode;
    if (!this.demoMode) {
      this.initializeContracts();
    } else {
      logger.info('BlockchainService running in DEMO mode - serving static data');
    }
  }

  initializeContracts() {
    if (CONTRACTS.NEURON_TOKEN) {
      this.contracts.neuronToken = getContract(CONTRACTS.NEURON_TOKEN, NEURON_TOKEN_ABI);
    }
    if (CONTRACTS.TREASURY) {
      this.contracts.treasury = getContract(CONTRACTS.TREASURY, TREASURY_ABI);
    }
    if (CONTRACTS.STAKING) {
      this.contracts.staking = getContract(CONTRACTS.STAKING, STAKING_ABI);
    }
    if (CONTRACTS.LENDING) {
      this.contracts.lending = getContract(CONTRACTS.LENDING, LENDING_ABI);
    }
    if (CONTRACTS.STABLECOIN) {
      this.contracts.stablecoin = getContract(CONTRACTS.STABLECOIN, STABLECOIN_ABI);
    }
    if (CONTRACTS.AI_ENGINE) {
      this.contracts.aiEngine = getContract(CONTRACTS.AI_ENGINE, AI_ENGINE_ABI);
    }
  }

  async getTotalSupply() {
    if (this.demoMode) return DEMO_DATA.totalSupply;
    try {
      return await this.contracts.neuronToken.totalSupply();
    } catch (error) {
      logger.error('Failed to get total supply:', error.message);
      return DEMO_DATA.totalSupply;
    }
  }

  async getBalance(address) {
    if (this.demoMode) return '0';
    try {
      return await this.contracts.neuronToken.balanceOf(address);
    } catch (error) {
      logger.error('Failed to get balance:', error.message);
      return null;
    }
  }

  async getTreasuryBalance(token) {
    if (this.demoMode) return DEMO_DATA.tvl;
    try {
      return await this.contracts.treasury.getBalance(token);
    } catch (error) {
      logger.error('Failed to get treasury balance:', error.message);
      return null;
    }
  }

  async getTotalValueLocked() {
    if (this.demoMode) return DEMO_DATA.tvl;
    try {
      return await this.contracts.treasury.getTotalValueLocked();
    } catch (error) {
      logger.error('Failed to get TVL:', error.message);
      return DEMO_DATA.tvl;
    }
  }

  async getTokenPrice() {
    if (this.demoMode) return DEMO_DATA.tokenPrice;
    try {
      return await this.contracts.treasury.getTokenPrice();
    } catch (error) {
      logger.error('Failed to get token price:', error.message);
      return DEMO_DATA.tokenPrice;
    }
  }

  async getGlobalTotalStaked() {
    if (this.demoMode) return DEMO_DATA.totalStaked;
    try {
      return await this.contracts.staking.globalTotalStaked();
    } catch (error) {
      logger.error('Failed to get global staked:', error.message);
      return DEMO_DATA.totalStaked;
    }
  }

  async getUserStaked(address) {
    if (this.demoMode) return '0';
    try {
      return await this.contracts.staking.getTotalStaked(address);
    } catch (error) {
      logger.error('Failed to get user staked:', error.message);
      return null;
    }
  }

  async getSystemHealth() {
    if (this.demoMode) return DEMO_DATA.healthScore;
    try {
      return await this.contracts.aiEngine.getSystemHealth();
    } catch (error) {
      logger.error('Failed to get system health:', error.message);
      return DEMO_DATA.healthScore;
    }
  }

  async checkPriceStability() {
    if (this.demoMode) return DEMO_DATA.priceStability;
    try {
      return await this.contracts.aiEngine.checkPriceStability();
    } catch (error) {
      logger.error('Failed to check price stability:', error.message);
      return DEMO_DATA.priceStability;
    }
  }

  async getCurrentPrice() {
    if (this.demoMode) return DEMO_DATA.tokenPrice;
    try {
      return await this.contracts.aiEngine.getCurrentPrice();
    } catch (error) {
      logger.error('Failed to get current price:', error.message);
      return DEMO_DATA.tokenPrice;
    }
  }

  async triggerSystemUpdate() {
    if (this.demoMode) return 'demo-tx-hash';
    try {
      const tx = await this.contracts.aiEngine.triggerSystemUpdate();
      await tx.wait();
      logger.info('System update triggered successfully');
      return tx.hash;
    } catch (error) {
      logger.error('Failed to trigger system update:', error.message);
      return null;
    }
  }

  async calculateEmission(totalSupply, stakedAmount) {
    if (this.demoMode) return '1000000000000000000000';
    try {
      return await this.contracts.aiEngine.calculateEmission(totalSupply, stakedAmount);
    } catch (error) {
      logger.error('Failed to calculate emission:', error.message);
      return null;
    }
  }

  async getLoan(loanId) {
    if (this.demoMode) return null;
    try {
      return await this.contracts.lending.getLoan(loanId);
    } catch (error) {
      logger.error('Failed to get loan:', error.message);
      return null;
    }
  }

  async getHealthFactor(loanId) {
    if (this.demoMode) return null;
    try {
      return await this.contracts.lending.getHealthFactor(loanId);
    } catch (error) {
      logger.error('Failed to get health factor:', error.message);
      return null;
    }
  }

  async getLoanCount() {
    if (this.demoMode) return 0;
    try {
      return await this.contracts.lending.loanCount();
    } catch (error) {
      logger.error('Failed to get loan count:', error.message);
      return null;
    }
  }

  async getStablecoinSupply() {
    if (this.demoMode) return DEMO_DATA.stablecoinSupply;
    try {
      return await this.contracts.stablecoin.totalSupply();
    } catch (error) {
      logger.error('Failed to get stablecoin supply:', error.message);
      return DEMO_DATA.stablecoinSupply;
    }
  }

  async getCollateralRatio() {
    if (this.demoMode) return DEMO_DATA.collateralRatio;
    try {
      return await this.contracts.stablecoin.getCollateralRatio();
    } catch (error) {
      logger.error('Failed to get collateral ratio:', error.message);
      return DEMO_DATA.collateralRatio;
    }
  }

  async getBlockNumber() {
    if (this.demoMode) return DEMO_DATA.blockNumber;
    return await provider.getBlockNumber();
  }

  async getGasPrice() {
    if (this.demoMode) return { gasPrice: '30000000000' };
    return await provider.getFeeData();
  }

  getWalletAddress() {
    if (this.demoMode) return '0x0000...DEMO';
    return wallet.address;
  }

  isDemoMode() {
    return this.demoMode;
  }
}

module.exports = new BlockchainService();
