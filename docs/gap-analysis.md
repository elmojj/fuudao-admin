# 查漏补缺：产品规格 vs 现有实现

## 1. 核心模型差异（最重要）

| 维度 | 现有实现 | 产品目标 |
|------|----------|----------|
| 玩法 | **福袋选盒**（电影选座：选格子号 → 付费 → 开该格奖品） | **概率 Gacha**（消耗次数 → 服务端 roll → 稀有度 + 保底） |
| 同步 | WebSocket + HTTP 锁盒房间 | 无需格子锁（或独立奖池库存） |
| 付费 | 微信支付按格子数计价 | 优先 **免费次数** 经济，付费为补充 |
| 结果 | 格子内奖品 predetermined | 权重随机 + pity 保底 |

**结论：** Gacha 抽赏需 **新建主流程**，不宜在选盒页上硬改。福袋选盒可作为第二种玩法并行保留。

---

## 2. 模块级差距矩阵

| 模块 | 产品要求 | 现状 | 状态 | 优先级 |
|------|----------|------|------|--------|
| **抽赏 Gacha** | 服务端概率、保底、单抽/十连、动画 | `src/server/gacha/draw.ts` + API | ✅ 后端完成 | P0 |
| **抽赏次数** | 登录/任务/分享/邀请/广告 | `draw-chance/*` + `task/*` | ✅ 后端完成 | P0 |
| **图鉴** | 点亮、套系、进度、加成 | `album/*` + `gacha_collection` | ✅ 后端完成 | P0 |
| **三榜** | 活跃/欧气/积分 Tab | `rank/list` + 10min 快照 | ✅ 后端完成 | P0 |
| **积分** | 获取、流水、累计 | `score/*` + draw 写入 | ✅ 后端完成 | P0 |
| **欧气值** | 按稀有度累计、欧气榜 | `week_max_lucky` + lucky 榜 | ✅ 后端完成 | P0 |
| **重复赏品** | 转碎片、兑换 | 碎片入账，兑换 API 未做 | ⚠️ 部分 | P2 |
| **任务** | 每日/分享/邀请/签到 | `task/list` + `task/claim` | ✅ 后端完成 | P0 |
| **称号** | 条件解锁、昵称旁展示 | `unlocked_titles` + `PUT user/title` | ✅ 后端完成 | P1 |
| **分享海报** | Canvas 生成、邀请码 | 无 onShareAppMessage | ❌ 缺失 | P1 |
| **埋点** | draw/task/rank 等事件 | 无 | ❌ 缺失 | P0 |
| **微信登录** | 静默/授权登录 | `pages/login` + API | ✅ 完成 | — |
| **商品列表** | 赏池/福袋入口 | `pages/home` + API | ✅ 完成 | — |
| **福袋选盒** | 选格锁盒 WS | `product/detail` + box* | ✅ 完成 | — |
| **福袋订单** | 创建/5min支付/开赏 | `bag-order` + pay 页 | ✅ 完成 | — |
| **赏柜** | 展示已拥有赏品 | `GET /album/items` 已就绪 | ⚠️ 前端待接 | P1 |
| **个人中心** | 次数/积分/称号 | `GET /user/profile` 已扩展 | ⚠️ 前端待接 | P1 |
| **传统电商** | 购物车/地址/发货订单 | 完整 | ✅ 完成 | 低优 |

---

## 3. 页面差距

| 页面 | 路由 | 应有 | 现有 |
|------|------|------|------|
| 抽赏主页 | `pages/gacha/index` | 盲盒机 UI、次数、单抽/十连 | ❌ 不存在 |
| 开箱结果 | `pages/gacha/result` 或组件 | 稀有度动画、分享引导 | ❌ 不存在 |
| 图鉴 | `pages/album/index` | 套系进度、灰显未收集 | ❌ 不存在 |
| 排行榜 | `pages/leaderboard/index` | 三 Tab + Top50/100 | ❌ 不存在 |
| 任务中心 | `pages/tasks/index` | 签到/分享/邀请 | ❌ 不存在 |
| 赏柜 | `pages/cabinet/index` | 真实奖品数据 | ⚠️ mock |
| 我的 | `pages/user/index` | 称号/次数/积分 API | ⚠️ mock |
| 福袋详情 | `pages/product/detail/index` | 选盒（保留） | ✅ |
| 支付 | `pages/order/pay/index` | 福袋支付（保留） | ✅ |

**建议 Tab 调整（Phase 1）：**

```
现：首页 | 赏柜 | 我的
议：抽赏 | 图鉴 | 排行 | 我的   （或 抽赏 | 赏柜 | 排行 | 我的）
```

---

## 4. 服务层差距

| 服务 | 应有职责 | 现有 |
|------|----------|------|
| `services/gacha.ts` | draw、pool、pity | ❌ |
| `services/draw-chance.ts` | 次数余额、consume、grant | ❌ |
| `services/task.ts` | 任务列表、领取 | ❌ |
| `services/album.ts` | 图鉴进度、套系 | ❌ |
| `services/leaderboard.ts` | 三榜查询 | ❌ |
| `services/points.ts` | 积分流水 | ❌ |
| `services/share.ts` | 海报、邀请码 | ❌ |
| `services/box*.ts` | 福袋锁盒 | ✅ 保留 |
| `services/bag-order.ts` | 福袋订单 | ✅ 保留 |
| `services/goods.ts` | 商品列表 | ✅ 可改为 pool 入口 |

---

## 5. 类型差距

| 类型 | 应有 | 现有 |
|------|------|------|
| `types/gacha.ts` | IRarity、IDrawResult、IPityState、IGachaItem | ❌ |
| `types/album.ts` | ICollection、ISeries | ❌ |
| `types/leaderboard.ts` | IRankEntry、RankType | ❌ |
| `types/task.ts` | ITask、TaskType | ❌ |
| `types/user-profile.ts` | 称号、次数、积分扩展 | ⚠️ 部分在 api.ts |
| `types/box.ts` | 选盒 | ✅ |
| `types/bag-order.ts` | 福袋订单 | ✅ |

---

## 6. API 差距

| 领域 | api.txt | api-gacha.md |
|------|---------|--------------|
| 商城/用户/地址/订单 | ✅ 已文档 | — |
| 福袋选盒 HTTP + WS | ✅ 已文档 | — |
| 福袋订单 create/pay/open | ✅ 已文档 | — |
| 抽赏 draw / pool / pity | ❌ | ✅ 已实现 |
| 选格开赏 bag/draw | ❌ | ✅ 已实现 |
| 次数 balance / grant | ❌ | ✅ 已实现 |
| 图鉴 collection | ❌ | ✅ 已实现 |
| 排行榜三榜 | ❌ | ✅ 已实现 |
| 任务 task | ❌ | ✅ 已实现 |
| 积分/碎片 | ❌ | ✅ 积分已实现，碎片兑换待 Phase 2 |
| 分享 invite | ❌ | ✅ 已实现 |

---

## 7. MVP 任务清单（对照可勾选）

### 后端

- [x] 设计 `items` 赏品表 + 10 条种子数据
- [x] 实现 `POST /gacha/draw`（权重随机 + SR/SSR 保底）
- [x] 实现次数模块（balance + 登录/分享发放）
- [x] 实现图鉴写入（draw 后 upsert collection）
- [x] 实现积分/欧气值写入 + 流水
- [x] 实现三榜定时快照（10 分钟）+ 查询 API
- [x] 实现任务 API（每日登录、分享领奖）
- [x] 扩展 `GET /user/profile`（次数、积分、称号）

### 前端

- [ ] 新建 `pages/gacha/` 抽赏页 + 基础动画
- [ ] 新建 `pages/album/` 图鉴页
- [ ] 新建 `pages/leaderboard/` 排行榜三 Tab
- [ ] 改造 `pages/user/` 接真实 profile
- [ ] 改造 `pages/cabinet/` 接图鉴/奖品 API
- [ ] 实现 `onShareAppMessage` + 分享领奖
- [ ] 接入核心埋点（draw_start、draw_result、task_*）
- [ ] 更新 TabBar 路由

### 已有可跳过

- [x] 微信登录
- [x] HTTP 请求层 + 401 跳转
- [x] 福袋选盒 + WS 同步
- [x] 福袋订单支付流程

---

## 8. 双玩法并存建议

```
首页
 ├─ 入口 A：免费抽赏（Gacha）→ pages/gacha/index     ← 新产品主线
 └─ 入口 B：福袋选盒（Fukubukuro）→ pages/product/detail  ← 已有，付费向
```

两者共用：登录、用户档案、赏柜/图鉴展示、部分赏品素材。
