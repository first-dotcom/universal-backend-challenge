import "dotenv/config";
import { UniversalRelayerSDK } from 'universal-sdk';
import { subClient, initializeRedisClients } from 'shared/lib/redis';
import { logOrder, logError } from 'shared/lib/logger';
import { OrderProcessor } from './order-processor';
import { Order } from 'shared/types';
import { CONFIG } from './constants';

class OrderWorker {
  private processor: OrderProcessor;
  private isRunning = false;

  constructor() {
    const sdk = new UniversalRelayerSDK();
    this.processor = new OrderProcessor(sdk);
  }

  async start(): Promise<void> {
    try {
      await initializeRedisClients();
      this.isRunning = true;
      
      // Create consumer group if it doesn't exist
      try {
        await subClient.xGroupCreate(CONFIG.STREAM_KEY, CONFIG.CONSUMER_GROUP, '$', {
          MKSTREAM: true
        });
      } catch (error) {
        // Group might already exist, ignore error
      }

      console.log('Order worker started, listening for orders...');
      
      // Start processing orders
      this.processOrders();
      
      // Handle graceful shutdown
      process.on('SIGINT', this.shutdown.bind(this));
      process.on('SIGTERM', this.shutdown.bind(this));
      
    } catch (error) {
      logError('Failed to start order worker', error as Error, {
        operation: 'worker_start'
      });
      process.exit(1);
    }
  }

  private async processOrders(): Promise<void> {
    while (this.isRunning) {
      try {
        const messages = await subClient.xReadGroup(
          CONFIG.CONSUMER_GROUP,
          `worker-${process.pid}`,
          [{ key: CONFIG.STREAM_KEY, id: '>' }],
          { COUNT: 1, BLOCK: 1000 }
        );

        if (messages && Array.isArray(messages)) {
          for (const stream of messages) {
            if (stream && typeof stream === 'object' && 'messages' in stream) {
              const streamMessages = stream.messages as Array<{
                id: string;
                message: Record<string, string>;
              }>;
              
              for (const message of streamMessages) {
                const { orderId, orderData, traceId } = message.message;
                
                if (orderId && orderData) {
                  try {
                    const order: Order = JSON.parse(orderData);
                    
                    // Log order received with traceId for tracking
                    logOrder(orderId, 'received_by_worker', 'PROCESSING', traceId);
                    
                    const result = await this.processor.processOrder(orderId, order, traceId);
                    
                    if (result.success) {
                      logOrder(orderId, 'worker_completed', 'COMPLETED', traceId);
                    } else {
                      logOrder(orderId, 'worker_failed', 'FAILED', traceId);
                    }
                    
                    // Acknowledge message
                    await subClient.xAck(CONFIG.STREAM_KEY, CONFIG.CONSUMER_GROUP, message.id);
                    
                  } catch (error) {
                    logError('Error processing order', error as Error, {
                      orderId,
                      traceId,
                      operation: 'order_processing'
                    });
                    
                    // Acknowledge message even on error to prevent infinite retries
                    await subClient.xAck(CONFIG.STREAM_KEY, CONFIG.CONSUMER_GROUP, message.id);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        logError('Error in order processing loop', error as Error, {
          operation: 'processing_loop'
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      }
    }
  }

  private async shutdown(): Promise<void> {
    console.log('Shutting down order worker...');
    this.isRunning = false;
    
    // Wait for current operations to complete
    await new Promise(resolve => setTimeout(resolve, CONFIG.SHUTDOWN_TIMEOUT));
    
    console.log('Order worker shutdown complete');
    process.exit(0);
  }
}

// Start the worker
const worker = new OrderWorker();
worker.start().catch(error => {
  console.error('Failed to start order worker:', error);
  process.exit(1);
});