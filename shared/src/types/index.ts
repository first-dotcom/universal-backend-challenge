import { OrderRequest } from "universal-sdk";

export type OrderStatus = "PENDING" | "PROCESSING" | "SUBMITTED" | "FAILED";
export interface Order {
  id: string;
  quote: OrderRequest;
  status: OrderStatus;
}
