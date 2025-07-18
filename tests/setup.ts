import { beforeAll, afterAll } from 'vitest';
import { ApiClient } from './helpers/api-client';
import { waitForHealthy } from './helpers/docker-utils';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

beforeAll(async () => {
  console.log('🔧 Setting up integration tests...');
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  // Wait for API to be healthy
  const client = new ApiClient(API_BASE_URL);
  await waitForHealthy(client, MAX_RETRIES, RETRY_DELAY);
  
  console.log('✅ API is ready for testing');
}, 60000);

afterAll(async () => {
  console.log('🧹 Cleaning up after tests...');
  // Add any cleanup logic here if needed
}); 