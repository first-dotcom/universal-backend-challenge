import "dotenv/config";
import logger from "shared/lib/logger";
import { UniversalRelayerSDK } from "universal-sdk";
import type { Quote, QuoteRequest } from "universal-sdk";

class QuoteService {
  private sdk: UniversalRelayerSDK;

  constructor() {
    this.sdk = new UniversalRelayerSDK();
  }

  async getQuote(quoteRequest: QuoteRequest): Promise<Quote> {
    try {
      logger.info("Fetching quote from universal-sdk", { quoteRequest });
      const quote = await this.sdk.getQuote(quoteRequest);
      logger.info("Quote received successfully", { quoteId: quote.id });
      return quote;
    } catch (error) {
      logger.error(`Failed to get quote. Error: ${error}`);
      throw error;
    }
  }

  // Method to create dummy quote request for testing - WORKING PARAMETERS
  createDummyQuoteRequest(): QuoteRequest {
    return {
      type: "SELL",
      token: "ETH",
      token_amount: "1000000000000000000", // 1 ETH in wei (18 decimals)
      pair_token: "USDC",
      blockchain: "BASE",
      user_address: "0x1111111111111111111111111111111111111111",
      slippage_bips: 100, // 1%
    };
  }
}

export default new QuoteService();
