import { pgTable, text, timestamp, json, pgEnum, type PgEnum } from 'drizzle-orm/pg-core';

export const orderStatusEnum: PgEnum<['PENDING', 'PROCESSING', 'SUBMITTED', 'FAILED']> = pgEnum('order_status', ['PENDING', 'PROCESSING', 'SUBMITTED', 'FAILED'] as const);

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  quote: json('quote').notNull(),
  status: orderStatusEnum('status').notNull().default('PENDING'),
  externalOrderId: text('external_order_id'),
  transactionHash: text('transaction_hash'),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;