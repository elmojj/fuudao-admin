-- 本地开发演示数据（在 init.sql 执行后运行）
\connect fuudao_admin

INSERT INTO stockpile (id, product_name, product_code, product_photo, price, stockpile_count, status)
VALUES
  ('stock_001', '初音未来手办', 'SKU001', '', 299.00, 100, 1),
  ('stock_002', '蕾姆徽章', 'SKU002', '', 39.00, 500, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_user (id, phone_number, nickname, avatar, user_group_name, buy_amount_total, buy_total, reward_total)
VALUES
  ('user_001', '13800138000', '测试用户A', '', '普通用户', 1288.50, 12, 8),
  ('user_002', '13900139000', '测试用户B', '', 'VIP', 5680.00, 45, 30)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_address (id, user_id, consignee, phone_number, province, city, area, address, is_default, status)
VALUES
  ('addr_001', 'user_001', '张三', '13800138000', '广东省', '深圳市', '南山区', '科技园南路1号', 1, 1),
  ('addr_002', 'user_002', '李四', '13900139000', '上海市', '上海市', '浦东新区', '陆家嘴环路100号', 1, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO bag (id, category_id, package_name, cover, price, start_time, end_time, total_package, status)
VALUES
  ('bag_001', 'cat_default', '春季限定福袋', '', 68.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', 100, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO bag_item (id, grab_bag_id, item_name, level_id, total_count, surplus_count, refer_price, prob_rate, status, sort)
VALUES
  ('item_001', 'bag_001', '初音未来手办', 'level_normal', 10, 10, 299.00, 5.00, 1, 1),
  ('item_002', 'bag_001', '蕾姆徽章', 'level_normal', 50, 50, 39.00, 20.00, 1, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, grab_bag_id, buy_user_id, total_count, total_price, price, status)
VALUES
  ('order_001', 'bag_001', 'user_001', 1, 68.00, 68.00, 2),
  ('order_002', 'bag_001', 'user_002', 2, 136.00, 68.00, 5)
ON CONFLICT (id) DO NOTHING;
