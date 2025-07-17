import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/universal_exchange',
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

export type Database = typeof db;

export default db; 