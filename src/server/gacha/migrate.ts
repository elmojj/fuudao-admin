import { query } from '../db';

let migrated = false;

const SEED_ITEMS = [
  { id: 'N_001', name: '星际贴纸·蓝', rarity: 'N', score: 1, points: 10, series: '星际漫游', weight: 14 },
  { id: 'N_002', name: '星际贴纸·紫', rarity: 'N', score: 1, points: 10, series: '星际漫游', weight: 14 },
  { id: 'N_003', name: '星际徽章·小', rarity: 'N', score: 1, points: 10, series: '星际漫游', weight: 14 },
  { id: 'N_004', name: '星尘挂件', rarity: 'N', score: 1, points: 10, series: '星际漫游', weight: 13 },
  { id: 'R_001', name: '宇航员钥匙扣', rarity: 'R', score: 3, points: 30, series: '星际漫游', weight: 10 },
  { id: 'R_002', name: '星云马克杯', rarity: 'R', score: 3, points: 30, series: '星际漫游', weight: 10 },
  { id: 'R_003', name: '探索者帆布袋', rarity: 'R', score: 3, points: 30, series: '星际漫游', weight: 10 },
  { id: 'SR_001', name: '星际漫游·手办', rarity: 'SR', score: 10, points: 80, series: '星际漫游', weight: 5 },
  { id: 'SR_002', name: '银河灯效摆件', rarity: 'SR', score: 10, points: 80, series: '星际漫游', weight: 5 },
  { id: 'SSR_001', name: '星际漫游·限定款', rarity: 'SSR', score: 30, points: 200, series: '星际漫游', weight: 4 },
  { id: 'UR_001', name: '星际漫游·典藏版', rarity: 'UR', score: 100, points: 500, series: '星际漫游', weight: 1 },
];

export async function ensureGachaTables() {
  if (migrated) return;
  migrated = true;

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_pool (
      pool_id     VARCHAR(32) PRIMARY KEY,
      name        VARCHAR(128) NOT NULL,
      description TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      sort        INTEGER NOT NULL DEFAULT 0,
      status      SMALLINT NOT NULL DEFAULT 1,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(
    `ALTER TABLE gacha_pool ADD COLUMN IF NOT EXISTS sort INTEGER NOT NULL DEFAULT 0`,
  );

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_item (
      item_id       VARCHAR(32) PRIMARY KEY,
      name          VARCHAR(128) NOT NULL,
      rarity        VARCHAR(8) NOT NULL,
      rarity_score  INTEGER NOT NULL,
      score_value   INTEGER NOT NULL,
      series        VARCHAR(64) NOT NULL,
      series_total  INTEGER NOT NULL DEFAULT 6,
      image         TEXT DEFAULT '',
      animation     VARCHAR(16) NOT NULL DEFAULT 'normal',
      drop_weight   NUMERIC(10,4) NOT NULL,
      pool_id       VARCHAR(32) NOT NULL REFERENCES gacha_pool (pool_id),
      is_limited    BOOLEAN NOT NULL DEFAULT FALSE,
      limited_end   TIMESTAMPTZ,
      status        SMALLINT NOT NULL DEFAULT 1,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS draw_chances INTEGER NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS total_score BIGINT NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS season_score BIGINT NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS honor_score BIGINT NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS total_draws INTEGER NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS week_draws INTEGER NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS week_task_points INTEGER NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS week_max_lucky INTEGER NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS week_lucky_at TIMESTAMPTZ`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS fragments INTEGER NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS pity_sr_count INTEGER NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS pity_ssr_count INTEGER NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS equipped_title VARCHAR(64)`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS unlocked_titles JSONB NOT NULL DEFAULT '[]'`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS invite_code VARCHAR(16)`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS invited_by VARCHAR(64)`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS checkin_streak INTEGER NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS last_checkin_date DATE`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS week_key VARCHAR(16) NOT NULL DEFAULT ''`);
  await query(`ALTER TABLE app_user ADD COLUMN IF NOT EXISTS season_key VARCHAR(16) NOT NULL DEFAULT 'season_1'`);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uk_app_user_invite_code
      ON app_user (invite_code) WHERE invite_code IS NOT NULL
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_draw_log (
      id            BIGSERIAL PRIMARY KEY,
      user_id       VARCHAR(64) NOT NULL REFERENCES app_user (id),
      pool_id       VARCHAR(32) NOT NULL,
      item_id       VARCHAR(32) NOT NULL,
      rarity        VARCHAR(8) NOT NULL,
      rarity_score  INTEGER NOT NULL,
      score_gained  INTEGER NOT NULL,
      is_duplicate  BOOLEAN NOT NULL DEFAULT FALSE,
      fragments     INTEGER NOT NULL DEFAULT 0,
      draw_type     VARCHAR(16) NOT NULL DEFAULT 'single',
      batch_id      VARCHAR(64),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_gacha_draw_user ON gacha_draw_log (user_id, created_at DESC)`);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_collection (
      user_id    VARCHAR(64) NOT NULL REFERENCES app_user (id),
      item_id    VARCHAR(32) NOT NULL,
      count      INTEGER NOT NULL DEFAULT 1,
      first_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, item_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_collection_series (
      user_id      VARCHAR(64) NOT NULL REFERENCES app_user (id),
      series       VARCHAR(64) NOT NULL,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, series)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_score_log (
      id         BIGSERIAL PRIMARY KEY,
      user_id    VARCHAR(64) NOT NULL REFERENCES app_user (id),
      delta      INTEGER NOT NULL,
      balance    BIGINT NOT NULL,
      source     VARCHAR(32) NOT NULL,
      ref_id     VARCHAR(64),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_chance_log (
      id         BIGSERIAL PRIMARY KEY,
      user_id    VARCHAR(64) NOT NULL REFERENCES app_user (id),
      delta      INTEGER NOT NULL,
      balance    INTEGER NOT NULL,
      source     VARCHAR(32) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_task_log (
      id         BIGSERIAL PRIMARY KEY,
      user_id    VARCHAR(64) NOT NULL REFERENCES app_user (id),
      task_type  VARCHAR(32) NOT NULL,
      task_date  DATE NOT NULL,
      reward     INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_gacha_task_user_type_date
      ON gacha_task_log (user_id, task_type, task_date)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gacha_rank_snapshot (
      id          BIGSERIAL PRIMARY KEY,
      rank_type   VARCHAR(16) NOT NULL,
      period_key  VARCHAR(16) NOT NULL,
      user_id     VARCHAR(64) NOT NULL,
      rank        INTEGER NOT NULL,
      score       BIGINT NOT NULL,
      nickname    VARCHAR(128),
      avatar      TEXT,
      title       VARCHAR(64),
      snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_gacha_rank_type_period
      ON gacha_rank_snapshot (rank_type, period_key, rank)
  `);

  await query(`
    INSERT INTO gacha_pool (pool_id, name, description, cover_image, sort, status)
    VALUES ('default', '星际漫游赏池', '免费抽盲盒，集图鉴冲三榜', '/logo.png', 100, 1)
    ON CONFLICT (pool_id) DO NOTHING
  `);

  for (const item of SEED_ITEMS) {
    const anim =
      item.rarity === 'UR' || item.rarity === 'SSR'
        ? 'rainbow'
        : item.rarity === 'SR'
          ? 'gold'
          : 'normal';
    await query(
      `INSERT INTO gacha_item
       (item_id, name, rarity, rarity_score, score_value, series, series_total,
        image, animation, drop_weight, pool_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'default',1)
       ON CONFLICT (item_id) DO NOTHING`,
      [
        item.id,
        item.name,
        item.rarity,
        item.score,
        item.points,
        item.series,
        6,
        '',
        anim,
        item.weight,
      ],
    );
  }
}
