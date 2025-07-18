import "dotenv/config";

// Essential types only
export interface ProcessingResult {
  success: boolean;
  error?: string;
  externalOrderId?: string;
  transactionHash?: string;
}

export interface StreamMessage {
  id: string;
  message: Record<string, string>;
}

// Configuration constants
export const CONFIG = {
  CONSUMER_GROUP: "order-workers",
  STREAM_KEY: "orders:stream",
  FAILED_ORDERS_KEY: "orders:failed",
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  CIRCUIT_BREAKER_THRESHOLD: 5,
  CIRCUIT_BREAKER_RESET_TIME: 60000,
  METRICS_LOG_INTERVAL: 60000,
  SHUTDOWN_TIMEOUT: 2000,
} as const;

export const generateConsumerName = (): string => {
  return `worker-${process.pid}-${Date.now()}`;
};
