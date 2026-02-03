import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Supabase transaction pooler (port 6543) does not support prepared statements.
// Add ?pgbouncer=true and prepare: false so postgres.js disables them; max: 1 for serverless.
let connectionString = process.env.DATABASE_URL;
const isTransactionPooler =
  connectionString.includes(':6543') || connectionString.includes('pooler.supabase.com');
if (isTransactionPooler && !connectionString.includes('pgbouncer=true')) {
  connectionString += connectionString.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
}

const client = postgres(connectionString, {
  ssl: 'require',
  max: 1,
  prepare: false,
});
export const db = drizzle(client, { schema });

export type Database = typeof db;
