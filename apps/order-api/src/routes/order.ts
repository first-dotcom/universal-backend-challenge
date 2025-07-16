import express from 'express';
import universalService from '../services/universal';
import logger from 'shared/lib/logger';
import { Order } from 'shared/types';

const router: express.Router = express.Router();

// In-memory storage for demo purposes (replace with actual database)
const orderStorage: Map<string, Order> = new Map();

// POST /order - Submit an order
router.post('/', async (req, res) => {
  try {
    logger.info('Processing order submission');
    
    const quoteData = req.body;
    
    if (!quoteData) {
      return res.status(400).json({
        success: false,
        error: 'Quote data is required'
      });
    }

    // Submit order to universal service
    const orderResult = await universalService.submitOrder(quoteData);
    
    // Create order object for storage
    const order: Order = {
      id: generateOrderId(),
      quote: quoteData,
      status: 'SUBMITTED'
    };
    
    // Store order (in real app, this would be saved to database)
    orderStorage.set(order.id, order);
    
    logger.info('Order submitted successfully', { orderId: order.id });
    res.json({
      success: true,
      data: {
        order,
        universalResult: orderResult
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
router.get('/:id', (req, res) => {
  try {
    const orderId = req.params.id;
    logger.info('Fetching order', { orderId });
    
    const order = orderStorage.get(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    logger.info('Order retrieved successfully', { orderId });
    res.json({
      success: true,
      data: order
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