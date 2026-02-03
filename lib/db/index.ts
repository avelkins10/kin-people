import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// For v0 preview, we need to handle the case where postgres driver doesn't work
// In production, DATABASE_URL will be set and postgres driver will work
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

try {
  if (process.env.DATABASE_URL) {
    const client = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    db = drizzle(client, { schema });
  }
} catch (error) {
  console.error('Failed to initialize database connection:', error);
}

export { db };
export type Database = typeof db;
