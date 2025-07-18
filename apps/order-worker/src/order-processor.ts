import { and, eq } from "drizzle-orm";
import db from "shared/lib/database";
import logger, { logOrder, logError } from "shared/lib/logger";
import { subClient } from "shared/lib/redis";
import { orders } from "shared/lib/schema";
import { delay } from "shared/lib/time";
import { Order } from "shared/types";
import { UniversalRelayerSDK } from "universal-sdk";
import { CONFIG, ProcessingResult } from "./constants";

export class OrderProcessor {
  private sdk: UniversalRelayerSDK;

  // Simple circuit breaker
  private circuitBreaker = {
    failures: 0,
    lastFailureTime: 0,
    isOpen: false,
  };

  constructor(sdk: UniversalRelayerSDK) {
    this.sdk = sdk;
  }

  async processOrder(
    orderId: string,
    orderData: Order,
    traceId?: string,
  ): Promise<ProcessingResult> {
    let lastError: string | undefined;

    // Log order processing start with traceId
    logOrder(orderId, "processing_started", "PROCESSING", traceId);

    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
      try {
        // Check circuit breaker
        if (this.circuitBreaker.isOpen && !this.shouldResetCircuitBreaker()) {
          throw new Error("Circuit breaker is open - external service unavailable");
        }

        const claimed = await this.claimOrder(orderId);
        if (!claimed) {
          return { success: true };
        }

        const result = await this.submitToExternalService(orderData);
        this.onSuccess();

        // Log successful completion
        logOrder(orderId, "processing_completed", "COMPLETED", traceId);

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
    await this.moveToFailed(orderId, orderData, lastError || "Unknown error");
    await this.markAsFailed(orderId);

    // Log final failure
    logOrder(orderId, "processing_failed_final", "FAILED", traceId);

    return { success: false, error: lastError };
  }

  private async claimOrder(orderId: string): Promise<boolean> {
    try {
      const result = await db
        .update(orders)
        .set({ status: "PROCESSING", updatedAt: new Date() })
        .where(and(eq(orders.id, orderId), eq(orders.status, "PENDING")))
        .returning();

      return result.length > 0;
    } catch (error) {
      logger.error("Failed to claim order:", { orderId, error });
      return false;
    }
  }

  private async submitToExternalService(order: Order): Promise<{
    externalOrderId: string;
    transactionHash?: string;
  }> {
    // Submit order with client's signature (already included in order.quote)
    const orderResult = await this.sdk.submitOrder(order.quote);

    // Update database
    await db
      .update(orders)
      .set({
        status: "SUBMITTED",
        externalOrderId: orderResult.order_id,
        transactionHash: orderResult.transaction_hash,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    return {
      externalOrderId: orderResult.order_id,
      transactionHash: orderResult.transaction_hash,
    };
  }

  private async moveToFailed(orderId: string, orderData: Order, error: string): Promise<void> {
    try {
      const timestamp = Date.now();
      const key = `failed-${orderId}-${timestamp}`;
      const failedData = {
        orderData,
        error: error.substring(0, 500),
        failedAt: new Date().toISOString(),
        retryCount: CONFIG.MAX_RETRIES,
      };

      await subClient.hSet(CONFIG.FAILED_ORDERS_KEY, key, JSON.stringify(failedData));

      logger.info("Order moved to failed:", { orderId, key, error: error.substring(0, 100) });
    } catch (failedError) {
      logger.error("Failed to move order to failed:", { orderId, error: failedError });
    }
  }

  private async markAsFailed(orderId: string): Promise<void> {
    await db
      .update(orders)
      .set({ status: "FAILED", updatedAt: new Date() })
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
      logger.warn("Circuit breaker opened", { failures: this.circuitBreaker.failures });
    }
  }

  private shouldResetCircuitBreaker(): boolean {
    const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailureTime;
    if (timeSinceFailure >= CONFIG.CIRCUIT_BREAKER_RESET_TIME) {
      this.circuitBreaker.isOpen = false;
      logger.info("Circuit breaker reset");
      return true;
    }
    return false;
  }
}
