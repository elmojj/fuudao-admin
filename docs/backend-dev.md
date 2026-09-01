# 后端开发文档

> 适用：自建 Node/NestJS 或微信云开发  
> 现有基线：已有商城 API + 福袋选盒/订单（见 `../api.txt`）

---

## 1. 服务模块划分

```
backend/
├── modules/
│   ├── user/           # 登录、档案、称号（扩展）
│   ├── gacha/          # 【新建】抽赏核心
│   ├── draw-chance/    # 【新建】次数经济
│   ├── album/          # 【新建】图鉴
│   ├── points/         # 【新建】积分流水
│   ├── leaderboard/    # 【新建】三榜
│   ├── task/           # 【新建】任务
│   ├── share/          # 【新建】邀请码
│   ├── bag/            # 【已有】福袋选盒
│   └── order/          # 【已有】商城/福袋订单
├── jobs/
│   ├── rank-snapshot.job.ts    # 每 10 分钟
│   ├── order-expire.job.ts     # 福袋订单超时
│   └── week-reset.job.ts       # 周一 0 点活跃/欧气榜
└── ws/
    └── bag-room.gateway.ts     # 【已有】选盒 WS
```

---

## 2. 数据表设计

### 2.1 赏品表 `items`

```sql
CREATE TABLE items (
  item_id       VARCHAR(32) PRIMARY KEY,
  name          VARCHAR(128) NOT NULL,
  rarity        ENUM('N','R','SR','SSR','UR') NOT NULL,
  rarity_score  INT NOT NULL,          -- 欧气值
  score_value   INT NOT NULL,          -- 积分值
  series        VARCHAR(64) NOT NULL,
  series_total  INT DEFAULT 6,
  image         VARCHAR(512),
  animation     VARCHAR(16) DEFAULT 'normal',
  drop_weight   DECIMAL(8,4) NOT NULL, -- 权重
  pool_id       VARCHAR(32) NOT NULL,
  is_limited    TINYINT DEFAULT 0,
  limited_end   DATETIME NULL,
  status        TINYINT DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**MVP 概率权重（服务端配置）：**

| 稀有度 | 权重 | 欧气值 | 积分 |
|--------|------|--------|------|
| N | 55 | 1 | 10 |
| R | 30 | 3 | 30 |
| SR | 10 | 10 | 80 |
| SSR | 4 | 30 | 200 |
| UR | 1 | 100 | 500 |

---

### 2.2 用户扩展 `users`（在现有表上扩展）

```sql
ALTER TABLE users ADD COLUMN draw_chances INT DEFAULT 0;
ALTER TABLE users ADD COLUMN total_score BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN total_draws INT DEFAULT 0;
ALTER TABLE users ADD COLUMN week_draws INT DEFAULT 0;        -- 活跃榜
ALTER TABLE users ADD COLUMN week_task_points INT DEFAULT 0;
ALTER TABLE users ADD COLUMN week_max_lucky INT DEFAULT 0;    -- 欧气榜
ALTER TABLE users ADD COLUMN week_lucky_item_id VARCHAR(32);  -- 同分取最早 UR
ALTER TABLE users ADD COLUMN week_lucky_at DATETIME;
ALTER TABLE users ADD COLUMN season_score BIGINT DEFAULT 0;   -- 积分榜赛季
ALTER TABLE users ADD COLUMN honor_score BIGINT DEFAULT 0;    -- 荣誉继承
ALTER TABLE users ADD COLUMN equipped_title VARCHAR(64);
ALTER TABLE users ADD COLUMN invite_code VARCHAR(16) UNIQUE;
ALTER TABLE users ADD COLUMN invited_by VARCHAR(32);
ALTER TABLE users ADD COLUMN pity_sr_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN pity_ssr_count INT DEFAULT 0;
```

---

### 2.3 抽赏记录 `draw_logs`

```sql
CREATE TABLE draw_logs (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id       VARCHAR(32) NOT NULL,
  pool_id       VARCHAR(32) NOT NULL,
  item_id       VARCHAR(32) NOT NULL,
  rarity        VARCHAR(8) NOT NULL,
  rarity_score  INT NOT NULL,
  score_gained  INT NOT NULL,
  is_duplicate  TINYINT DEFAULT 0,
  fragments     INT DEFAULT 0,
  draw_type     ENUM('single','multi') DEFAULT 'single',
  batch_id      VARCHAR(32),           -- 十连同一 batch
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_time (user_id, created_at),
  INDEX idx_batch (batch_id)
);
```

---

### 2.4 图鉴 `collections`

```sql
CREATE TABLE collections (
  user_id       VARCHAR(32) NOT NULL,
  item_id       VARCHAR(32) NOT NULL,
  count         INT DEFAULT 1,
  first_at      DATETIME NOT NULL,
  updated_at    DATETIME ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE collection_series (
  user_id       VARCHAR(32) NOT NULL,
  series        VARCHAR(64) NOT NULL,
  completed_at  DATETIME NOT NULL,
  PRIMARY KEY (user_id, series)
);
```

---

### 2.5 积分流水 `score_logs`

```sql
CREATE TABLE score_logs (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id       VARCHAR(32) NOT NULL,
  delta         INT NOT NULL,
  balance       BIGINT NOT NULL,
  source        VARCHAR(32) NOT NULL,  -- draw/album_bonus/rank_reward
  ref_id        VARCHAR(64),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id, created_at)
);
```

---

### 2.6 次数流水 `chance_logs`

```sql
CREATE TABLE chance_logs (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id       VARCHAR(32) NOT NULL,
  delta         INT NOT NULL,
  balance       INT NOT NULL,
  source        VARCHAR(32) NOT NULL,  -- login/share/invite/ad/draw/consume
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.7 排行榜快照 `rank_snapshots`

```sql
CREATE TABLE rank_snapshots (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  rank_type     ENUM('active','lucky','score') NOT NULL,
  period_key    VARCHAR(16) NOT NULL,  -- 2026W36 / season_1
  user_id       VARCHAR(32) NOT NULL,
  rank          INT NOT NULL,
  score         BIGINT NOT NULL,
  nickname      VARCHAR(64),
  avatar        VARCHAR(512),
  title         VARCHAR(64),
  snapshot_at   DATETIME NOT NULL,
  INDEX idx_type_period (rank_type, period_key, rank)
);
```

---

### 2.8 任务记录 `task_logs`

```sql
CREATE TABLE task_logs (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id       VARCHAR(32) NOT NULL,
  task_type     VARCHAR(32) NOT NULL,
  task_date     DATE NOT NULL,         -- 每日任务去重
  reward        INT NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_task_date (user_id, task_type, task_date)
);
```

---

## 3. 抽赏核心逻辑（必须在服务端）

### 3.1 流程

```
POST /gacha/draw
  1. 鉴权 userId
  2. 校验 draw_chances >= count
  3. 事务开始
  4. 扣减次数 → 写 chance_logs
  5. 循环 count 次：
       a. 读取 pity_sr_count / pity_ssr_count
       b. 若 pity_ssr >= 100 → 强制 SSR+
       c. 否则若 pity_sr >= 30 → 强制 SR+
       d. 否则按权重随机（排除已下架/限时过期）
       e. 写 draw_logs
       f. upsert collections（重复则 fragments++）
       g. 加积分/欧气 → score_logs
       h. 更新 week_max_lucky（若本次 rarity_score 更高）
       i. 更新 pity 计数（出 SR+ 则 sr 归零；出 SSR+ 则 ssr 归零）
  6. 更新 users 统计字段
  7. 事务提交
  8. 返回 IDrawResult
```

### 3.2 权重随机（伪代码）

```typescript
function rollItem(poolId: string, forceMinRarity?: Rarity): Item {
  const items = getActiveItems(poolId);
  let candidates = items;
  if (forceMinRarity) {
    candidates = items.filter(i => rarityRank(i.rarity) >= rarityRank(forceMinRarity));
  }
  const totalWeight = candidates.reduce((s, i) => s + i.dropWeight, 0);
  let r = Math.random() * totalWeight;
  for (const item of candidates) {
    r -= item.dropWeight;
    if (r <= 0) return item;
  }
  return candidates[candidates.length - 1];
}
```

**严禁在前端计算随机结果。**

### 3.3 选格开赏 `POST /bag/draw`

```
POST /bag/draw
  1. 鉴权 userId
  2. 校验 draw_chances >= boxNos.length
  3. 校验每个 boxNo：未 sold、lock.userId === userId
  4. 事务开始
  5. 扣减 boxNos.length 次 → 写 chance_logs（source=bag_draw）
  6. 对每个 boxNo：
       a. 读取福袋格子预分配奖品（非权重 roll）
       b. 写 draw_logs（draw_type=bag_box, meta={ bagId, boxNo }）
       c. upsert collections（重复则 fragments++）
       d. 加积分/欧气
  7. boxNos → soldBoxes，清除 locks
  8. 更新 users 统计（week_draws 等）
  9. 事务提交
  10. WS 广播 box:sold
  11. 返回 IBagDrawResult（含 balance、prizes）
```

**与 `/gacha/draw` 差异：**

| 项 | `/gacha/draw` | `/bag/draw` |
|----|---------------|-------------|
| 入参 | poolId + count | bagId + boxNos |
| 随机 | 权重 + pity 保底 | 无，开格子内预定赏 |
| 扣次 | count（1 或 10） | boxNos.length |
| 副作用 | 更新 pity | 更新 soldBoxes + WS |

**不触发 Gacha pity 计数**（可选产品规则：若需统一保底，在 PRD 中单独定义）。

---

## 4. 次数经济

| 来源 | 次数 | 频次 | 实现要点 |
|------|------|------|----------|
| 每日登录 | +2 | 日 1 次 | task_logs type=login |
| 连续签到 7 天 | +5 | 周 1 次 | 独立 checkin 表 |
| 分享结果 | +1 | 日限 3 | 客户端 share 回调 + 服务端校验 |
| 邀请新用户 | +5 | 不限 | invite_code 绑定，双方各得 |
| 浏览广告 | +1 | 日限 2 | Phase 3 激励视频回调 |
| 图鉴集齐套系 | +3 | 每套 1 次 | collection_series 触发 |
| 抽赏消耗 | -1 / -10 | — | gacha/draw 事务内扣减 |
| 选格开赏 | -N（每格 1 次） | — | bag/draw 事务内扣减 |

```typescript
async function grantChances(userId: string, delta: number, source: string) {
  // 事务：UPDATE users SET draw_chances = draw_chances + delta
  // INSERT chance_logs
}
```

---

## 5. 排行榜

### 5.1 计算规则

| 榜 | 公式 | 重置 |
|----|------|------|
| 活跃榜 | `week_draws + week_task_points` | 每周一 0:00 |
| 欧气榜 | `week_max_lucky`（同分取最早达成 UR 的时间） | 每周一 0:00 |
| 积分榜 | `season_score`（累计，赛季末 20% 转 honor_score） | 每 4 周赛季 |

### 5.2 MVP 实现：定时任务

```typescript
// 每 10 分钟 cron
async function snapshotRanks() {
  const periodKey = getWeekKey(); // 2026W36
  const activeTop = await db.query(`
    SELECT user_id, (week_draws + week_task_points) AS score, nickname, avatar
    FROM users ORDER BY score DESC LIMIT 50
  `);
  // bulk insert rank_snapshots rank_type='active'
  // 同理 lucky、score
}
```

### 5.3 后期：Redis Sorted Set

```
ZINCRBY rank:active:2026W36 1 {userId}
ZADD rank:lucky:2026W36 {score} {userId}   // 需自定义 score= lucky*1e10 - timestamp
ZINCRBY rank:score:season_1 100 {userId}
```

---

## 6. 图鉴加成（draw 后 / 定时检查）

| 条件 | 奖励 |
|------|------|
| 收集满 10 种 | 积分 +100 |
| 收集满 30 种 | 积分 +500 |
| 集齐一套 | 积分 +300，次数 +3 |
| 全图鉴 | 称号「收藏大师」 |

```typescript
async function checkAlbumBonuses(userId: string) {
  const count = await countDistinctItems(userId);
  // 幂等发放，写 score_logs source=album_bonus
}
```

---

## 7. 重复赏品 → 碎片（Phase 2）

```typescript
// draw 时 is_duplicate=true
const fragmentsMap = { N: 1, R: 3, SR: 10, SSR: 30, SSR: 100 };
// 50 碎片 = 1 次 SR 保底抽（独立 API）
```

---

## 8. 称号系统

| 称号 ID | 条件 |
|---------|------|
| newbie | 注册 |
| try_10 | 累计 10 抽 |
| rank_active_1 | 活跃榜周榜第 1 |
| rank_lucky_1 | 欧气榜周榜第 1 |
| rank_score_10 | 积分榜赛季前 10 |
| album_master | 全图鉴 |

存储：`users.unlocked_titles JSON` + `equipped_title`

---

## 9. 定时任务清单

| 任务 | Cron | 说明 |
|------|------|------|
| rank-snapshot | `*/10 * * * *` | 三榜快照 |
| week-reset | `0 0 * * 1` | 活跃/欧气 week_* 清零 |
| season-settle | 每 4 周 | 积分 20% 转 honor |
| bag-order-expire | `* * * * *` | 福袋订单 5min 超时（已有） |
| lock-ttl | `* * * * *` | 选盒锁 TTL 释放（已有） |

---

## 10. 与现有福袋模块关系

| 模块 | 关系 |
|------|------|
| `bag/box/lock` | 选盒锁格，draw 前必须 lock |
| `bag/draw` | **选格次数开赏**，每格 1 次，开预定奖品 |
| `bag/order/create` | 付费降级路径，微信支付开赏 |
| `gacha/draw` | 盲盒机随机抽，count=1\|10 |
| `collections` | **共用**，三种开赏都写入 |
| `users.total_score` | **共用** |

三种开赏成功后均应：
1. 写入 `collections`
2. 增加积分/欧气
3. 更新榜单统计字段
4. 选格/付费路径额外更新 `soldBoxes` 并 WS 广播

---

## 11. 安全与防刷

| 风险 | 措施 |
|------|------|
| 伪造 draw 结果 | 仅服务端随机 |
| 刷分享次数 | 日限 + 服务端记录 openId |
| 刷邀请 | 新用户必须首次登录 + 设备指纹（可选） |
| 并发扣次数 | 数据库事务 + 行锁 `SELECT ... FOR UPDATE` |
| 概率审计 | draw_logs 全量留痕 |

---

## 12. 后端开发顺序（推荐）

```
Week 1
  items 种子数据 + pool API
  draw API（权重 + 保底）
  draw_chances + login 任务

Week 2
  collections + album API
  score_logs + profile 扩展
  task API（share/invite）

Week 3
  rank snapshot job + leaderboard API
  称号检查 job
  与前端联调 + 压测 draw 并发
```

---

## 13. 环境配置

```env
# 新增
GACHA_SR_PITY=30
GACHA_SSR_PITY=100
RANK_SNAPSHOT_INTERVAL=600
SCORE_SEASON_WEEKS=4
SCORE_INHERIT_RATIO=0.2
```

现有：
```env
API_BASE_URL=http://124.222.187.176:3001
WS_BAG_PATH=/ws/bag
BAG_ORDER_PAY_TIMEOUT_MS=300000
```
