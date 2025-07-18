import { type NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/universal_exchange",

  // High RPS Configuration
  min: 10, // Minimum connections always open
  max: 50, // Maximum connections (adjust based on your DB server)
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout for getting connection from pool

  // Query performance
  statement_timeout: 30000, // 30s statement timeout
  query_timeout: 15000, // 15s query timeout
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

export type Database = typeof db;

export default db;
