const { provider, wallet, CONTRACTS, getContract } = require('../config/blockchain');
const {
  NEURON_TOKEN_ABI,
  TREASURY_ABI,
  STAKING_ABI,
  LENDING_ABI,
  STABLECOIN_ABI,
  AI_ENGINE_ABI
} = require('../config/contracts');
const logger = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.contracts = {};
    this.initializeContracts();
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

  // Token operations
  async getTotalSupply() {
    try {
      return await this.contracts.neuronToken.totalSupply();
    } catch (error) {
      logger.error('Failed to get total supply:', error.message);
      return null;
    }
  }

  async getBalance(address) {
    try {
      return await this.contracts.neuronToken.balanceOf(address);
    } catch (error) {
      logger.error('Failed to get balance:', error.message);
      return null;
    }
  }

  // Treasury operations
  async getTreasuryBalance(token) {
    try {
      return await this.contracts.treasury.getBalance(token);
    } catch (error) {
      logger.error('Failed to get treasury balance:', error.message);
      return null;
    }
  }

  async getTotalValueLocked() {
    try {
      return await this.contracts.treasury.getTotalValueLocked();
    } catch (error) {
      logger.error('Failed to get TVL:', error.message);
      return null;
    }
  }

  async getTokenPrice() {
    try {
      return await this.contracts.treasury.getTokenPrice();
    } catch (error) {
      logger.error('Failed to get token price:', error.message);
      return null;
    }
  }

  // Staking operations
  async getGlobalTotalStaked() {
    try {
      return await this.contracts.staking.globalTotalStaked();
    } catch (error) {
      logger.error('Failed to get global staked:', error.message);
      return null;
    }
  }

  async getUserStaked(address) {
    try {
      return await this.contracts.staking.getTotalStaked(address);
    } catch (error) {
      logger.error('Failed to get user staked:', error.message);
      return null;
    }
  }

  // AI Engine operations
  async getSystemHealth() {
    try {
      return await this.contracts.aiEngine.getSystemHealth();
    } catch (error) {
      logger.error('Failed to get system health:', error.message);
      return null;
    }
  }

  async checkPriceStability() {
    try {
      return await this.contracts.aiEngine.checkPriceStability();
    } catch (error) {
      logger.error('Failed to check price stability:', error.message);
      return { isStable: true, deviation: 0 };
    }
  }

  async getCurrentPrice() {
    try {
      return await this.contracts.aiEngine.getCurrentPrice();
    } catch (error) {
      logger.error('Failed to get current price:', error.message);
      return null;
    }
  }

  async triggerSystemUpdate() {
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
    try {
      return await this.contracts.aiEngine.calculateEmission(totalSupply, stakedAmount);
    } catch (error) {
      logger.error('Failed to calculate emission:', error.message);
      return null;
    }
  }

  // Lending operations
  async getLoan(loanId) {
    try {
      return await this.contracts.lending.getLoan(loanId);
    } catch (error) {
      logger.error('Failed to get loan:', error.message);
      return null;
    }
  }

  async getHealthFactor(loanId) {
    try {
      return await this.contracts.lending.getHealthFactor(loanId);
    } catch (error) {
      logger.error('Failed to get health factor:', error.message);
      return null;
    }
  }

  async getLoanCount() {
    try {
      return await this.contracts.lending.loanCount();
    } catch (error) {
      logger.error('Failed to get loan count:', error.message);
      return null;
    }
  }

  // Stablecoin operations
  async getStablecoinSupply() {
    try {
      return await this.contracts.stablecoin.totalSupply();
    } catch (error) {
      logger.error('Failed to get stablecoin supply:', error.message);
      return null;
    }
  }

  async getCollateralRatio() {
    try {
      return await this.contracts.stablecoin.getCollateralRatio();
    } catch (error) {
      logger.error('Failed to get collateral ratio:', error.message);
      return null;
    }
  }

  // Utility functions
  async getBlockNumber() {
    return await provider.getBlockNumber();
  }

  async getGasPrice() {
    return await provider.getFeeData();
  }

  getWalletAddress() {
    return wallet.address;
  }
}

module.exports = new BlockchainService();
