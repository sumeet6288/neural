/**
 * NeuraFinance Backend Server
 * Main entry point for the AI-driven DeFi platform backend
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const logger = require('./utils/logger');
const blockchainService = require('./services/BlockchainService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Response cache for demo mode (instant responses)
const responseCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function getCached(key) {
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  responseCache.set(key, { data, time: Date.now() });
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const blockNumber = await blockchainService.getBlockNumber();
    const healthScore = await blockchainService.getSystemHealth();

    res.json({
      status: 'healthy',
      mode: blockchainService.demoMode ? 'demo' : 'live',
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
  const cached = getCached('metrics');
  if (cached) return res.json(cached);

  try {
    const [totalSupply, totalStaked, tvl, tokenPrice, healthScore, stablecoinSupply] = await Promise.all([
      blockchainService.getTotalSupply(),
      blockchainService.getGlobalTotalStaked(),
      blockchainService.getTotalValueLocked(),
      blockchainService.getCurrentPrice(),
      blockchainService.getSystemHealth(),
      blockchainService.getStablecoinSupply()
    ]);

    const data = {
      totalSupply: totalSupply?.toString(),
      totalStaked: totalStaked?.toString(),
      tvl: tvl?.toString(),
      tokenPrice: tokenPrice?.toString(),
      healthScore: healthScore?.toString(),
      stablecoinSupply: stablecoinSupply?.toString(),
      mode: blockchainService.demoMode ? 'demo' : 'live',
      timestamp: new Date().toISOString()
    };

    setCache('metrics', data);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Price endpoint
app.get('/api/price', async (req, res) => {
  const cached = getCached('price');
  if (cached) return res.json(cached);

  try {
    const price = await blockchainService.getCurrentPrice();
    const stability = await blockchainService.checkPriceStability();

    const data = {
      price: price?.toString(),
      isStable: stability.isStable,
      deviation: stability.deviation.toString(),
      timestamp: new Date().toISOString()
    };

    setCache('price', data);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get price:', error);
    res.status(500).json({ error: error.message });
  }
});

// Treasury endpoint
app.get('/api/treasury', async (req, res) => {
  const cached = getCached('treasury');
  if (cached) return res.json(cached);

  try {
    const tvl = await blockchainService.getTotalValueLocked();

    const data = {
      tvl: tvl?.toString(),
      timestamp: new Date().toISOString()
    };

    setCache('treasury', data);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get treasury:', error);
    res.status(500).json({ error: error.message });
  }
});

// Staking endpoint
app.get('/api/staking', async (req, res) => {
  const cached = getCached('staking');
  if (cached) return res.json(cached);

  try {
    const totalStaked = await blockchainService.getGlobalTotalStaked();
    const totalSupply = await blockchainService.getTotalSupply();

    let stakingRatio = 0;
    if (totalSupply && Number(totalSupply) > 0) {
      stakingRatio = Number(totalStaked) / Number(totalSupply) * 100;
    }

    const data = {
      totalStaked: totalStaked?.toString(),
      totalSupply: totalSupply?.toString(),
      stakingRatio: stakingRatio.toFixed(2),
      timestamp: new Date().toISOString()
    };

    setCache('staking', data);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get staking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard aggregate endpoint (single call for all dashboard data)
app.get('/api/dashboard', async (req, res) => {
  const cached = getCached('dashboard');
  if (cached) return res.json(cached);

  try {
    const [totalSupply, totalStaked, tvl, tokenPrice, healthScore, stablecoinSupply, stability] = await Promise.all([
      blockchainService.getTotalSupply(),
      blockchainService.getGlobalTotalStaked(),
      blockchainService.getTotalValueLocked(),
      blockchainService.getCurrentPrice(),
      blockchainService.getSystemHealth(),
      blockchainService.getStablecoinSupply(),
      blockchainService.checkPriceStability()
    ]);

    const totalSupplyNum = Number(totalSupply) / 1e18;
    const totalStakedNum = Number(totalStaked) / 1e18;
    const tvlNum = Number(tvl) / 1e18;
    const priceNum = Number(tokenPrice) / 1e18;
    const marketCap = totalSupplyNum * priceNum;
    const stakingRatio = totalSupplyNum > 0 ? (totalStakedNum / totalSupplyNum * 100) : 0;
    const circulatingSupply = totalSupplyNum - totalStakedNum;

    const data = {
      totalSupply: totalSupplyNum.toFixed(2),
      maxSupply: '21000000.00',
      totalStaked: totalStakedNum.toFixed(2),
      tvl: tvlNum.toFixed(2),
      tokenPrice: priceNum.toFixed(2),
      marketCap: marketCap.toFixed(2),
      healthScore: healthScore?.toString() || '98',
      stakingRatio: stakingRatio.toFixed(2),
      circulatingSupply: circulatingSupply.toFixed(2),
      stablecoinSupply: (Number(stablecoinSupply) / 1e18).toFixed(2),
      priceStable: stability.isStable,
      priceDeviation: (Number(stability.deviation) / 100).toFixed(2),
      mode: blockchainService.demoMode ? 'demo' : 'live',
      timestamp: new Date().toISOString()
    };

    setCache('dashboard', data);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger AI cycle manually
app.post('/api/admin/ai-cycle', async (req, res) => {
  if (blockchainService.demoMode) {
    return res.json({ success: true, message: 'AI cycle simulated (demo mode)', mode: 'demo' });
  }
  try {
    const aiCycleJob = require('./jobs/ai-cycle');
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
  logger.info(`Mode: ${blockchainService.demoMode ? 'DEMO' : 'LIVE'}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Wallet: ${blockchainService.getWalletAddress()}`);
  logger.info(`=================================`);

  // Only schedule blockchain jobs if not in demo mode
  if (!blockchainService.demoMode) {
    logger.info('Starting background jobs...');
    const aiCycleJob = require('./jobs/ai-cycle');
    const monitorJob = require('./jobs/monitor');
    aiCycleJob.schedule();
    monitorJob.schedule();
  } else {
    logger.info('Demo mode - background jobs disabled');
  }
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
