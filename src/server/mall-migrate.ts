import { query } from './db';

let migrated = false;

export async function ensureMallTables() {
  if (migrated) return;
  migrated = true;

  await query(`
    CREATE TABLE IF NOT EXISTS banner (
      id          VARCHAR(64) PRIMARY KEY,
      image_url   TEXT NOT NULL,
      link_url    TEXT,
      sort        INTEGER NOT NULL DEFAULT 0,
      status      SMALLINT NOT NULL DEFAULT 1,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS cart_item (
      id              VARCHAR(64) PRIMARY KEY,
      user_id         VARCHAR(64) NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
      good_id         VARCHAR(64) NOT NULL REFERENCES bag (id) ON DELETE CASCADE,
      sku_id          VARCHAR(64),
      quantity        INTEGER NOT NULL DEFAULT 1,
      checked         BOOLEAN NOT NULL DEFAULT TRUE,
      specifications  JSONB,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS bag_comment (
      id          VARCHAR(64) PRIMARY KEY,
      bag_id      VARCHAR(64) NOT NULL REFERENCES bag (id) ON DELETE CASCADE,
      user_id     VARCHAR(64) NOT NULL REFERENCES app_user (id),
      order_id    VARCHAR(64) REFERENCES orders (id),
      rating      SMALLINT NOT NULL DEFAULT 5,
      content     TEXT,
      images      JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`ALTER TABLE bag_category ADD COLUMN IF NOT EXISTS icon TEXT`);
  await query(
    `ALTER TABLE bag_category ADD COLUMN IF NOT EXISTS status SMALLINT NOT NULL DEFAULT 1`,
  );

  const bannerCount = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM banner`,
  );
  if (Number(bannerCount.rows[0]?.count || 0) === 0) {
    await query(
      `INSERT INTO banner (id, image_url, link_url, sort, status) VALUES
        ('banner_001', '/logo.png', '', 1, 1),
        ('banner_002', '/logo.png', '', 2, 1)
       ON CONFLICT (id) DO NOTHING`,
    );
  }
}
