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
  } catch (error: unknown) {
    console.error('Migration failed:', error);
    const msg = error && typeof (error as { message?: string }).message === 'string'
      ? (error as { message: string }).message
      : '';
    const code = error && typeof (error as { code?: string }).code === 'string'
      ? (error as { code: string }).code
      : '';
    if (code === '28P01' || msg.includes('password authentication failed')) {
      console.error('\n---');
      console.error('Database authentication failed. DATABASE_URL (in this environment) has the wrong password or user.');
      console.error('  • Local: check .env.local');
      console.error('  • Production/CI: check Vercel env vars, GitHub Actions secrets, or wherever DATABASE_URL is set');
      console.error('  Supabase: Project Settings → Database → Connection string (URI). Replace [YOUR-PASSWORD] with the real DB password.');
      console.error('---\n');
    }
    failed = true;
  } finally {
    await client.end();
  }
  if (failed) process.exit(1);
}

runMigrations();
