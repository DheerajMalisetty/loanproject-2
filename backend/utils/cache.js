// Simple in-memory cache utility
class Cache {
  constructor(ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value, customTtl = null) {
    const expiry = Date.now() + (customTtl || this.ttl);
    this.cache.set(key, {
      value,
      expiry
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Get or set pattern
  async getOrSet(key, fetchFn, customTtl = null) {
    let value = this.get(key);
    if (value !== null) {
      return value;
    }
    
    value = await fetchFn();
    this.set(key, value, customTtl);
    return value;
  }

  // Get cache stats
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        expired++;
      } else {
        valid++;
      }
    }
    
    return {
      total: this.cache.size,
      valid,
      expired,
      ttl: this.ttl
    };
  }
}

// Create cache instances for different data types
const dashboardCache = new Cache(300000); // 5 minutes
const loanStatsCache = new Cache(600000); // 10 minutes
const userCache = new Cache(900000); // 15 minutes

module.exports = {
  Cache,
  dashboardCache,
  loanStatsCache,
  userCache
};
