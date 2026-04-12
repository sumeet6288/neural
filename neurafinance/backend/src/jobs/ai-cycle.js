/**
 * AI Cycle Job
 * Runs every 12 hours to trigger the AI engine system update
 * This simulates the AI behavior by calling smart contract functions
 */

const cron = require('node-cron');
const blockchainService = require('../services/BlockchainService');
const priceService = require('../services/PriceService');
const alertService = require('../utils/alerts');
const logger = require('../utils/logger');

class AICycleJob {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
  }

  async run() {
    if (this.isRunning) {
      logger.warn('AI Cycle already running, skipping...');
      return;
    }

    this.isRunning = true;
    logger.info('========== Starting AI Cycle ==========');

    try {
      // Step 1: Gather system metrics
      const metrics = await this.gatherMetrics();
      logger.info('System metrics gathered:', metrics);

      // Step 2: Check system health
      const healthScore = await blockchainService.getSystemHealth();
      logger.info(`Current system health: ${healthScore}/100`);

      if (healthScore < 30) {
        await alertService.systemHealthLow(healthScore);
      }

      // Step 3: Check price stability
      const priceStability = await blockchainService.checkPriceStability();
      logger.info(`Price stability: ${priceStability.isStable ? 'STABLE' : 'UNSTABLE'}, deviation: ${priceStability.deviation}%`);

      if (!priceStability.isStable) {
        await alertService.priceDeviation(
          await blockchainService.getCurrentPrice(),
          1e18,
          priceStability.deviation
        );
      }

      // Step 4: Calculate emission
      const totalSupply = await blockchainService.getTotalSupply();
      const totalStaked = await blockchainService.getGlobalTotalStaked();
      
      if (totalSupply && totalStaked) {
        const emission = await blockchainService.calculateEmission(totalSupply, totalStaked);
        logger.info(`Calculated emission: ${emission.toString()}`);
      }

      // Step 5: Trigger system update on blockchain
      const txHash = await blockchainService.triggerSystemUpdate();
      
      if (txHash) {
        logger.info(`System update triggered: ${txHash}`);
        await alertService.aiCycleCompleted(
          emission || 0,
          healthScore || 0
        );
      }

      // Step 6: Check for liquidations
      await this.checkLiquidations();

      this.lastRun = new Date();
      logger.info('========== AI Cycle Completed ==========');

    } catch (error) {
      logger.error('AI Cycle failed:', error);
      await alertService.critical('AI Cycle Failed', { error: error.message });
    } finally {
      this.isRunning = false;
    }
  }

  async gatherMetrics() {
    const [
      blockNumber,
      totalSupply,
      totalStaked,
      tvl,
      tokenPrice,
      stablecoinSupply,
      collateralRatio
    ] = await Promise.all([
      blockchainService.getBlockNumber(),
      blockchainService.getTotalSupply(),
      blockchainService.getGlobalTotalStaked(),
      blockchainService.getTotalValueLocked(),
      blockchainService.getCurrentPrice(),
      blockchainService.getStablecoinSupply(),
      blockchainService.getCollateralRatio()
    ]);

    return {
      blockNumber,
      totalSupply: totalSupply?.toString(),
      totalStaked: totalStaked?.toString(),
      tvl: tvl?.toString(),
      tokenPrice: tokenPrice?.toString(),
      stablecoinSupply: stablecoinSupply?.toString(),
      collateralRatio: collateralRatio?.toString(),
      timestamp: new Date().toISOString()
    };
  }

  async checkLiquidations() {
    try {
      const loanCount = await blockchainService.getLoanCount();
      if (!loanCount || loanCount === 0) return;

      logger.info(`Checking ${loanCount} loans for liquidation...`);

      // Check last 50 loans (in production, would check all)
      const checkCount = Math.min(50, Number(loanCount));
      const startIdx = Math.max(0, Number(loanCount) - checkCount);

      for (let i = startIdx; i < Number(loanCount); i++) {
        try {
          const healthFactor = await blockchainService.getHealthFactor(i);
          
          if (healthFactor && healthFactor < 1e18) {
            logger.warn(`Loan ${i} is unhealthy (health factor: ${healthFactor})`);
            await alertService.unhealthyLoan(i, healthFactor);
            // Note: Actual liquidation would require additional logic
          }
        } catch (error) {
          // Loan might not exist or be inactive
          continue;
        }
      }
    } catch (error) {
      logger.error('Failed to check liquidations:', error.message);
    }
  }

  schedule() {
    // Run every 12 hours
    const interval = process.env.AI_CYCLE_INTERVAL || '0 */12 * * *';
    
    logger.info(`Scheduling AI Cycle with interval: ${interval}`);
    
    cron.schedule(interval, () => {
      this.run();
    });

    // Also run immediately on startup
    this.run();
  }
}

// Export for use as module
const aiCycleJob = new AICycleJob();

// Run if called directly
if (require.main === module) {
  aiCycleJob.run().then(() => {
    process.exit(0);
  }).catch((error) => {
    logger.error('AI Cycle job failed:', error);
    process.exit(1);
  });
}

module.exports = aiCycleJob;
