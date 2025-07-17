import "dotenv/config";
import { UniversalRelayerSDK } from 'universal-sdk';
import logger from 'shared/lib/logger';
import { Order } from 'shared/types';
import { subClient, initializeRedisClients } from 'shared/lib/redis';
import { StreamMessage, CONFIG, generateConsumerName } from './constants';
import { OrderProcessor } from './order-processor';
import { delay } from 'shared/lib/time';

class OrderWorker {
  private isRunning = false;
  private consumerName: string;
  private processor: OrderProcessor;

  constructor() {
    const apiKey = process.env.UNIVERSAL_API_KEY;
    if (!apiKey) {
      throw new Error('UNIVERSAL_API_KEY environment variable is required');
    }
    
    const sdk = new UniversalRelayerSDK(apiKey);
    this.consumerName = generateConsumerName();
    this.processor = new OrderProcessor(sdk);
  }

  async start() {
    try {
      await initializeRedisClients();
      
      // Create consumer group
      try {
        await subClient.xGroupCreate(CONFIG.STREAM_KEY, CONFIG.CONSUMER_GROUP, '$', {
          MKSTREAM: true
        });
      } catch (error: any) {
        if (!error.message.includes('BUSYGROUP')) throw error;
      }

      this.isRunning = true;
      logger.info('Order worker started', { consumerName: this.consumerName });
      
      this.processLoop();
    } catch (error) {
      logger.error('Failed to start order worker:', error);
      process.exit(1);
    }
  }

  private async processLoop() {
    while (this.isRunning) {
      try {
        const messages = await subClient.xReadGroup(
          CONFIG.CONSUMER_GROUP,
          this.consumerName,
          [{ key: CONFIG.STREAM_KEY, id: '>' }],
          { COUNT: 1, BLOCK: 1000 }
        );

        if (messages && Array.isArray(messages) && messages.length > 0) {
          const stream = messages[0] as any;
          if (stream?.messages && Array.isArray(stream.messages)) {
            for (const message of stream.messages) {
              await this.handleMessage(message);
            }
          }
        }
      } catch (error) {
        logger.error('Error in processing loop:', error);
        await delay(5000);
      }
    }
  }

  private async handleMessage(message: StreamMessage) {
    const { orderId, orderData } = message.message;
    
    if (!orderId || !orderData) {
      logger.error('Invalid message:', message.message);
      await this.ackMessage(message.id);
      return;
    }

    try {
      const order = JSON.parse(orderData) as Order;
      await this.processor.processOrder(orderId, order);
      await this.ackMessage(message.id);
      
    } catch (error) {
      logger.error('Failed to process order:', { orderId, error });
    }
  }

  private async ackMessage(messageId: string) {
    try {
      await subClient.xAck(CONFIG.STREAM_KEY, CONFIG.CONSUMER_GROUP, messageId);
    } catch (error) {
      logger.error('Failed to ack message:', { messageId, error });
    }
  }

  async stop() {
    this.isRunning = false;
    await delay(CONFIG.SHUTDOWN_TIMEOUT);
    logger.info('Order worker stopped');
  }

}

// Start worker
const worker = new OrderWorker();

// Graceful shutdown
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, shutting down...`);
    await worker.stop();
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  process.exit(1);
});

// Start
worker.start().catch((error) => {
  logger.error('Failed to start worker:', error);
  process.exit(1);
});