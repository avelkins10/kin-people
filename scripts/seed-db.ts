/**
 * Seeds the database with roles, offices, pay plans, and commission rules.
 * Run after db:push and db:migrate on a fresh Supabase database so login/sync-user can find "Sales Rep" and other data.
 *
 * Usage: npm run db:seed
 */
import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import { seedDatabase } from "../lib/db/seed";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local and try again.");
  process.exit(1);
}

seedDatabase()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
