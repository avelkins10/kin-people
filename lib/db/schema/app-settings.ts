import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Key-value app settings (e.g. onboarding metric config).
 * Keys are strings; values stored as text (JSON stringified when needed).
 */
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
