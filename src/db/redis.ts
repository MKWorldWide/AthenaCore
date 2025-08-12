import { Redis } from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

// Create Redis client
const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null, // Allow unlimited retries
  enableReadyCheck: false, // Disable ready check for better performance
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  },
  retryStrategy: (times) => {
    if (times > 10) {
      logger.warn('Too many retries on Redis. Connection Terminated');
      return null; // End reconnecting with built in error
    }
    // Reconnect after
    return Math.min(times * 100, 5000);
  },
});

// Log Redis connection events
redis.on('connect', () => {
  logger.info('Redis client connected');});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('error', (err) => {
  logger.error(err, 'Redis error');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Reconnecting to Redis...');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  redis.quit();
});

export { redis };
export default redis;
