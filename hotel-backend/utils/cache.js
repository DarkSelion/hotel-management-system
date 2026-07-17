const db = require('../config/db');

// In-memory store
const cacheStore = {
  last_updated: 0
};

// Cache TTL (e.g., 5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;

async function refreshCache() {
  const [rows] = await db.query('SELECT config_key, config_value FROM system_configurations');
  rows.forEach(row => {
    cacheStore[row.config_key] = row.config_value;
  });
  cacheStore.last_updated = Date.now();
}

async function getConfig(key) {
  if (Date.now() - cacheStore.last_updated > CACHE_TTL_MS) {
    await refreshCache();
  }
  return cacheStore[key];
}

module.exports = {
  getConfig,
  refreshCache
};
