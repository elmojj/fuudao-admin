-- 娱乐场抽盒机补充表（在 init.sql / mall-tables.sql 之后运行）
\connect fuudao_admin

ALTER TABLE bag ADD COLUMN IF NOT EXISTS play_mode VARCHAR(32) NOT NULL DEFAULT 'shake';
ALTER TABLE bag ADD COLUMN IF NOT EXISTS is_arcade BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bag ADD COLUMN IF NOT EXISTS is_home_featured BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS prize_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS rarity VARCHAR(32) NOT NULL DEFAULT 'normal';
ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS ownership VARCHAR(64) NOT NULL DEFAULT '';
ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS is_shareable BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS prize_category VARCHAR(64) NOT NULL DEFAULT '';
ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS unique_category VARCHAR(64) NOT NULL DEFAULT '';
ALTER TABLE bag_item ADD COLUMN IF NOT EXISTS prize_status SMALLINT NOT NULL DEFAULT 1;

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
);

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
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_box_lock_active
    ON box_lock (grab_bag_id, index_no) WHERE status = 1;

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
);

UPDATE bag SET is_arcade = TRUE, play_mode = 'shake', is_home_featured = TRUE WHERE id = 'bag_001';

UPDATE bag_item SET prize_score = 100, rarity = 'rare', prize_category = 'figure', unique_category = 'limited'
WHERE id = 'item_001';

UPDATE bag_item SET prize_score = 20, rarity = 'normal', prize_category = 'badge', unique_category = 'common'
WHERE id = 'item_002';
