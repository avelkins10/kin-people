import { pgTable, uuid, varchar, text, decimal, date, boolean, jsonb, timestamptz, index } from 'drizzle-orm/pg-core';
import { people } from './people';
import { offices } from './offices';
import { orgSnapshots } from './org-snapshots';

/**
 * Deals table with Setter/Closer commission model.
 * 
 * Each deal has both a setter_id and closer_id, both required.
 * is_self_gen is a computed boolean flag (setter_id == closer_id) stored for query performance.
 * 
 * The Setter/Closer model allows for:
 * - Split commissions between setter and closer
 * - Self-generated deals (setter and closer are the same person)
 * - Different commission rules for setters vs closers
 * - Override calculations based on both setter and closer hierarchies
 */
export const deals = pgTable(
  'deals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // External ID
    quickbaseId: varchar('quickbase_id', { length: 100 }).unique(),
    // Rep assignment (Setter/Closer model)
    setterId: uuid('setter_id').references(() => people.id).notNull(),
    closerId: uuid('closer_id').references(() => people.id).notNull(),
    isSelfGen: boolean('is_self_gen').notNull().default(false), // Computed: setter_id == closer_id
    officeId: uuid('office_id').references(() => offices.id),
    // Customer info
    customerName: varchar('customer_name', { length: 200 }),
    customerAddress: text('customer_address'),
    customerEmail: varchar('customer_email', { length: 255 }),
    customerPhone: varchar('customer_phone', { length: 20 }),
    // Deal details
    dealType: varchar('deal_type', { length: 50 }).notNull(), // 'solar', 'hvac', 'roofing'
    systemSizeKw: decimal('system_size_kw', { precision: 10, scale: 3 }), // for solar
    ppw: decimal('ppw', { precision: 10, scale: 4 }), // price per watt for solar
    dealValue: decimal('deal_value', { precision: 12, scale: 2 }).notNull(),
    // Dates
    saleDate: date('sale_date'),
    closeDate: date('close_date'),
    installDate: date('install_date'),
    ptoDate: date('pto_date'),
    // Status
    status: varchar('status', { length: 50 }).default('sold'), // 'sold', 'pending', 'permitted', 'scheduled', 'installed', 'pto', 'complete', 'cancelled'
    // Org snapshot at time of close (for commission calc)
    orgSnapshotId: uuid('org_snapshot_id').references(() => orgSnapshots.id),
    // Metadata
    metadata: jsonb('metadata').default('{}'),
    // Timestamps
    createdAt: timestamptz('created_at').defaultNow(),
    updatedAt: timestamptz('updated_at').defaultNow(),
  },
  (table) => ({
    idxDealsSetter: index('idx_deals_setter').on(table.setterId),
    idxDealsCloser: index('idx_deals_closer').on(table.closerId),
    idxDealsSelfGen: index('idx_deals_self_gen').on(table.isSelfGen),
    idxDealsOffice: index('idx_deals_office').on(table.officeId),
    idxDealsStatus: index('idx_deals_status').on(table.status),
    idxDealsType: index('idx_deals_type').on(table.dealType),
    idxDealsCloseDate: index('idx_deals_close_date').on(table.closeDate),
    idxDealsQuickbase: index('idx_deals_quickbase').on(table.quickbaseId),
  })
);

export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
