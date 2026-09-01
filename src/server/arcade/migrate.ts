import { query } from '../db';

let arcadeMigrated = false;

export async function ensureArcadeTables() {
  if (arcadeMigrated) return;
  arcadeMigrated = true;

  await query(`ALTER TABLE bag ADD COLUMN IF NOT EXISTS play_mode VARCHAR(32) NOT NULL DEFAULT 'shake'`);
  await query(`ALTER TABLE bag ADD COLUMN IF NOT EXISTS is_arcade BOOLEAN NOT NULL DEFAULT FALSE`);
  await query(`ALTER TABLE bag ADD COLUMN IF NOT EXISTS is_home_featured BOOLEAN NOT NULL DEFAULT FALSE`);

  await query(`ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS prize_score INTEGER NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS rarity VARCHAR(32) NOT NULL DEFAULT 'normal'`);
  await query(`ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS ownership VARCHAR(64) NOT NULL DEFAULT ''`);
  await query(`ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS is_shareable BOOLEAN NOT NULL DEFAULT FALSE`);
  await query(`ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS prize_category VARCHAR(64) NOT NULL DEFAULT ''`);
  await query(`ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS unique_category VARCHAR(64) NOT NULL DEFAULT ''`);
  await query(`ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS prize_status SMALLINT NOT NULL DEFAULT 1`);

  await query(`
    CREATE TABLE IF NOT EXISTS user_prize_cabinet (
      id                  VARCHAR(64) PRIMARY KEY,
      user_id             VARCHAR(64) NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
      grab_bag_id         VARCHAR(64) NOT NULL REFERENCES bag (id),
      grab_bag_item_id    VARCHAR(64) NOT NULL REFERENCES bag_item (id),
      order_id            VARCHAR(64) REFERENCES orders (id),
      grab_bag_index_id   VARCHAR(64),
      index_no            INTEGER,
      prize_name          VARCHAR(255) NOT NULL,
      prize_photo         TEXT,
      prize_score         INTEGER NOT NULL DEFAULT 0,
      rarity              VARCHAR(32) NOT NULL DEFAULT 'normal',
      ownership           VARCHAR(64) NOT NULL DEFAULT '',
      is_shareable        BOOLEAN NOT NULL DEFAULT FALSE,
      prize_status        SMALLINT NOT NULL DEFAULT 1,
      prize_category      VARCHAR(64) NOT NULL DEFAULT '',
      unique_category     VARCHAR(64) NOT NULL DEFAULT '',
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS box_lock (
      id              VARCHAR(64) PRIMARY KEY,
      grab_bag_id     VARCHAR(64) NOT NULL REFERENCES bag (id) ON DELETE CASCADE,
      index_no        INTEGER NOT NULL,
      user_id         VARCHAR(64) NOT NULL REFERENCES app_user (id),
      client_ip       VARCHAR(64),
      status          SMALLINT NOT NULL DEFAULT 1,
      locked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at      TIMESTAMPTZ NOT NULL,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uk_box_lock_active
      ON box_lock (grab_bag_id, index_no)
      WHERE status = 1
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS arcade_draw_job (
      id              VARCHAR(64) PRIMARY KEY,
      order_id        VARCHAR(64) NOT NULL REFERENCES orders (id),
      grab_bag_id     VARCHAR(64) NOT NULL REFERENCES bag (id),
      user_id         VARCHAR(64) NOT NULL REFERENCES app_user (id),
      index_no        INTEGER,
      status          SMALLINT NOT NULL DEFAULT 0,
      result_json     JSONB,
      error_message   TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      processed_at    TIMESTAMPTZ
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_prize_cabinet_user ON user_prize_cabinet (user_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_box_lock_bag ON box_lock (grab_bag_id, status)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_draw_job_bag_status ON arcade_draw_job (grab_bag_id, status, created_at)`);

  await query(`
    UPDATE bag SET is_arcade = TRUE, play_mode = 'shake', is_home_featured = TRUE
    WHERE id = 'bag_001'
  `);
}
