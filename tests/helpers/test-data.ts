import { OrderRequest, QuoteRequest, TokenName } from "universal-sdk";

export const VALID_ADDRESS = "0x742d35Cc6634C0532925a3b8d435c6878c05325A";
export const INVALID_ADDRESS = "0xinvalid";

export const createValidQuoteRequest = (overrides: Partial<QuoteRequest> = {}): QuoteRequest => ({
  type: "BUY",
  token: "ETH",
  pair_token: "USDC",
  pair_token_amount: "1000",
  blockchain: "BASE",
  user_address: VALID_ADDRESS,
  slippage_bips: 100,
  ...overrides,
});

export const createValidOrderRequest = (overrides: Partial<OrderRequest> = {}): OrderRequest => ({
  id: `test_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  deadline: (Math.floor(Date.now() / 1000) + 3600).toString(), // 1 hour from now
  merchant_address: VALID_ADDRESS,
  gas_fee_nominal: "0.01",
  gas_fee_dollars: 25.5,
  relayer_nonce: 1,
  merchant_id: "test_merchant_123",
  mode: "DIRECT",
  pair_token_amount: "1000",
  user_address: VALID_ADDRESS,
  type: "BUY",
  blockchain: "BASE",
  token: "ETH",
  token_amount: "0.5",
  pair_token: "USDC",
  slippage_bips: 100,
  signature:
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b",
  ...overrides,
});

export const invalidQuoteRequests = {
  missingType: {
    token: "ETH",
    pair_token: "USDC",
    blockchain: "BASE",
    user_address: VALID_ADDRESS,
  },
  invalidToken: {
    type: "BUY",
    token: "INVALID_TOKEN",
    pair_token: "USDC",
    blockchain: "BASE",
    user_address: VALID_ADDRESS,
  },
  invalidBlockchain: {
    type: "BUY",
    token: "ETH",
    pair_token: "USDC",
    blockchain: "INVALID_BLOCKCHAIN",
    user_address: VALID_ADDRESS,
  },
  invalidAddress: {
    type: "BUY",
    token: "ETH",
    pair_token: "USDC",
    blockchain: "BASE",
    user_address: INVALID_ADDRESS,
  },
  invalidSlippage: {
    type: "BUY",
    token: "ETH",
    pair_token: "USDC",
    blockchain: "BASE",
    user_address: VALID_ADDRESS,
    slippage_bips: 20000, // Too high
  },
};

export const invalidOrderRequests = {
  missingId: {
    deadline: (Math.floor(Date.now() / 1000) + 3600).toString(),
    merchant_address: VALID_ADDRESS,
    gas_fee_nominal: "0.01",
    gas_fee_dollars: 25.5,
    relayer_nonce: 1,
    merchant_id: "test_merchant_123",
    mode: "DIRECT",
    pair_token_amount: "1000",
    user_address: VALID_ADDRESS,
    type: "BUY",
    blockchain: "BASE",
    token: "ETH",
    pair_token: "USDC",
    signature: "0x1234567890abcdef",
  },
  invalidToken: {
    ...createValidOrderRequest(),
    token: "INVALID_TOKEN" as TokenName,
  },
  invalidMode: {
    ...createValidOrderRequest(),
    mode: "INVALID_MODE" as any,
  },
  invalidAddress: {
    ...createValidOrderRequest(),
    user_address: INVALID_ADDRESS,
  },
};
