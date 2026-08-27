-- 富游岛后台 - PostgreSQL 初始化脚本
-- 数据库: fuudao_admin
-- 端口: 5432

-- 断开已有连接后重建库（幂等）
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'fuudao_admin' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS fuudao_admin;
CREATE DATABASE fuudao_admin
  WITH ENCODING 'UTF8'
       LC_COLLATE = 'Chinese (Simplified)_China.936'
       LC_CTYPE = 'Chinese (Simplified)_China.936'
       TEMPLATE template0;

\connect fuudao_admin

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 赏品库存
-- ============================================================
CREATE TABLE stockpile (
    id                  VARCHAR(64) PRIMARY KEY,
    product_name        VARCHAR(255) NOT NULL,
    product_code        VARCHAR(128),
    product_photo       TEXT,
    price               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stockpile_count     INTEGER NOT NULL DEFAULT 0,
    stockpile_sale_total INTEGER NOT NULL DEFAULT 0,
    status              SMALLINT NOT NULL DEFAULT 1,  -- 1=启用 2=禁用
    create_time         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_time         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stockpile IS '赏品库存';
COMMENT ON COLUMN stockpile.status IS '1=启用 2=禁用';

CREATE INDEX idx_stockpile_product_name ON stockpile (product_name);
CREATE INDEX idx_stockpile_product_code ON stockpile (product_code);
CREATE INDEX idx_stockpile_status ON stockpile (status);

-- ============================================================
-- 2. 福袋分类
-- ============================================================
CREATE TABLE bag_category (
    id              VARCHAR(64) PRIMARY KEY,
    category_name   VARCHAR(128) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE bag_category IS '福袋分类';

CREATE UNIQUE INDEX uk_bag_category_name ON bag_category (category_name);

-- ============================================================
-- 3. 赏品等级
-- ============================================================
CREATE TABLE item_level (
    id          VARCHAR(64) PRIMARY KEY,
    level_name  VARCHAR(64) NOT NULL,
    level_type  SMALLINT NOT NULL DEFAULT 1,  -- 1=普通赏 2=保底赏 3=终极赏
    status      SMALLINT NOT NULL DEFAULT 1,  -- 1=启用 0=禁用
    sort        INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE item_level IS '赏品等级';
COMMENT ON COLUMN item_level.level_type IS '1=普通赏 2=保底赏 3=终极赏';

CREATE INDEX idx_item_level_type ON item_level (level_type);
CREATE INDEX idx_item_level_sort ON item_level (sort);

-- ============================================================
-- 4. 福袋（抽赏包）
-- ============================================================
CREATE TABLE bag (
    id                  VARCHAR(64) PRIMARY KEY,
    category_id         VARCHAR(64) NOT NULL REFERENCES bag_category (id),
    package_name        VARCHAR(255) NOT NULL,
    cover               TEXT,
    share_photo         TEXT,
    price               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    start_time          TIMESTAMPTZ,
    end_time            TIMESTAMPTZ,
    total_package       INTEGER NOT NULL DEFAULT 0,
    has_every_prize     BOOLEAN NOT NULL DEFAULT FALSE,
    every_prize_item_id VARCHAR(64),
    every_prize_count   INTEGER NOT NULL DEFAULT 0,
    has_last_prize      BOOLEAN NOT NULL DEFAULT FALSE,
    last_prize_item_id  VARCHAR(64),
    limit_buy           INTEGER NOT NULL DEFAULT 0,
    status              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE bag IS '福袋（抽赏包）';

CREATE INDEX idx_bag_category_id ON bag (category_id);
CREATE INDEX idx_bag_package_name ON bag (package_name);
CREATE INDEX idx_bag_status ON bag (status);
CREATE INDEX idx_bag_time_range ON bag (start_time, end_time);

-- ============================================================
-- 5. 福袋内赏品
-- ============================================================
CREATE TABLE bag_item (
    id              VARCHAR(64) PRIMARY KEY,
    grab_bag_id     VARCHAR(64) NOT NULL REFERENCES bag (id) ON DELETE CASCADE,
    item_name       VARCHAR(255) NOT NULL,
    level_id        VARCHAR(64) NOT NULL REFERENCES item_level (id),
    item_cover      TEXT,
    stock_id        VARCHAR(64) REFERENCES stockpile (id),
    total_count     INTEGER NOT NULL DEFAULT 0,
    send_count      INTEGER NOT NULL DEFAULT 0,
    surplus_count   INTEGER NOT NULL DEFAULT 0,
    refer_price     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock_price     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    prob_rate       NUMERIC(10, 4) NOT NULL DEFAULT 0,
    sort            INTEGER NOT NULL DEFAULT 0,
    ext_json        JSONB,
    status          SMALLINT NOT NULL DEFAULT 1,  -- 1=启用 2=禁用
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE bag_item IS '福袋内赏品';

CREATE INDEX idx_bag_item_grab_bag_id ON bag_item (grab_bag_id);
CREATE INDEX idx_bag_item_level_id ON bag_item (level_id);
CREATE INDEX idx_bag_item_stock_id ON bag_item (stock_id);
CREATE INDEX idx_bag_item_status ON bag_item (status);

-- 福袋保底赏/终极赏外键（bag_item 创建后补充）
ALTER TABLE bag
    ADD CONSTRAINT fk_bag_every_prize_item
        FOREIGN KEY (every_prize_item_id) REFERENCES bag_item (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_bag_last_prize_item
        FOREIGN KEY (last_prize_item_id) REFERENCES bag_item (id) ON DELETE SET NULL;

-- ============================================================
-- 6. C端用户
-- ============================================================
CREATE TABLE app_user (
    id              VARCHAR(64) PRIMARY KEY,
    phone_number    VARCHAR(32),
    nickname        VARCHAR(128),
    avatar          TEXT,
    appid           VARCHAR(64),
    openid          VARCHAR(128),
    unionid         VARCHAR(128),
    session_key     VARCHAR(256),
    access_token    TEXT,
    user_group_name VARCHAR(64),
    buy_amount_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    buy_total       INTEGER NOT NULL DEFAULT 0,
    reward_total    INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE app_user IS 'C端用户';

CREATE INDEX idx_app_user_phone ON app_user (phone_number);
CREATE INDEX idx_app_user_openid ON app_user (openid);
CREATE INDEX idx_app_user_unionid ON app_user (unionid);

-- ============================================================
-- 7. 用户收货地址
-- ============================================================
CREATE TABLE user_address (
    id              VARCHAR(64) PRIMARY KEY,
    user_id         VARCHAR(64) NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    consignee       VARCHAR(64) NOT NULL,
    phone_number    VARCHAR(32) NOT NULL,
    province        VARCHAR(64),
    city            VARCHAR(64),
    area            VARCHAR(64),
    address         VARCHAR(512) NOT NULL,
    zipcode         VARCHAR(16),
    is_default      SMALLINT NOT NULL DEFAULT 0,
    status          SMALLINT NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_address IS '用户收货地址';

CREATE INDEX idx_user_address_user_id ON user_address (user_id);

-- ============================================================
-- 8. 用户标签
-- ============================================================
CREATE TABLE user_tag (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(64) NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    cate        VARCHAR(64),
    cate_val    VARCHAR(128),
    tag_name    VARCHAR(128) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_tag IS '用户标签';

CREATE INDEX idx_user_tag_user_id ON user_tag (user_id);

-- ============================================================
-- 9. 快递公司
-- ============================================================
CREATE TABLE delivery (
    delivery_id     VARCHAR(64) PRIMARY KEY,
    delivery_name   VARCHAR(128) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE delivery IS '快递公司';

-- ============================================================
-- 10. 物流单
-- ============================================================
CREATE TABLE logistics (
    id                  VARCHAR(64) PRIMARY KEY,
    user_id             VARCHAR(64) NOT NULL REFERENCES app_user (id),
    order_ids           TEXT,
    index_ids           TEXT,
    tracking_number     VARCHAR(128),
    tracking_token      VARCHAR(256),
    delivery_id         VARCHAR(64) REFERENCES delivery (delivery_id),
    consignee           VARCHAR(64),
    phone_number        VARCHAR(32),
    province            VARCHAR(64),
    city                VARCHAR(64),
    area                VARCHAR(64),
    address             VARCHAR(512),
    zipcode             VARCHAR(16),
    price               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    transaction_id      VARCHAR(128),
    status              SMALLINT NOT NULL DEFAULT 2,  -- 2=申请发货 3=已发货 4=已签收
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE logistics IS '物流单';
COMMENT ON COLUMN logistics.status IS '2=申请发货 3=已发货 4=已签收';

CREATE INDEX idx_logistics_user_id ON logistics (user_id);
CREATE INDEX idx_logistics_status ON logistics (status);
CREATE INDEX idx_logistics_tracking_number ON logistics (tracking_number);
CREATE INDEX idx_logistics_delivery_id ON logistics (delivery_id);

-- ============================================================
-- 11. 订单
-- ============================================================
CREATE TABLE orders (
    id              VARCHAR(64) PRIMARY KEY,
    grab_bag_id     VARCHAR(64) NOT NULL REFERENCES bag (id),
    buy_user_id     VARCHAR(64) NOT NULL REFERENCES app_user (id),
    logistics_id    VARCHAR(64) REFERENCES logistics (id),
    transaction_id  VARCHAR(128),
    total_count     INTEGER NOT NULL DEFAULT 1,
    total_price     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    price           NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status          SMALLINT NOT NULL DEFAULT 1,
    grab_bag_index  JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE orders IS '订单';
COMMENT ON COLUMN orders.status IS '1=待支付 2=已支付 3=超时待退款 4=超时取消 5=申请发货 6=申请发货待付款 7=已发货 8=已退款 9=已完成';

CREATE INDEX idx_orders_grab_bag_id ON orders (grab_bag_id);
CREATE INDEX idx_orders_buy_user_id ON orders (buy_user_id);
CREATE INDEX idx_orders_logistics_id ON orders (logistics_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at);

-- ============================================================
-- 12. 中奖记录（抽赏索引）
-- ============================================================
CREATE TABLE grab_bag_index (
    id                  VARCHAR(64) PRIMARY KEY,
    grab_bag_id         VARCHAR(64) NOT NULL REFERENCES bag (id),
    grab_bag_item_id    VARCHAR(64) NOT NULL REFERENCES bag_item (id),
    user_id             VARCHAR(64) NOT NULL REFERENCES app_user (id),
    order_id            VARCHAR(64) REFERENCES orders (id),
    logistics_id        VARCHAR(64) REFERENCES logistics (id),
    index_no            INTEGER NOT NULL,
    status              SMALLINT NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE grab_bag_index IS '中奖记录（抽赏位置索引）';

CREATE INDEX idx_grab_bag_index_bag_id ON grab_bag_index (grab_bag_id);
CREATE INDEX idx_grab_bag_index_user_id ON grab_bag_index (user_id);
CREATE INDEX idx_grab_bag_index_order_id ON grab_bag_index (order_id);
CREATE INDEX idx_grab_bag_index_logistics_id ON grab_bag_index (logistics_id);

-- ============================================================
-- 13. 订单抽奖结果
-- ============================================================
CREATE TABLE order_lottery_result (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            VARCHAR(64) NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    grab_bag_item_id    VARCHAR(64) NOT NULL REFERENCES bag_item (id),
    grab_bag_index_id   VARCHAR(64) REFERENCES grab_bag_index (id),
    index_no            INTEGER NOT NULL,
    item_name           VARCHAR(255) NOT NULL,
    item_cover          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE order_lottery_result IS '订单抽奖结果';

CREATE INDEX idx_order_lottery_result_order_id ON order_lottery_result (order_id);
CREATE INDEX idx_order_lottery_result_item_id ON order_lottery_result (grab_bag_item_id);

-- ============================================================
-- 14. 后台管理员
-- ============================================================
CREATE TABLE system_user (
    id                  VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_name           VARCHAR(64) NOT NULL UNIQUE,
    password_hash       VARCHAR(256) NOT NULL,
    user_email          VARCHAR(128),
    user_phone          VARCHAR(32),
    user_sex            VARCHAR(8),
    department_id       VARCHAR(64),
    department_name     VARCHAR(128),
    status              SMALLINT NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE system_user IS '后台管理员';

-- ============================================================
-- 初始化基础数据
-- ============================================================
INSERT INTO delivery (delivery_id, delivery_name) VALUES
    ('SF', '顺丰速运'),
    ('YTO', '圆通速递'),
    ('ZTO', '中通快递'),
    ('STO', '申通快递'),
    ('YD', '韵达快递'),
    ('JD', '京东物流'),
    ('EMS', 'EMS');

INSERT INTO item_level (id, level_name, level_type, status, sort) VALUES
    ('level_normal', '普通赏', 1, 1, 1),
    ('level_every', '保底赏', 2, 1, 2),
    ('level_last', '终极赏', 3, 1, 3);

INSERT INTO bag_category (id, category_name) VALUES
    ('cat_default', '默认分类');

-- 默认管理员: admin / admin123 (bcrypt 需在应用层替换，此处仅占位)
INSERT INTO system_user (id, user_name, password_hash, user_email, department_name)
VALUES ('admin_001', 'admin', 'CHANGE_ME_IN_APP', 'admin@fuudao.cn', '系统管理部');
