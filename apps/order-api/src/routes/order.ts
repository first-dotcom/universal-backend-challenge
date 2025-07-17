import express from 'express';
import { z } from 'zod';
import logger from 'shared/lib/logger';
import { Order, OrderStatus } from 'shared/types';
import { QuoteRequest } from 'universal-sdk';
import { ALLOWED_TOKENS } from '../config';
import db from 'shared/lib/database';
import { orders } from 'shared/lib/schema';
import { pubClient } from 'shared/lib/redis';
import { eq } from 'drizzle-orm';

const router: express.Router = express.Router();

const OrderRequestSchema = z.object({
  id: z.string(),
  deadline: z.string(),
  merchant_address: z.string(),
  gas_fee_nominal: z.string(),
  gas_fee_dollars: z.number(),
  relayer_nonce: z.number(),
  merchant_id: z.string(),
  mode: z.enum(['BRIDGED', 'DIRECT']),
  pair_token_amount: z.string(),
  user_address: z.string(),
  type: z.enum(['BUY', 'SELL']),
  blockchain: z.string(),
  token: z.enum(ALLOWED_TOKENS),
  token_amount: z.string().optional(),
  pair_token: z.string(),
  slippage_bips: z.number().optional(),
  signature: z.string(),
});

// POST /order - Submit an order
router.post('/', async (req, res) => {
  try {
    logger.info('Processing order submission');
    
    const validationResult = OrderRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order request data',
        details: validationResult.error.issues
      });
    }

    // Create order object for storage
    const orderId = generateOrderId();
    const order: Order = {
      id: orderId,
      quote: validationResult.data as QuoteRequest,
      status: 'PENDING'
    };
    
    // Store order in database
    await db.insert(orders).values({
      id: orderId,
      quote: validationResult.data,
      status: 'PENDING'
    });
    
    // Publish to Redis Stream for worker to process
    await pubClient.xAdd('orders:stream', '*', {
      orderId,
      orderData: JSON.stringify(order),
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    });
    
    logger.info('Order created successfully', { orderId: order.id });
    res.json({
      success: true,
      data: {
        order,
        message: 'Order created and queued for processing'
      }
    });
  } catch (error) {
    logger.error('Order submission failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit order'
    });
  }
});

// GET /order/:id - Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    logger.info('Fetching order', { orderId });
    
    const result = await db.select().from(orders).where(eq(orders.id, orderId));
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    const order = result[0];
    const orderResponse: Order = {
      id: order.id,
      quote: order.quote as QuoteRequest,
      status: order.status as OrderStatus
    };
    
    logger.info('Order retrieved successfully', { orderId });
    res.json({
      success: true,
      data: orderResponse
    });
  } catch (error) {
    logger.error('Failed to fetch order:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch order'
    });
  }
});

// Helper function to generate order ID
function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default router; 