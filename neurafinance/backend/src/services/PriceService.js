const axios = require('axios');
const logger = require('../utils/logger');

class PriceService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.apiUrl = process.env.PRICE_API_URL || 'https://api.coingecko.com/api/v3';
  }

  async getTokenPrice(tokenId = 'neurafinance') {
    const cacheKey = `price_${tokenId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.price;
    }

    try {
      // In production, this would fetch from DEX or Chainlink
      // For now, return simulated price or fetch from API
      const price = await this.fetchFromAPI(tokenId);
      
      this.cache.set(cacheKey, {
        price,
        timestamp: Date.now()
      });
      
      return price;
    } catch (error) {
      logger.error('Failed to fetch token price:', error.message);
      return cached ? cached.price : 1.0; // Default to $1.00
    }
  }

  async fetchFromAPI(tokenId) {
    try {
      // Try to fetch from CoinGecko or similar
      const response = await axios.get(`${this.apiUrl}/simple/price`, {
        params: {
          ids: tokenId,
          vs_currencies: 'usd'
        },
        timeout: 10000
      });
      
      return response.data[tokenId]?.usd || 1.0;
    } catch (error) {
      // Fallback to simulated price based on contract
      logger.warn('Price API unavailable, using fallback');
      return 1.0;
    }
  }

  async getMarketData() {
    try {
      return {
        price: await this.getTokenPrice(),
        marketCap: 0, // Would calculate from supply
        volume24h: 0,
        priceChange24h: 0,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Failed to get market data:', error.message);
      return null;
    }
  }

  clearCache() {
    this.cache.clear();
    logger.info('Price cache cleared');
  }
}

module.exports = new PriceService();
