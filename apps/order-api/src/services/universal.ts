import { UniversalRelayerSDK } from 'universal-sdk';
import logger from 'shared/lib/logger';
import type { QuoteRequest } from 'universal-sdk';

class UniversalService {
  private sdk: UniversalRelayerSDK;

  constructor() {
    const apiKey = process.env.UNIVERSAL_API_KEY;
    if (!apiKey) {
      throw new Error('UNIVERSAL_API_KEY environment variable is required');
    }
    this.sdk = new UniversalRelayerSDK(apiKey);
  }

  async getQuote(quoteRequest: QuoteRequest): Promise<any> {
    try {
      logger.info('Fetching quote from universal-sdk', { quoteRequest });
      const quote = await this.sdk.getQuote(quoteRequest);
      logger.info('Quote received successfully');
      return quote;
    } catch (error) {
      logger.error('Failed to get quote:', error);
      throw error;
    }
  }

  async submitOrder(quoteData: any): Promise<any> {
    try {
      logger.info('Submitting order to universal-sdk', { quoteData });
      const order = await this.sdk.submitOrder(quoteData);
      logger.info('Order submitted successfully');
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