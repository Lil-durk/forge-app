/**
 * AI Response Cache Service
 * Implements caching strategies for repetitive AI API calls to reduce costs and improve performance
 */

const { logger } = require('../../utils/logger');

class AICache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100; // Maximum number of cached responses
    this.ttl = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Cleanup expired entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  /**
   * Generate a cache key based on the request parameters
   */
  generateKey(type, data, context = {}) {
    const keyData = {
      type,
      dataHash: this.hashData(data),
      context: this.normalizeContext(context)
    };
    return JSON.stringify(keyData);
  }

  /**
   * Hash data to create consistent keys for similar datasets
   */
  hashData(data) {
    if (!data || !Array.isArray(data)) return '';
    
    // Create a simplified hash based on column names and first few rows
    const sample = data.slice(0, 3);
    const structure = sample.map(row => 
      Object.keys(row).sort().join(',') + '|' + Object.values(row).join(',')
    ).join(';');
    
    return this.simpleHash(structure);
  }

  /**
   * Simple hash function for cache keys
   */
  simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Normalize context to ensure consistent cache keys
   */
  normalizeContext(context) {
    const normalized = {};
    Object.keys(context).sort().forEach(key => {
      if (typeof context[key] === 'string') {
        normalized[key] = context[key].toLowerCase().trim();
      } else {
        normalized[key] = context[key];
      }
    });
    return normalized;
  }

  /**
   * Get cached response if available and not expired
   */
  get(type, data, context = {}) {
    const key = this.generateKey(type, data, context);
    const cached = this.cache.get(key);
    
    if (!cached) {
      logger.debug(`Cache miss for ${type}`, { key: key.substring(0, 50) });
      return null;
    }
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache expired for ${type}`, { key: key.substring(0, 50) });
      return null;
    }
    
    logger.info(`Cache hit for ${type}`, { 
      key: key.substring(0, 50),
      age: Date.now() - cached.timestamp 
    });
    return cached.response;
  }

  /**
   * Store response in cache
   */
  set(type, data, context = {}, response) {
    const key = this.generateKey(type, data, context);
    
    // If cache is full, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      type,
      accessCount: 0
    });
    
    logger.debug(`Cached response for ${type}`, { 
      key: key.substring(0, 50),
      cacheSize: this.cache.size 
    });
  }

  /**
   * Remove oldest entries when cache is full
   */
  evictOldest() {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 20% of entries
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
    
    logger.debug(`Evicted ${toRemove} old cache entries`);
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const expired = [];
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        expired.push(key);
      }
    }
    
    expired.forEach(key => this.cache.delete(key));
    
    if (expired.length > 0) {
      logger.debug(`Cleaned up ${expired.length} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0,
      entries: []
    };
    
    for (const [key, value] of this.cache.entries()) {
      stats.entries.push({
        key: key.substring(0, 50),
        type: value.type,
        age: Date.now() - value.timestamp,
        accessCount: value.accessCount
      });
    }
    
    return stats;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cleared cache with ${size} entries`);
  }
}

// Export singleton instance
const aiCache = new AICache();
module.exports = aiCache;
