import { PairTokenName, QuoteRequest } from "universal-sdk";

export type PairToken = PairTokenName | `0x${string}`;

export type OrderStatus = "PENDING" | "SUBMITTED" | "FAILED";
export interface Order {
  id: string;
  quote: QuoteRequest;
  status: OrderStatus;
} 