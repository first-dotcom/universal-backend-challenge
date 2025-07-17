import { UniversalRelayerSDK } from 'universal-sdk';
import { eq, and } from 'drizzle-orm';
import { ethers } from 'ethers';
import logger from '../../../shared/src/lib/logger';
import db from '../../../shared/src/lib/database';
import { orders } from '../../../shared/src/lib/schema';
import { Order } from '../../../shared/src/types';
import { subClient } from '../../../shared/src/lib/redis';
import { ProcessingResult, CONFIG } from './constants';
import { delay } from 'shared/lib/time';

export class OrderProcessor {
  private sdk: UniversalRelayerSDK;
  private wallet: ethers.Wallet;
  
  // Simple circuit breaker
  private circuitBreaker = {
    failures: 0,
    lastFailureTime: 0,
    isOpen: false
  };

  constructor(sdk: UniversalRelayerSDK, wallet: ethers.Wallet) {
    this.sdk = sdk;
    this.wallet = wallet;
  }

  async processOrder(orderId: string, orderData: Order): Promise<ProcessingResult> {
    let lastError: string | undefined;
    
    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
      try {
        // Check circuit breaker
        if (this.circuitBreaker.isOpen && !this.shouldResetCircuitBreaker()) {
          throw new Error('Circuit breaker is open - external service unavailable');
        }

        const claimed = await this.claimOrder(orderId);
        if (!claimed) {
          return { success: true };
        }

        const result = await this.submitToExternalService(orderData);
        this.onSuccess();
        return { success: true, ...result };
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        this.onFailure();
        
        if (attempt < CONFIG.MAX_RETRIES) {
          await delay(CONFIG.RETRY_DELAY * attempt);
        }
      }
    }
    
    // All retries failed - move to DLQ
    await this.moveToDLQ(orderId, orderData, lastError || 'Unknown error');
    await this.markAsFailed(orderId);
    return { success: false, error: lastError };
  }

  private async claimOrder(orderId: string): Promise<boolean> {
    try {
      const result = await db.update(orders)
        .set({ status: 'PROCESSING', updatedAt: new Date() })
        .where(and(eq(orders.id, orderId), eq(orders.status, 'PENDING')))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      logger.error('Failed to claim order:', { orderId, error });
      return false;
    }
  }

  private async submitToExternalService(order: Order): Promise<{
    externalOrderId: string;
    transactionHash?: string;
  }> {
    // Get quote and submit
    const quote = await this.sdk.getQuote({
      type: order.quote.type as "BUY" | "SELL",
      token: order.quote.token,
      pair_token: order.quote.pair_token,
      pair_token_amount: order.quote.pair_token_amount,
      blockchain: order.quote.blockchain,
      user_address: order.quote.user_address,
      slippage_bips: order.quote.slippage_bips
    });

    const signature = await this.signQuote(quote);
    const orderResult = await this.sdk.submitOrder({ ...quote, signature });

    // Update database
    await db.update(orders)
      .set({ 
        status: 'SUBMITTED',
        externalOrderId: orderResult.order_id,
        transactionHash: orderResult.transaction_hash,
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id));

    return {
      externalOrderId: orderResult.order_id,
      transactionHash: orderResult.transaction_hash
    };
  }

  private async signQuote(quote: any): Promise<string> {
    const domain = {
      name: 'Universal Relayer',
      version: '1',
      chainId: quote.blockchain === 'ethereum' ? 1 : 137,
    };

    const types = {
      Order: [
        { name: 'type', type: 'string' },
        { name: 'token', type: 'address' },
        { name: 'pairToken', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'userAddress', type: 'address' },
      ]
    };

    const value = {
      type: quote.type,
      token: quote.token,
      pairToken: quote.pair_token,
      amount: quote.pair_token_amount,
      userAddress: quote.user_address,
    };

    return await this.wallet._signTypedData(domain, types, value);
  }

  private async moveToDLQ(orderId: string, orderData: Order, error: string): Promise<void> {
    try {
      const timestamp = Date.now();
      const key = `failed-${orderId}-${timestamp}`;
      const dlqData = {
        orderData,
        error: error.substring(0, 500),
        failedAt: new Date().toISOString(),
        retryCount: CONFIG.MAX_RETRIES
      };
      
      await subClient.hSet(CONFIG.FAILED_ORDERS_KEY, key, JSON.stringify(dlqData));
      
      logger.info('Order moved to DLQ:', { orderId, key, error: error.substring(0, 100) });
    } catch (dlqError) {
      logger.error('Failed to move order to DLQ:', { orderId, error: dlqError });
    }
  }

  private async markAsFailed(orderId: string): Promise<void> {
    await db.update(orders)
      .set({ status: 'FAILED', updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  }

  // Simple circuit breaker logic
  private onSuccess(): void {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.isOpen = false;
  }

  private onFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failures >= CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreaker.isOpen = true;
      logger.warn('Circuit breaker opened', { failures: this.circuitBreaker.failures });
    }
  }

  private shouldResetCircuitBreaker(): boolean {
    const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailureTime;
    if (timeSinceFailure >= CONFIG.CIRCUIT_BREAKER_RESET_TIME) {
      this.circuitBreaker.isOpen = false;
      logger.info('Circuit breaker reset');
      return true;
    }
    return false;
  }


}