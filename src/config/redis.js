const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    db: config.redis.db,
    retryStrategy: (times) => {
      if (times > 5) {
        logger.error('Redis: max retries reached, giving up');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    enableOfflineQueue: false,
    lazyConnect: true,
  });

  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('error', (err) => logger.error({ err: err.message }, 'Redis error'));
  redisClient.on('close', () => logger.warn('Redis connection closed'));

  return redisClient;
}

async function connectRedis() {
  try {
    const client = getRedisClient();
    await client.connect();
  } catch (err) {
    logger.warn({ err: err.message }, 'Redis unavailable — caching disabled');
  }
}

async function cacheGet(key) {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds) {
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // fail silently — cache is non-critical
  }
}

async function cacheDel(key) {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch {
    // fail silently
  }
}

async function cacheDelPattern(pattern) {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(...keys);
  } catch {
    // fail silently
  }
}

module.exports = { getRedisClient, connectRedis, cacheGet, cacheSet, cacheDel, cacheDelPattern };
