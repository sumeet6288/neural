/**
 * Monitor Job
 * Continuously monitors the system and sends alerts for critical events
 */

const cron = require('node-cron');
const blockchainService = require('../services/BlockchainService');
const priceService = require('../services/PriceService');
const alertService = require('../utils/alerts');
const logger = require('../utils/logger');

class MonitorJob {
  constructor() {
    this.metrics = {
      lastBlock: 0,
      lastPrice: 0,
      lastHealthScore: 100
    };
  }

  async monitorTreasury() {
    try {
      const tvl = await blockchainService.getTotalValueLocked();
      
      if (!tvl) return;

      const tvlEth = Number(tvl) / 1e18;
      logger.info(`Treasury TVL: ${tvlEth} ETH`);

      // Alert if TVL drops significantly
      if (tvlEth < 10000) {
        await alertService.lowTreasuryBalance(tvlEth, 10000);
      }
    } catch (error) {
      logger.error('Treasury monitoring failed:', error.message);
    }
  }

  async monitorPrice() {
    try {
      const currentPrice = await blockchainService.getCurrentPrice();
      
      if (!currentPrice) return;

      const priceUsd = Number(currentPrice) / 1e18;
      logger.info(`Token price: $${priceUsd.toFixed(4)}`);

      // Check for significant price movement
      if (this.metrics.lastPrice > 0) {
        const change = Math.abs(priceUsd - this.metrics.lastPrice) / this.metrics.lastPrice;
        
        if (change > 0.1) { // 10% change
          await alertService.priceDeviation(
            currentPrice,
            this.metrics.lastPrice * 1e18,
            change * 100
          );
        }
      }

      this.metrics.lastPrice = priceUsd;
    } catch (error) {
      logger.error('Price monitoring failed:', error.message);
    }
  }

  async monitorSystemHealth() {
    try {
      const healthScore = await blockchainService.getSystemHealth();
      
      if (!healthScore) return;

      logger.info(`System health score: ${healthScore}/100`);

      // Alert on health degradation
      if (healthScore < 50 && this.metrics.lastHealthScore >= 50) {
        await alertService.systemHealthLow(healthScore);
      }

      this.metrics.lastHealthScore = Number(healthScore);
    } catch (error) {
      logger.error('Health monitoring failed:', error.message);
    }
  }

  async monitorBlockchain() {
    try {
      const blockNumber = await blockchainService.getBlockNumber();
      
      if (blockNumber > this.metrics.lastBlock) {
        logger.info(`New block: ${blockNumber}`);
        this.metrics.lastBlock = blockNumber;
      }
    } catch (error) {
      logger.error('Blockchain monitoring failed:', error.message);
    }
  }

  async run() {
    logger.info('========== Running Monitor Cycle ==========');

    await Promise.all([
      this.monitorTreasury(),
      this.monitorPrice(),
      this.monitorSystemHealth(),
      this.monitorBlockchain()
    ]);

    logger.info('========== Monitor Cycle Complete ==========');
  }

  schedule() {
    // Run every 5 minutes
    const interval = process.env.PRICE_CHECK_INTERVAL || '*/5 * * * *';
    
    logger.info(`Scheduling Monitor with interval: ${interval}`);
    
    cron.schedule(interval, () => {
      this.run();
    });

    // Run immediately
    this.run();
  }
}

// Export for use as module
const monitorJob = new MonitorJob();

// Run if called directly
if (require.main === module) {
  monitorJob.run().then(() => {
    process.exit(0);
  }).catch((error) => {
    logger.error('Monitor job failed:', error);
    process.exit(1);
  });
}

module.exports = monitorJob;
