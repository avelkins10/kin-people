import dotenv from "dotenv";
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(process.env.DATABASE_URL!, { max: 1, ssl: 'require' });
const db = drizzle(client);

async function runMigrations() {
  console.log('Running migrations...');
  let failed = false;
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    failed = true;
  } finally {
    await client.end();
  }
  if (failed) process.exit(1);
}

runMigrations();
