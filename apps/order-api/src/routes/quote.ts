import express from 'express';
import universalService from '../services/universal';
import logger from 'shared/lib/logger';

const router: express.Router = express.Router();

// GET /quote - Get a quote using dummy data
router.get('/', async (req, res) => {
  try {
    logger.info('Processing quote request');
    
    // Create dummy quote request
    const dummyQuoteRequest = universalService.createDummyQuoteRequest();
    
    // Get quote from universal service
    const quote = await universalService.getQuote(dummyQuoteRequest);
    
    logger.info('Quote request processed successfully');
    res.json({
      success: true,
      data: quote,
      requestData: dummyQuoteRequest
    });
  } catch (error) {
    logger.error('Quote request failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quote'
    });
  }
});

export default router; 