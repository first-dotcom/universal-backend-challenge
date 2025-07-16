import { createClient } from 'redis';
import { logger } from './logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create publish client
export const pubClient = createClient({ url: REDIS_URL });

// Create subscribe client
export const subClient = createClient({ url: REDIS_URL });

// Handle connection errors
pubClient.on('error', (err) => {
  logger.error('Redis Pub Client Error:', err);
});

subClient.on('error', (err) => {
  logger.error('Redis Sub Client Error:', err);
});

// Handle successful connections
pubClient.on('connect', () => {
  logger.info('Redis Pub Client connected');
});

subClient.on('connect', () => {
  logger.info('Redis Sub Client connected');
});

// Auto-connect both clients
(async () => {
  try {
    await pubClient.connect();
    await subClient.connect();
    logger.info('Redis clients initialized successfully');
  } catch (error) {
    logger.error('Failed to connect Redis clients:', error);
  }
})(); 