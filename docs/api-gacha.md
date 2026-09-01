# Gacha 抽赏 API 规范

> 基础路径：`/api/v1`  
> 认证：`Authorization: Bearer <token>`（标注「可匿名」的除外）  
> 响应格式：`{ code: 0, data: T, message: string }`  
> 现有商城/福袋接口见 `../api.txt`

---

## 两种玩法关系

| 维度 | 抽赏 Tab（盲盒机） | 选盒抽赏（福袋详情） |
|------|-------------------|---------------------|
| 入口 | `pages/gacha/index` | `pages/product/detail` |
| 操作 | 单抽 / 十连 | 选格子 → 开赏 |
| 随机方式 | 池内权重 + pity 保底 | 格子内**预定赏**（`bagId+boxNo` 映射） |
| 前置 | 无 | `POST /bag/box/lock` 锁格 |
| API | `POST /gacha/draw` | `POST /bag/draw` |
| 扣次 | `count`（1 或 10） | `boxNos.length`（每格 1 次） |
| 副作用 | 更新 pity 计数 | 更新 soldBoxes + WS `box:sold` |
| 共用 | `draw_chances`、图鉴、积分、三榜、`user/profile` | 同上 |

**付费降级路径**：选格后也可走 `bag/order/create` → 支付 → `open`（微信支付，不扣免费次数）。

---

## 通用类型

```typescript
type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';
type RankType = 'active' | 'lucky' | 'score';
type TaskType = 'login' | 'share' | 'invite' | 'checkin' | 'ad' | 'series_complete';

interface IGachaItem {
  itemId: string;
  name: string;
  rarity: Rarity;
  rarityScore: number;
  scoreValue: number;
  series: string;
  seriesTotal: number;
  image: string;
  animation: 'normal' | 'gold' | 'rainbow';
  dropRate?: number;        // 公示概率 %，仅展示
}

interface IPityState {
  drawsSinceSR: number;
  drawsSinceSSR: number;
  srPityAt: number;         // 30
  ssrPityAt: number;        // 100
}
```

---

## 一、抽赏模块

### 1.1 获取赏池信息

```
GET /api/v1/gacha/pool?poolId=default
```

**出参：**
```typescript
interface IGachaPoolResponse {
  poolId: string;
  name: string;
  description: string;
  coverImage: string;
  items: IGachaItem[];      // 赏品一览（含公示概率）
  rates: { rarity: Rarity; rate: number }[];
}
```

---

### 1.1.1 获取已启用赏池列表

```
GET /api/v1/gacha/pools
```

**出参：**
```typescript
interface IGachaPoolListResponse {
  pools: {
    poolId: string;
    name: string;
    enabled: boolean;
    sortOrder: number;  // 数值越大越靠前
  }[];
}
```

**示例：**
```json
{
  "code": 0,
  "data": {
    "pools": [
      { "poolId": "pool_1788252645194", "name": "测试1", "enabled": true, "sortOrder": 200 },
      { "poolId": "default", "name": "星际漫游赏池", "enabled": true, "sortOrder": 100 }
    ]
  }
}
```

---

### 1.2 获取保底进度

```
GET /api/v1/gacha/pity?poolId=default
```

**出参：** `data: IPityState`

---

### 1.3 执行抽赏（核心）

```
POST /api/v1/gacha/draw
```

**入参：**
```typescript
interface IDrawParams {
  poolId: string;
  count: 1 | 10;
}
```

**出参：**
```typescript
interface IDrawResponse {
  batchId: string;
  draws: {
    item: IGachaItem;
    isNew: boolean;
    isDuplicate: boolean;
    fragmentsGained: number;
    scoreGained: number;
    luckyGained: number;
  }[];
  pity: IPityState;
  balance: number;          // 剩余抽赏次数
  totalScore: number;       // 累计积分
}
```

**错误码：**

| code | message |
|------|---------|
| 40001 | 抽赏次数不足 |
| 40002 | 赏池不存在或已关闭 |
| 40003 | 赏池限时已结束 |
| 401 | 未授权 |

**服务端必须：**
- 事务内扣次数 → 随机 → 写 draw_logs → 更新 collections → 更新积分/欧气/保底
- 前端只播放动画，以本接口返回为准

---

### 1.4 选格开赏（福袋选盒模式）

```
POST /api/v1/bag/draw
```

> 与 `POST /gacha/draw` 共用 **抽赏次数** 经济；区别为本接口开**用户已选定的格子**，奖品来自福袋预分配，非池内权重随机。  
> 完整 HTTP 约定、错误码、WS 联动见 `../api.txt`「福袋选格抽赏 API」章节。

**入参：**
```typescript
interface IBagDrawParams {
  bagId: string;
  boxNos: number[];
}
```

**出参：**
```typescript
interface IBagDrawResult {
  batchId: string;
  bagId: string;
  boxNos: number[];
  balance: number;
  prizes: {
    boxNo: number;
    prizeName: string;
    prizeImage?: string;
    grade?: string;
    itemId?: string;
    rarity?: Rarity;
    isNew?: boolean;
    isDuplicate?: boolean;
    fragmentsGained?: number;
    scoreGained?: number;
    luckyGained?: number;
  }[];
  totalScore?: number;
}
```

**规则：**
- 每格消耗 **1 次** `draw_chances`
- `boxNos` 须为当前用户已通过 `POST /bag/box/lock` 锁定的格子
- 成功后：写 collections、积分/欧气、soldBoxes，WS 广播 `box:sold`
- 次数不足 → `40001`；未锁格 → `40005`

**前端：** `services/bag-draw.ts` → `pages/product/detail/index`

---

### 1.5 抽赏记录

```
GET /api/v1/gacha/logs?page=1&size=20
```

**出参：**
```typescript
{
  items: {
    id: string;
    item: IGachaItem;
    isDuplicate: boolean;
    createdAt: string;
  }[];
  total: number;
}
```

---

## 二、抽赏次数模块

### 2.1 查询次数余额

```
GET /api/v1/draw-chance/balance
```

**出参：**
```typescript
{ balance: number; todayUsed: number }
```

---

### 2.2 次数流水

```
GET /api/v1/draw-chance/logs?page=1&size=20
```

**出参：**
```typescript
{
  items: {
    delta: number;
    balance: number;
    source: string;
    createdAt: string;
  }[];
}
```

---

## 三、任务模块

### 3.1 任务列表

```
GET /api/v1/task/list
```

**出参：**
```typescript
{
  tasks: {
    type: TaskType;
    title: string;
    description: string;
    reward: number;
    progress: number;
    limit: number;
    status: 'available' | 'claimed' | 'locked';
  }[];
  checkin: {
    consecutiveDays: number;
    todayClaimed: boolean;
    weekRewardClaimed: boolean;
  };
}
```

**任务配置（MVP）：**

| type | reward | limit/日 |
|------|--------|----------|
| login | +2 | 1 |
| share | +1 | 3 |
| invite | +5 | 不限 |
| checkin | +1（第7天+5） | 1 |

---

### 3.2 领取任务奖励

```
POST /api/v1/task/claim
```

**入参：**
```typescript
{ type: TaskType; inviteCode?: string }
```

**出参：**
```typescript
{ reward: number; balance: number }
```

**规则：**
- `share`：需客户端先完成分享，服务端校验当日次数
- `invite`：新用户首次登录携带 inviteCode，双方各 +5

---

## 四、图鉴模块

### 4.1 图鉴总览

```
GET /api/v1/album/summary
```

**出参：**
```typescript
{
  totalItems: number;
  collectedCount: number;
  progress: number;           // 0-100
  completedSeries: string[];
  bonuses: {
    id: string;
    label: string;
    reward: string;
    claimed: boolean;
  }[];
}
```

---

### 4.2 图鉴详情（按套系）

```
GET /api/v1/album/series?series=星际漫游
```

**出参：**
```typescript
{
  series: string;
  total: number;
  collected: number;
  items: {
    item: IGachaItem;
    owned: boolean;
    count: number;
    firstAt?: string;
  }[];
}
```

---

### 4.3 我的赏柜（赏柜页）

```
GET /api/v1/album/items?page=1&size=50
```

**出参：**
```typescript
{
  items: {
    item: IGachaItem;
    count: number;
    obtainedAt: string;
  }[];
  total: number;
}
```

---

## 五、积分模块

### 5.1 积分余额

```
GET /api/v1/score/balance
```

**出参：**
```typescript
{
  totalScore: number;
  seasonScore: number;
  honorScore: number;
  seasonWeek: number;
}
```

---

### 5.2 积分流水

```
GET /api/v1/score/logs?page=1&size=20
```

---

## 六、排行榜模块

### 6.1 查询榜单

```
GET /api/v1/rank/list?type=active|lucky|score&page=1&size=50
```

**出参：**
```typescript
{
  type: RankType;
  periodKey: string;          // 2026W36 / season_1
  resetAt: string;            // 下次重置时间 ISO
  items: {
    rank: number;
    userId: string;
    nickname: string;
    avatar: string;
    title?: string;
    score: number;
  }[];
  myRank: {
    rank: number;
    score: number;
  } | null;
  snapshotAt: string;
}
```

**榜单说明：**

| type | 统计 | 重置 | 展示 |
|------|------|------|------|
| active | 本周抽赏次数 + 任务完成数 | 每周一 0:00 | Top 50 |
| lucky | 本周单次最高欧气值 | 每周一 0:00 | Top 50 |
| score | 赛季累计积分 | 4 周一赛季 | Top 100 |

---

## 七、用户档案扩展

### 7.1 获取用户档案（扩展）

```
GET /api/v1/user/profile
```

**出参扩展字段：**
```typescript
interface IUserProfileGacha {
  id: string;
  nickname: string;
  avatar: string;
  phone?: string;
  // --- 新增 ---
  drawChances: number;
  totalDraws: number;
  totalScore: number;
  weekMaxLucky: number;
  collectionCount: number;
  collectionTotal: number;
  equippedTitle?: string;
  titles: { id: string; name: string; unlockedAt: string }[];
  inviteCode: string;
}
```

---

### 7.2 佩戴称号

```
PUT /api/v1/user/title
```

**入参：** `{ titleId: string }`

---

## 八、分享 / 邀请

### 8.1 获取邀请信息

```
GET /api/v1/share/invite
```

**出参：**
```typescript
{
  inviteCode: string;
  invitePath: string;         // 小程序 path
  totalInvited: number;
  totalReward: number;
}
```

---

### 8.2 绑定邀请关系（新用户首次登录后）

```
POST /api/v1/share/bind
```

**入参：** `{ inviteCode: string }`

**出参：** `{ reward: number }`（双方各得次数）

---

## 九、碎片兑换（Phase 2）

### 9.1 碎片余额

```
GET /api/v1/fragments/balance
```

### 9.2 兑换抽赏

```
POST /api/v1/fragments/exchange
```

**入参：** `{ type: 'sr_guarantee', cost: 50 }`

---

## 十、WebSocket 扩展（可选）

现有 `/ws/bag?bagId=` 用于福袋选盒。Gacha 可选用独立频道：

```
ws://{host}/ws/gacha?poolId=default
```

| type | 说明 |
|------|------|
| `draw:notify` | 有人抽到 UR/SSR 全服广播（炫耀） |
| `rank:update` | 榜单变动（后期） |

MVP 可不做，靠 HTTP 轮询榜单快照即可。

---

## 十一、与福袋 API 的整合

| 场景 | 接口 | 写入 |
|------|------|------|
| Gacha 盲盒机（随机） | `POST /gacha/draw` | collections + score + rank + pity |
| 福袋选格（指定格子） | `POST /bag/draw` | 同上 + soldBoxes |
| 福袋付费开赏 | `POST /bag/order/:id/open` | 同上 + soldBoxes |
| 赏柜展示 | `GET /album/items` | 统一数据源 |
| 个人中心 | `GET /user/profile` | 统一统计 |

---

## 十二、埋点上报（可选服务端）

```
POST /api/v1/track/event
```

**入参：**
```typescript
{
  event: string;
  props?: Record<string, unknown>;
  ts?: number;
}
```

MVP 可用 `wx.reportAnalytics`，后期统一上报。

---

## 十三、联调检查清单

- [ ] 单抽扣 1 次，十连扣 10 次
- [ ] 选格 draw：N 格扣 N 次，开指定 boxNos
- [ ] 次数不足返回 40001
- [ ] 第 30 抽保底 SR+
- [ ] 第 100 抽保底 SSR+
- [ ] 新赏品入图鉴，重复给碎片
- [ ] 积分/欧气实时更新
- [ ] 登录任务每日限 1 次
- [ ] 分享任务每日限 3 次
- [ ] 三榜快照 10 分钟内更新
- [ ] 周一 0 点活跃/欧气榜重置
- [ ] draw 并发 100 QPS 无超扣次数
