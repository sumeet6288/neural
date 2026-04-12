/**
 * NeuraFinance Backend Server
 * Main entry point for the AI-driven DeFi platform backend
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const logger = require('./utils/logger');
const aiCycleJob = require('./jobs/ai-cycle');
const monitorJob = require('./jobs/monitor');
const blockchainService = require('./services/BlockchainService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const blockNumber = await blockchainService.getBlockNumber();
    const healthScore = await blockchainService.getSystemHealth();
    
    res.json({
      status: 'healthy',
      blockNumber,
      healthScore: healthScore?.toString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System metrics endpoint
app.get('/api/metrics', async (req, res) => {
  try {
    const [
      totalSupply,
      totalStaked,
      tvl,
      tokenPrice,
      healthScore,
      stablecoinSupply
    ] = await Promise.all([
      blockchainService.getTotalSupply(),
      blockchainService.getGlobalTotalStaked(),
      blockchainService.getTotalValueLocked(),
      blockchainService.getCurrentPrice(),
      blockchainService.getSystemHealth(),
      blockchainService.getStablecoinSupply()
    ]);

    res.json({
      totalSupply: totalSupply?.toString(),
      totalStaked: totalStaked?.toString(),
      tvl: tvl?.toString(),
      tokenPrice: tokenPrice?.toString(),
      healthScore: healthScore?.toString(),
      stablecoinSupply: stablecoinSupply?.toString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Price endpoint
app.get('/api/price', async (req, res) => {
  try {
    const price = await blockchainService.getCurrentPrice();
    const stability = await blockchainService.checkPriceStability();
    
    res.json({
      price: price?.toString(),
      isStable: stability.isStable,
      deviation: stability.deviation.toString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get price:', error);
    res.status(500).json({ error: error.message });
  }
});

// Treasury endpoint
app.get('/api/treasury', async (req, res) => {
  try {
    const tvl = await blockchainService.getTotalValueLocked();
    
    res.json({
      tvl: tvl?.toString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get treasury:', error);
    res.status(500).json({ error: error.message });
  }
});

// Staking endpoint
app.get('/api/staking', async (req, res) => {
  try {
    const totalStaked = await blockchainService.getGlobalTotalStaked();
    const totalSupply = await blockchainService.getTotalSupply();
    
    let stakingRatio = 0;
    if (totalSupply && totalSupply > 0) {
      stakingRatio = Number(totalStaked) / Number(totalSupply) * 100;
    }
    
    res.json({
      totalStaked: totalStaked?.toString(),
      totalSupply: totalSupply?.toString(),
      stakingRatio: stakingRatio.toFixed(2),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get staking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger AI cycle manually
app.post('/api/admin/ai-cycle', async (req, res) => {
  try {
    // In production, add authentication here
    await aiCycleJob.run();
    res.json({ success: true, message: 'AI cycle triggered' });
  } catch (error) {
    logger.error('Manual AI cycle failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`=================================`);
  logger.info(`NeuraFinance Backend Server`);
  logger.info(`=================================`);
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Wallet: ${blockchainService.getWalletAddress()}`);
  logger.info(`=================================`);
  
  // Schedule background jobs
  logger.info('Starting background jobs...');
  aiCycleJob.schedule();
  monitorJob.schedule();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
