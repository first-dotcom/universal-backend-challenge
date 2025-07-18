import { describe, it, expect, beforeAll } from 'vitest';
import { ApiClient } from '../helpers/api-client';
import { measureResponseTime } from '../helpers/docker-utils';
import { expectSuccessResponse, expectValidHealthResponse, expectResponseTime } from '../helpers/assertions';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

describe('Health Endpoint', () => {
  let client: ApiClient;

  beforeAll(() => {
    client = new ApiClient(API_BASE_URL);
  });

  it('should return healthy status', async () => {
    const response = await client.health();
    
    expectValidHealthResponse(response);
  });

  it('should respond within 500ms', async () => {
    const { responseTime } = await measureResponseTime(() => client.health());
    
    expectResponseTime(responseTime, 500);
  });

  it('should handle multiple concurrent requests', async () => {
    const requests = Array(10).fill(null).map(() => client.health());
    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expectValidHealthResponse(response);
    });
  });

  it('should return consistent timestamp format', async () => {
    const response = await client.health();
    
    expectValidHealthResponse(response);
    
    const timestamp = new Date(response.timestamp);
    expect(timestamp.toISOString()).toBe(response.timestamp);
  });
}); 