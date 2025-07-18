import { expect } from 'vitest';
import { ApiResponse, Order } from './api-client';

export function expectSuccessResponse<T>(response: ApiResponse<T>): asserts response is ApiResponse<T> & { success: true; data: T } {
  expect(response).toBeDefined();
  expect(response.success).toBe(true);
  expect(response.data).toBeDefined();
  expect(response.error).toBeUndefined();
}

export function expectErrorResponse(response: ApiResponse, expectedStatus?: number): void {
  expect(response).toBeDefined();
  expect(response.success).toBe(false);
  expect(response.error).toBeDefined();
  expect(typeof response.error).toBe('string');
  expect(response.error).not.toBe('');
}

export function expectValidOrder(order: Order): void {
  expect(order).toBeDefined();
  expect(order.id).toBeDefined();
  expect(typeof order.id).toBe('string');
  expect(order.id).not.toBe('');
  
  expect(order.status).toBeDefined();
  expect(['PENDING', 'PROCESSING', 'SUBMITTED', 'FAILED']).toContain(order.status);
  
  expect(order.quote).toBeDefined();
  expect(typeof order.quote).toBe('object');
}

export function expectValidHealthResponse(response: { status: string; timestamp: string }): void {
  expect(response).toBeDefined();
  expect(response.status).toBe('OK');
  expect(response.timestamp).toBeDefined();
  expect(typeof response.timestamp).toBe('string');
  expect(new Date(response.timestamp)).toBeInstanceOf(Date);
}

export function expectResponseTime(responseTime: number, maxTime: number = 500): void {
  expect(responseTime).toBeLessThan(maxTime);
  expect(responseTime).toBeGreaterThan(0);
}

export function expectValidationError(response: ApiResponse, field?: string): void {
  expectErrorResponse(response);
  
  if (field && response.details) {
    expect(response.details).toBeDefined();
    expect(Array.isArray(response.details)).toBe(true);
    
    const fieldError = response.details.find((detail: any) => 
      detail.path && detail.path.includes(field)
    );
    expect(fieldError).toBeDefined();
  }
} 