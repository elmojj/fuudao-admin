import { query } from '../db';

let migrated = false;

export async function ensureBagOrderTables() {
  if (migrated) return;
  migrated = true;

  await query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_no VARCHAR(64)`,
  );
  await query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS expire_at TIMESTAMPTZ`,
  );
  await query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ`,
  );
  await query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_kind VARCHAR(32) NOT NULL DEFAULT 'mall'`,
  );
  await query(
    `CREATE UNIQUE INDEX IF NOT EXISTS uk_orders_order_no ON orders (order_no) WHERE order_no IS NOT NULL`,
  );

  await query(
    `ALTER TABLE box_lock ADD COLUMN IF NOT EXISTS lock_kind SMALLINT NOT NULL DEFAULT 1`,
  );
  await query(
    `ALTER TABLE box_lock ADD COLUMN IF NOT EXISTS order_id VARCHAR(64)`,
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_box_lock_order_id ON box_lock (order_id)`,
  );

  await query(`
    CREATE TABLE IF NOT EXISTS bag_order_open (
      order_id    VARCHAR(64) PRIMARY KEY REFERENCES orders (id) ON DELETE CASCADE,
      result_json JSONB NOT NULL,
      opened_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
