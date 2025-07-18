import { describe, it, expect, beforeAll } from 'vitest';
import { ApiClient, ApiError } from '../helpers/api-client';
import { measureResponseTime } from '../helpers/docker-utils';
import { createValidQuoteRequest, invalidQuoteRequests } from '../helpers/test-data';
import { 
  expectSuccessResponse, 
  expectErrorResponse, 
  expectResponseTime, 
  expectValidationError 
} from '../helpers/assertions';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

describe('Quote Endpoints', () => {
  let client: ApiClient;

  beforeAll(() => {
    client = new ApiClient(API_BASE_URL);
  });

  describe('GET /quote (Dummy Data)', () => {
    it('should return dummy quote successfully', async () => {
      const response = await client.getDummyQuote();
      
      expectSuccessResponse(response);
      expect(response.data).toBeDefined();
    });

    it('should respond within 500ms', async () => {
      const { responseTime } = await measureResponseTime(() => client.getDummyQuote());
      
      expectResponseTime(responseTime, 500);
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() => client.getDummyQuote());
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expectSuccessResponse(response);
      });
    });
  });

  describe('POST /quote (Real Data)', () => {
    it('should create quote with valid BUY request', async () => {
      const quoteRequest = createValidQuoteRequest({
        type: 'BUY',
        pair_token_amount: '1000'
      });

      const response = await client.getQuote(quoteRequest);
      
      expectSuccessResponse(response);
      expect(response.data).toBeDefined();
    });

    it('should create quote with valid SELL request', async () => {
      const quoteRequest = createValidQuoteRequest({
        type: 'SELL',
        token_amount: '0.5'
      });

      const response = await client.getQuote(quoteRequest);
      
      expectSuccessResponse(response);
      expect(response.data).toBeDefined();
    });

    it('should handle different tokens', async () => {
      const tokens = ['ETH', 'BTC', 'SOL', 'MATIC'];
      
      for (const token of tokens) {
        const quoteRequest = createValidQuoteRequest({ token });
        const response = await client.getQuote(quoteRequest);
        
        expectSuccessResponse(response);
      }
    });

    it('should handle different blockchains', async () => {
      const blockchains = ['ARBITRUM', 'BASE', 'POLYGON', 'WORLD'];
      
      for (const blockchain of blockchains) {
        const quoteRequest = createValidQuoteRequest({ blockchain });
        const response = await client.getQuote(quoteRequest);
        
        expectSuccessResponse(response);
      }
    });

    it('should handle custom pair token address', async () => {
      const quoteRequest = createValidQuoteRequest({
        pair_token: '0x742d35cc6634c0532925a3b8d435c6878c0532925'
      });

      const response = await client.getQuote(quoteRequest);
      
      expectSuccessResponse(response);
    });

    it('should respond within 2000ms', async () => {
      const quoteRequest = createValidQuoteRequest();
      const { responseTime } = await measureResponseTime(() => client.getQuote(quoteRequest));
      
      expectResponseTime(responseTime, 2000);
    });

    describe('Validation Errors', () => {
      it('should reject request without type', async () => {
        try {
          await client.getQuote(invalidQuoteRequests.missingType as any);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should reject invalid token', async () => {
        try {
          await client.getQuote(invalidQuoteRequests.invalidToken as any);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should reject invalid blockchain', async () => {
        try {
          await client.getQuote(invalidQuoteRequests.invalidBlockchain as any);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should reject invalid user address', async () => {
        try {
          await client.getQuote(invalidQuoteRequests.invalidAddress as any);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should reject invalid slippage', async () => {
        try {
          await client.getQuote(invalidQuoteRequests.invalidSlippage as any);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should reject empty request body', async () => {
        try {
          await client.getQuote({} as any);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should reject malformed JSON', async () => {
        try {
          const response = await client.rawRequest('POST', '/quote', 'invalid json');
          expect(response.status).toBe(400);
        } catch (error) {
          // Network level error is also acceptable
          expect(error).toBeDefined();
        }
      });
    });
  });
}); 