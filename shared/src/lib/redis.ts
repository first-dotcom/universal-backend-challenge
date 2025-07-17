import { createClient } from 'redis';
import { logger } from './logger';
import { getIp } from '../utils/ip';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create publish client
export const pubClient: ReturnType<typeof createClient> = createClient({ url: REDIS_URL });

// Create subscribe client  
export const subClient: ReturnType<typeof createClient> = createClient({ url: REDIS_URL });

// Setup event handlers for publish client
const setupPubClientHandlers = () => {
  pubClient.on('error', (err) => {
    logger.error('Redis Pub Client Error:', { err, ip: getIp() });
  });

  pubClient.on('connect', () => {
    logger.info('Redis Pub Client connected', { ip: getIp() });
  });

  pubClient.on('reconnecting', () => {
    logger.info('Redis Pub Client reconnecting', { ip: getIp() });
  });

  pubClient.on('disconnect', () => {
    logger.info('Redis Pub Client disconnected', { ip: getIp() });
  });
};

// Setup event handlers for subscribe client
const setupSubClientHandlers = () => {
  subClient.on('error', (err) => {
    logger.error('Redis Sub Client Error:', { err, ip: getIp() });
  });

  subClient.on('connect', () => {
    logger.info('Redis Sub Client connected', { ip: getIp() });
  });

  subClient.on('reconnecting', () => {
    logger.info('Redis Sub Client reconnecting', { ip: getIp() });
  });

  subClient.on('disconnect', () => {
    logger.info('Redis Sub Client disconnected', { ip: getIp() });
  });
};

// Initialize event handlers
setupPubClientHandlers();
setupSubClientHandlers();

// Initialize Redis clients
export const initializeRedisClients = async (): Promise<void> => {
  try {
    await Promise.all([
      pubClient.connect(),
      subClient.connect()
    ]);
    logger.info('Redis clients initialized successfully', { ip: getIp() });
  } catch (error) {
    logger.error('Failed to connect Redis clients:', { error, ip: getIp() });
    throw error;
  }
};