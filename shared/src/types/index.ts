import { OrderRequest, PairTokenName, QuoteRequest } from "universal-sdk";

export type PairToken = PairTokenName | `0x${string}`;

export type OrderStatus = "PENDING" | "PROCESSING" | "SUBMITTED" | "FAILED";
export interface Order {
  id: string;
  quote: OrderRequest;
  status: OrderStatus;
}
