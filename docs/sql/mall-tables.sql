-- C 端商城 API 补充表（在 init.sql 执行后运行）
\connect fuudao_admin

-- 轮播图
CREATE TABLE IF NOT EXISTS banner (
    id          VARCHAR(64) PRIMARY KEY,
    image_url   TEXT NOT NULL,
    link_url    TEXT,
    sort        INTEGER NOT NULL DEFAULT 0,
    status      SMALLINT NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE banner IS '首页轮播图';

-- 购物车
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
);

CREATE INDEX IF NOT EXISTS idx_cart_item_user_id ON cart_item (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_cart_item_user_good_sku
    ON cart_item (user_id, good_id, COALESCE(sku_id, ''));

COMMENT ON TABLE cart_item IS '购物车';

-- 商品评论
CREATE TABLE IF NOT EXISTS bag_comment (
    id          VARCHAR(64) PRIMARY KEY,
    bag_id      VARCHAR(64) NOT NULL REFERENCES bag (id) ON DELETE CASCADE,
    user_id     VARCHAR(64) NOT NULL REFERENCES app_user (id),
    order_id    VARCHAR(64) REFERENCES orders (id),
    rating      SMALLINT NOT NULL DEFAULT 5,
    content     TEXT,
    images      JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bag_comment_bag_id ON bag_comment (bag_id);
CREATE INDEX IF NOT EXISTS idx_bag_comment_user_id ON bag_comment (user_id);

COMMENT ON TABLE bag_comment IS '商品评论';

-- 分类补充字段
ALTER TABLE bag_category ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE bag_category ADD COLUMN IF NOT EXISTS status SMALLINT NOT NULL DEFAULT 1;

-- 演示数据
INSERT INTO banner (id, image_url, link_url, sort, status) VALUES
    ('banner_001', '/logo.png', '/pages/goods/detail/index?id=bag_001', 1, 1),
    ('banner_002', '/logo.png', '/pages/category/index', 2, 1)
ON CONFLICT (id) DO NOTHING;

UPDATE bag_category SET icon = '', status = 1 WHERE id = 'cat_default';

INSERT INTO bag_comment (id, bag_id, user_id, order_id, rating, content, images) VALUES
    ('comment_001', 'bag_001', 'user_001', 'order_001', 5, '福袋很不错，抽到了喜欢的赏品！', '[]'),
    ('comment_002', 'bag_001', 'user_002', 'order_002', 4, '发货很快，包装完好。', '[]')
ON CONFLICT (id) DO NOTHING;
