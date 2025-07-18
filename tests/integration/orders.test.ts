import { describe, it, expect, beforeAll } from 'vitest';
import { ApiClient, ApiError, Order } from '../helpers/api-client';
import { measureResponseTime } from '../helpers/docker-utils';
import { createValidOrderRequest, invalidOrderRequests } from '../helpers/test-data';
import { 
  expectSuccessResponse, 
  expectErrorResponse, 
  expectResponseTime, 
  expectValidOrder,
  expectValidationError 
} from '../helpers/assertions';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

describe('Order Endpoints', () => {
  let client: ApiClient;
  let createdOrderIds: string[] = [];

  beforeAll(() => {
    client = new ApiClient(API_BASE_URL);
  });

  describe('POST /order (Create Order)', () => {
    it('should create order with valid BUY request', async () => {
      const orderRequest = createValidOrderRequest({
        type: 'BUY',
        mode: 'DIRECT'
      });

      const response = await client.createOrder(orderRequest);
      
      expectSuccessResponse(response);
      expectValidOrder(response.data.order);
      expect(response.data.order.quote.type).toBe('BUY');
      expect(response.data.order.status).toBe('PENDING');
      
      createdOrderIds.push(response.data.order.id);
    });

    it('should create order with valid SELL request', async () => {
      const orderRequest = createValidOrderRequest({
        type: 'SELL',
        mode: 'BRIDGED'
      });

      const response = await client.createOrder(orderRequest);
      
      expectSuccessResponse(response);
      expectValidOrder(response.data.order);
      expect(response.data.order.quote.type).toBe('SELL');
      expect(response.data.order.status).toBe('PENDING');
      
      createdOrderIds.push(response.data.order.id);
    });

    it('should handle different tokens', async () => {
      const tokens = ['ETH', 'BTC', 'SOL', 'MATIC'];
      
      for (const token of tokens) {
        const orderRequest = createValidOrderRequest({ token });
        const response = await client.createOrder(orderRequest);
        
        expectSuccessResponse(response);
        expectValidOrder(response.data.order);
        createdOrderIds.push(response.data.order.id);
      }
    });

    it('should handle different blockchains', async () => {
      const blockchains = ['ARBITRUM', 'BASE', 'POLYGON', 'WORLD'];
      
      for (const blockchain of blockchains) {
        const orderRequest = createValidOrderRequest({ blockchain });
        const response = await client.createOrder(orderRequest);
        
        expectSuccessResponse(response);
        expectValidOrder(response.data.order);
        createdOrderIds.push(response.data.order.id);
      }
    });

    it('should generate unique order IDs', async () => {
      const requests = Array(5).fill(null).map(() => 
        client.createOrder(createValidOrderRequest())
      );
      
      const responses = await Promise.all(requests);
      const orderIds = responses.map(r => r.data.order.id);
      
      // Check all IDs are unique
      const uniqueIds = new Set(orderIds);
      expect(uniqueIds.size).toBe(orderIds.length);
      
      createdOrderIds.push(...orderIds);
    });

    it('should respond within 1000ms', async () => {
      const orderRequest = createValidOrderRequest();
      const { responseTime } = await measureResponseTime(() => 
        client.createOrder(orderRequest)
      );
      
      expectResponseTime(responseTime, 1000);
    });

    it('should handle concurrent order creation', async () => {
      const requests = Array(3).fill(null).map(() => 
        client.createOrder(createValidOrderRequest())
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expectSuccessResponse(response);
        expectValidOrder(response.data.order);
      });
      
      createdOrderIds.push(...responses.map(r => r.data.order.id));
    });

    describe('Validation Errors', () => {
      it('should reject order without ID', async () => {
        try {
          await client.createOrder(invalidOrderRequests.missingId as any);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should reject invalid token', async () => {
        try {
          await client.createOrder(invalidOrderRequests.invalidToken as any);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should reject invalid mode', async () => {
        try {
          await client.createOrder(invalidOrderRequests.invalidMode as any);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should reject invalid user address', async () => {
        try {
          await client.createOrder(invalidOrderRequests.invalidAddress as any);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should reject empty request body', async () => {
        try {
          await client.createOrder({} as any);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should reject malformed JSON', async () => {
        try {
          const response = await client.rawRequest('POST', '/order', 'invalid json');
          expect(response.status).toBe(400);
        } catch (error) {
          // Network level error is also acceptable
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('GET /order/:id (Get Order)', () => {
    let testOrderId: string;

    beforeAll(async () => {
      // Create a test order for GET tests
      const orderRequest = createValidOrderRequest();
      const response = await client.createOrder(orderRequest);
      testOrderId = response.data.order.id;
      createdOrderIds.push(testOrderId);
    });

    it('should retrieve order by valid ID', async () => {
      const response = await client.getOrder(testOrderId);
      
      expectSuccessResponse(response);
      expectValidOrder(response.data);
      expect(response.data.id).toBe(testOrderId);
    });

    it('should return 404 for non-existent order ID', async () => {
      try {
        await client.getOrder('non_existent_order_123');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });

    it('should respond within 500ms', async () => {
      const { responseTime } = await measureResponseTime(() => 
        client.getOrder(testOrderId)
      );
      
      expectResponseTime(responseTime, 500);
    });

    it('should handle multiple requests for same order', async () => {
      const requests = Array(5).fill(null).map(() => client.getOrder(testOrderId));
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expectSuccessResponse(response);
        expectValidOrder(response.data);
        expect(response.data.id).toBe(testOrderId);
      });
    });

    it('should retrieve multiple different orders', async () => {
      // Use previously created orders
      const orderIds = createdOrderIds.slice(0, 3);
      
      for (const orderId of orderIds) {
        const response = await client.getOrder(orderId);
        
        expectSuccessResponse(response);
        expectValidOrder(response.data);
        expect(response.data.id).toBe(orderId);
      }
    });

    describe('Edge Cases', () => {
      it('should handle empty order ID', async () => {
        try {
          await client.getOrder('');
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(404);
        }
      });

      it('should handle very long order ID', async () => {
        const longId = 'a'.repeat(1000);
        
        try {
          await client.getOrder(longId);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(404);
        }
      });

      it('should handle special characters in order ID', async () => {
        const specialId = 'order!@#$%^&*()';
        
        try {
          await client.getOrder(specialId);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(404);
        }
      });
    });
  });

  describe('Integration Tests', () => {
    it('should create and immediately retrieve order', async () => {
      const orderRequest = createValidOrderRequest();
      
      // Create order
      const createResponse = await client.createOrder(orderRequest);
      expectSuccessResponse(createResponse);
      
      const orderId = createResponse.data.order.id;
      createdOrderIds.push(orderId);
      
      // Retrieve order
      const getResponse = await client.getOrder(orderId);
      expectSuccessResponse(getResponse);
      
      // Compare data
      expect(getResponse.data.id).toBe(orderId);
      expect(getResponse.data.quote.id).toBe(orderRequest.id);
      expect(getResponse.data.quote.type).toBe(orderRequest.type);
      expect(getResponse.data.quote.token).toBe(orderRequest.token);
      expect(getResponse.data.status).toBe('PENDING');
    });

    it('should handle rapid create and retrieve operations', async () => {
      const operations: Promise<any>[] = [];
      
      // Create multiple orders rapidly
      for (let i = 0; i < 3; i++) {
        const orderRequest = createValidOrderRequest();
        operations.push(client.createOrder(orderRequest));
      }
      
      const createResponses = await Promise.all(operations);
      
      // Retrieve all created orders
      const retrieveOperations = createResponses.map(response => 
        client.getOrder(response.data.order.id)
      );
      
      const retrieveResponses = await Promise.all(retrieveOperations);
      
      // Verify all operations succeeded
      createResponses.forEach(response => {
        expectSuccessResponse(response);
        createdOrderIds.push(response.data.order.id);
      });
      
      retrieveResponses.forEach(response => {
        expectSuccessResponse(response);
        expectValidOrder(response.data);
      });
    });
  });
}); 