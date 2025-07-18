import express from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logOrder, logError } from 'shared/lib/logger';
import { Order } from 'shared/types';
import { OrderRequest } from 'universal-sdk';
import { ALLOWED_TOKENS, ALLOWED_BLOCKCHAINS, addressRegex } from '../config';
import db from 'shared/lib/database';
import { orders } from 'shared/lib/schema';
import { pubClient } from 'shared/lib/redis';
import { eq } from 'drizzle-orm';

const router: express.Router = express.Router();

const OrderRequestSchema = z.object({
  id: z.string(),
  deadline: z.string(),
  merchant_address: z.string().regex(addressRegex, 'Invalid merchant address'),
  gas_fee_nominal: z.string(),
  gas_fee_dollars: z.number(),
  relayer_nonce: z.number(),
  merchant_id: z.string(),
  mode: z.enum(['BRIDGED', 'DIRECT']),
  pair_token_amount: z.string(),
  user_address: z.string().regex(addressRegex, 'Invalid user address'),
  type: z.enum(['BUY', 'SELL']),
  blockchain: z.enum(ALLOWED_BLOCKCHAINS),
  token: z.enum(ALLOWED_TOKENS),
  token_amount: z.string().optional(),
  pair_token: z.union([z.literal('USDC'), z.string().regex(addressRegex, 'Invalid token address')]),
  slippage_bips: z.number().optional(),
  signature: z.string(),
});

// POST /order - Submit an order with enhanced traceId tracking
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const traceId = req.traceId;
  
  try {
    logOrder('temp', 'submission_started', 'VALIDATING', traceId);
    
    const validationResult = OrderRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logOrder('temp', 'validation_failed', 'INVALID', traceId);
      return res.status(400).json({
        success: false,
        error: 'Invalid order request data',
        details: validationResult.error.issues
      });
    }

    // Create order with enhanced tracking
    const orderId = generateOrderId();
    const order: Order = {
      id: orderId,
      quote: validationResult.data as OrderRequest,
      status: 'PENDING'
    };
    
    logOrder(orderId, 'created', 'PENDING', traceId);
    
    // Store order in database
    await db.insert(orders).values({
      id: orderId,
      quote: validationResult.data,
      status: 'PENDING'
    });
    
    // Publish to Redis Stream with traceId for worker tracking
    await pubClient.xAdd('orders:stream', '*', {
      orderId,
      orderData: JSON.stringify(order),
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      traceId
    });
    
    logOrder(orderId, 'queued', 'PENDING', traceId);
    
    res.json({
      success: true,
      data: {
        order: {
          ...order,
          traceId  // Include traceId in response for client tracking
        },
        message: 'Order created and queued for processing'
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Order submission failed', error as Error, {
      traceId,
      duration,
      operation: 'order_submission'
    });
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit order'
    });
  }
});

// GET /order/:id - Get order by ID with traceId tracking
router.get('/:id', async (req, res) => {
  const traceId = req.traceId;
  const orderId = req.params.id;
  
  try {
    logOrder(orderId, 'lookup_started', undefined, traceId);
    
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    
    if (order.length === 0) {
      logOrder(orderId, 'not_found', 'MISSING', traceId);
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    logOrder(orderId, 'lookup_completed', order[0].status, traceId);
    
    res.json({
      success: true,
      data: {
        ...order[0],
        traceId  // Include current traceId for tracking
      }
    });
  } catch (error) {
    logError('Order lookup failed', error as Error, {
      traceId,
      orderId,
      operation: 'order_lookup'
    });
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve order'
    });
  }
});

// Helper function to generate order ID
function generateOrderId(): string {
  return `order_${uuidv4()}`;
}

export default router; 