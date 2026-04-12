const axios = require('axios');
const logger = require('./logger');

class AlertService {
  constructor() {
    this.webhookUrl = process.env.ALERT_WEBHOOK_URL;
    this.email = process.env.ALERT_EMAIL;
  }

  async sendAlert(type, message, data = {}) {
    const alert = {
      type,
      message,
      timestamp: new Date().toISOString(),
      data
    };

    logger.warn(`ALERT [${type}]: ${message}`, data);

    // Send to webhook if configured
    if (this.webhookUrl) {
      try {
        await axios.post(this.webhookUrl, alert);
      } catch (error) {
        logger.error('Failed to send webhook alert:', error.message);
      }
    }

    return alert;
  }

  async critical(message, data) {
    return this.sendAlert('CRITICAL', message, data);
  }

  async warning(message, data) {
    return this.sendAlert('WARNING', message, data);
  }

  async info(message, data) {
    return this.sendAlert('INFO', message, data);
  }

  // Specific alert types
  async lowTreasuryBalance(balance, threshold) {
    return this.warning('Low Treasury Balance', {
      currentBalance: balance.toString(),
      threshold: threshold.toString()
    });
  }

  async priceDeviation(currentPrice, targetPrice, deviation) {
    return this.warning('Price Deviation Detected', {
      currentPrice: currentPrice.toString(),
      targetPrice: targetPrice.toString(),
      deviationPercent: deviation.toString()
    });
  }

  async unhealthyLoan(loanId, healthFactor) {
    return this.critical('Unhealthy Loan Detected', {
      loanId: loanId.toString(),
      healthFactor: healthFactor.toString()
    });
  }

  async systemHealthLow(healthScore) {
    return this.critical('System Health Low', {
      healthScore: healthScore.toString()
    });
  }

  async aiCycleCompleted(emissionAmount, healthScore) {
    return this.info('AI Cycle Completed', {
      emissionAmount: emissionAmount.toString(),
      healthScore: healthScore.toString()
    });
  }
}

module.exports = new AlertService();
