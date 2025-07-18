import 'dotenv/config';
import { UniversalRelayerSDK } from 'universal-sdk';
import logger from 'shared/lib/logger';
import type { OrderRequest, OrderResponse, Quote, QuoteRequest } from 'universal-sdk';

class UniversalService {
  private sdk: UniversalRelayerSDK;

  constructor() {
    const apiKey = process.env.UNIVERSAL_API_KEY;
    
    // API key is optional - Universal API works without it for basic usage
    if (apiKey) {
      logger.info('Initializing Universal SDK with API key');
      this.sdk = new UniversalRelayerSDK(apiKey);
    } else {
      logger.info('Initializing Universal SDK without API key (public access)');
      this.sdk = new UniversalRelayerSDK();
    }
  }

  async getQuote(quoteRequest: QuoteRequest): Promise<Quote> {
    try {
      logger.info('Fetching quote from universal-sdk', { quoteRequest });
      const quote = await this.sdk.getQuote(quoteRequest);
      logger.info('Quote received successfully', { quoteId: quote.id });
      return quote;
    } catch (error) {
      logger.error(`Failed to get quote. Error: ${error}`);
      throw error;
    }
  }

  async submitOrder(quoteData: OrderRequest): Promise<OrderResponse> {
    try {
      logger.info('Submitting order to universal-sdk', { quoteData });
      const order = await this.sdk.submitOrder(quoteData);
      logger.info('Order submitted successfully', { orderId: order.order_id, transactionHash: order.transaction_hash });
      return order;
    } catch (error) {
      logger.error('Failed to submit order:', error);
      throw error;
    }
  }

  // Method to create dummy quote request for testing
  createDummyQuoteRequest(): QuoteRequest {
    return {
      type: "BUY",
      token: "ETH",
      pair_token: "USDC",
      pair_token_amount: "1000", // 1000 USDC
      blockchain: "BASE",
      user_address: "0x1111111111111111111111111111111111111111",
      slippage_bips: 50 // 0.5%
    };
  }
}

export default new UniversalService();