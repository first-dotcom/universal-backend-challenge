import { createClient } from "redis";
import { getIp } from "../utils/ip";
import { logger } from "./logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// High RPS Redis Configuration
const redisConfig = {
  url: REDIS_URL,

  // Connection pool settings
  socket: {
    connectTimeout: 5000, // 5s connection timeout
    commandTimeout: 3000, // 3s command timeout
    lazyConnect: true, // Connect only when needed
    reconnectStrategy: (retries: number) => Math.min(retries * 50, 1000), // Exponential backoff
  },

  // Performance settings
  commandsQueueMaxLength: 1000, // Max queued commands
  maxRetriesPerRequest: 3, // Retry failed commands
  retryDelayOnFailover: 100, // Delay between retries
  enableOfflineQueue: false, // Don't queue commands when offline

  // Keep-alive settings
  pingInterval: 30000, // Ping every 30s to keep connection alive
};

// Create publish client
export const pubClient: ReturnType<typeof createClient> = createClient(redisConfig);

// Create subscribe client
export const subClient: ReturnType<typeof createClient> = createClient(redisConfig);

// Setup event handlers for publish client
const setupPubClientHandlers = () => {
  pubClient.on("error", (err) => {
    logger.error("Redis Pub Client Error:", { err, ip: getIp() });
  });

  pubClient.on("connect", () => {
    logger.info("Redis Pub Client connected", { ip: getIp() });
  });

  pubClient.on("reconnecting", () => {
    logger.info("Redis Pub Client reconnecting", { ip: getIp() });
  });

  pubClient.on("disconnect", () => {
    logger.info("Redis Pub Client disconnected", { ip: getIp() });
  });
};

// Setup event handlers for subscribe client
const setupSubClientHandlers = () => {
  subClient.on("error", (err) => {
    logger.error("Redis Sub Client Error:", { err, ip: getIp() });
  });

  subClient.on("connect", () => {
    logger.info("Redis Sub Client connected", { ip: getIp() });
  });

  subClient.on("reconnecting", () => {
    logger.info("Redis Sub Client reconnecting", { ip: getIp() });
  });

  subClient.on("disconnect", () => {
    logger.info("Redis Sub Client disconnected", { ip: getIp() });
  });
};

// Initialize event handlers
setupPubClientHandlers();
setupSubClientHandlers();

// Initialize Redis clients
export const initializeRedisClients = async (): Promise<void> => {
  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    logger.info("Redis clients initialized successfully", { ip: getIp() });
  } catch (error) {
    logger.error("Failed to connect Redis clients:", { error, ip: getIp() });
    throw error;
  }
};
