import { OrderRequest, QuoteRequest } from 'universal-sdk';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface Order {
  id: string;
  quote: OrderRequest;
  status: 'PENDING' | 'PROCESSING' | 'SUBMITTED' | 'FAILED';
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  constructor(private baseUrl: string) {}

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      retries = 3,
      retryDelay = 1000,
      timeout = 5000,
      headers = {}
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      },
      signal: AbortSignal.timeout(timeout)
    };

    if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        const result = await response.json();

        if (!response.ok) {
          throw new ApiError(
            result.error || `HTTP ${response.status}`,
            response.status,
            result
          );
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof ApiError) {
          // Don't retry 4xx errors (client errors)
          if (error.status >= 400 && error.status < 500) {
            throw error;
          }
        }

        if (attempt < retries) {
          console.log(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError!;
  }

  // Health endpoint (special case - returns different format)
  async health(options?: RequestOptions): Promise<{ status: string; timestamp: string }> {
    const {
      retries = 3,
      retryDelay = 1000,
      timeout = 5000,
      headers = {}
    } = options || {};

    const url = `${this.baseUrl}/health`;
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...headers
      },
      signal: AbortSignal.timeout(timeout)
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        const result = await response.json();

        if (!response.ok) {
          throw new ApiError(
            result.error || `HTTP ${response.status}`,
            response.status,
            result
          );
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof ApiError) {
          // Don't retry 4xx errors (client errors)
          if (error.status >= 400 && error.status < 500) {
            throw error;
          }
        }

        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError!;
  }

  // Quote endpoints
  async getDummyQuote(options?: RequestOptions): Promise<ApiResponse> {
    return this.request('GET', '/quote', undefined, options);
  }

  async getQuote(data: QuoteRequest, options?: RequestOptions): Promise<ApiResponse> {
    return this.request('POST', '/quote', data, options);
  }

  // Order endpoints
  async createOrder(data: OrderRequest, options?: RequestOptions): Promise<ApiResponse<{ order: Order }>> {
    return this.request('POST', '/order', data, options);
  }

  async getOrder(id: string, options?: RequestOptions): Promise<ApiResponse<Order>> {
    return this.request('GET', `/order/${id}`, undefined, options);
  }

  // Raw request for testing edge cases
  async rawRequest(
    method: string,
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers
      },
      signal: AbortSignal.timeout(options?.timeout || 5000)
    };

    if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    return fetch(url, requestOptions);
  }
} 