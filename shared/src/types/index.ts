export interface QuoteRequest {
  type: "BUY" | "SELL";
  token: string;
  pair_token: string;
  pair_token_amount: string;
  blockchain: string;
  user_address: string;
  slippage_bips: number;
}

export interface Order {
  id: string;
  quote: QuoteRequest;
  status: "PENDING" | "SUBMITTED" | "FAILED";
} 