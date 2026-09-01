# 后台数据管理页面改造开发方案

> 版本：v1.0  
> 日期：2026-09-01  
> 关联文档：`api-gacha.md`、`backend-dev.md`、`gap-analysis.md`  
> 目标：支撑 **Gacha 盲盒抽赏** 与 **福袋选格开赏** 双玩法的数据运营与监控

---

## 1. 背景与目标

### 1.1 业务背景

C 端已上线两套并行玩法，共用次数经济与图鉴/积分/三榜：

| 玩法 | C 端入口 | C 端 API | 后台管理诉求 |
|------|----------|----------|--------------|
| **盲盒机抽赏** | 抽赏 Tab | `POST /gacha/draw` | 赏池、赏品、概率、保底配置 |
| **福袋选格开赏** | 福袋详情 | `POST /bag/draw` | 福袋格子、赏品权重、锁盒/售出状态 |
| **付费开赏（保留）** | 支付页 | `bag/order/*` | 订单、开赏记录（已有） |

### 1.2 改造目标

1. **新增** Gacha 运营模块：赏池、赏品、抽赏记录、排行榜快照、任务配置
2. **改造** 现有福袋/用户/概览页面，展示 Gacha 扩展字段
3. **统一** 后台 Admin API（`/features/v1`）与 C 端 Mall API（`/api/v1`）的数据源
4. **可运营**：支持赏品上下架、概率调整、手动补发次数、榜单核查

### 1.3 不在本期范围

- 小程序前端页面（另立文档）
- 碎片兑换后台（Phase 2）
- Canvas 分享海报配置
- 实时 Redis 榜单（MVP 用快照表只读）

---

## 2. 现状盘点

### 2.1 已有后台页面

| 模块 | 路由 | 页面文件 | 后端 API | 状态 |
|------|------|----------|----------|------|
| 数据概览 | `/panel/dashboard` | `panel/dashboard.tsx` | 无 | ⚠️ 占位 |
| 赏品库存 | `/lotteryManagement/lotteryList` | `lottery-list.tsx` | `item/list`（stockpile） | ✅ |
| 福袋列表 | `/lotteryManagement/bagList` | `bagList.tsx` | `bag/list` | ✅ |
| 创建/编辑福袋 | `/lotteryManagement/createBag` | `create-bag.tsx` | `bag/createOrUpdate` | ✅ |
| 福袋类别 | `/lotteryManagement/bagCategoryList` | `bagCategoryList.tsx` | `bag_category/*` | ✅ |
| 赏品等级 | `/lotteryManagement/lotteryLevelList` | `lottery-level.tsx` | `item_level/*` | ✅ |
| 订单列表 | `/orderManagement/orderList` | `order-list.tsx` | `order/list` | ✅ |
| 用户列表 | `/userManagement/userList` | `user-list.tsx` | `user/list` | ⚠️ 无 Gacha 字段 |
| 用户详情 | `/userManagement/userDetail` | `user-detail.tsx` | `user/get` | ⚠️ 无 Gacha 字段 |
| 物流列表 | `/logisticManagement/logisticList` | `logistic-list` | `logistics/*` | ✅ |

### 2.2 已有但无后台入口的数据

| 数据表 | C 端已用 | 后台管理 |
|--------|----------|----------|
| `gacha_pool` | ✅ | ❌ |
| `gacha_item` | ✅ | ❌ |
| `gacha_draw_log` | ✅ | ❌ |
| `gacha_chance_log` | ✅ | ❌ |
| `gacha_score_log` | ✅ | ❌ |
| `gacha_task_log` | ✅ | ❌ |
| `gacha_rank_snapshot` | ✅ | ❌ |
| `gacha_collection` | ✅ | ❌ |
| `box_lock` | ✅ | ❌ |
| `grab_bag_index`（选格/付费开赏） | ✅ | ❌ |
| `bag_order_open` | ✅ | ❌ |

### 2.3 菜单配置位置

- 侧边栏：`src/app/layout/defaultProps.tsx`
- 页面路由：`app/(admin)/**/page.tsx` → 引用 `src/app/pages/**`
- Admin API 注册：`src/server/dispatch.ts`（`/features/v1/*`）

---

## 3. 信息架构（菜单改造）

### 3.1 改造后菜单结构

```
数据概览                    /panel/dashboard
│
├─ 抽赏运营（新建一级）      /gachaManagement
│   ├─ 赏池管理              /gachaManagement/poolList
│   ├─ 赏品管理              /gachaManagement/itemList
│   ├─ 抽赏记录              /gachaManagement/drawLogList
│   ├─ 次数流水              /gachaManagement/chanceLogList
│   ├─ 积分流水              /gachaManagement/scoreLogList
│   ├─ 排行榜快照            /gachaManagement/rankSnapshotList
│   └─ 任务记录              /gachaManagement/taskLogList
│
├─ 赏品管理（原 lotteryManagement，重命名）
│   ├─ 库存赏品（原赏品库存）  /lotteryManagement/lotteryList
│   ├─ 福袋列表              /lotteryManagement/bagList
│   ├─ 福袋详情/格子（新建）   /lotteryManagement/bagDetail?id=
│   ├─ 福袋类别              /lotteryManagement/bagCategoryList
│   ├─ 赏品等级              /lotteryManagement/lotteryLevelList
│   └─ 选格开赏记录（新建）    /lotteryManagement/bagDrawLogList
│
├─ 订单管理                  /orderManagement/orderList
├─ 物流管理                  /logisticManagement/logisticList
└─ 用户管理
    ├─ 用户列表              /userManagement/userList
    └─ 用户详情（增强）       /userManagement/userDetail
```

### 3.2 `defaultProps.tsx` 变更示例

```tsx
{
  name: '抽赏运营',
  icon: <GiftOutlined />,
  path: '/gachaManagement',
  routes: [
    { path: '/gachaManagement/poolList', name: '赏池管理' },
    { path: '/gachaManagement/itemList', name: '赏品管理' },
    { path: '/gachaManagement/drawLogList', name: '抽赏记录' },
    { path: '/gachaManagement/chanceLogList', name: '次数流水' },
    { path: '/gachaManagement/scoreLogList', name: '积分流水' },
    { path: '/gachaManagement/rankSnapshotList', name: '排行榜快照' },
    { path: '/gachaManagement/taskLogList', name: '任务记录' },
  ],
},
```

---

## 4. 页面详细设计

### 4.1 数据概览（改造 P0）

**路由**：`/panel/dashboard`  
**文件**：`src/app/pages/panel/dashboard.tsx`

**展示卡片：**

| 指标 | 数据来源 | 说明 |
|------|----------|------|
| 今日 DAU | `app_user` 当日活跃 | 需埋点或 login 任务估算 |
| 今日抽赏次数 | `gacha_draw_log` COUNT | 含 gacha + bag_box |
| 今日新增用户 | `app_user` created_at | — |
| 赏池剩余库存 | `gacha_item` 汇总 | — |
| 活跃榜 Top3 | `gacha_rank_snapshot` | 只读 |
| 本周 UR 出货 | `gacha_draw_log` rarity=UR | — |

**新增 Admin API：**

```
POST /features/v1/dashboard/stats
→ { todayDraws, todayUsers, totalUsers, poolStats, rankPreview }
```

---

### 4.2 赏池管理（新建 P0）

**路由**：`/gachaManagement/poolList`  
**文件**：`src/app/pages/gachaManagement/pool-list.tsx`

| 列 | 字段 | 操作 |
|----|------|------|
| 赏池 ID | `poolId` | 查看赏品 |
| 名称 | `name` | 编辑 |
| 描述 | `description` | — |
| 封面 | `coverImage` | 上传 |
| 赏品数 | `itemCount` | — |
| 状态 | `status` | 启用/禁用 |
| 操作 | — | 编辑、管理赏品 |

**表单字段**：`poolId`、`name`、`description`、`coverImage`、`status`

**Admin API：**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `gacha_pool/list` | 分页列表 |
| POST | `gacha_pool/createOrUpdate` | 创建/更新 |
| POST | `gacha_pool/detail` | 详情含赏品统计 |

---

### 4.3 赏品管理（新建 P0）

**路由**：`/gachaManagement/itemList?poolId=default`  
**文件**：`src/app/pages/gachaManagement/item-list.tsx`  
**弹窗**：`use-add-edit-gacha-item-modal.tsx`

| 列 | 字段 | 说明 |
|----|------|------|
| 赏品 ID | `itemId` | 主键 |
| 名称 | `name` | — |
| 稀有度 | `rarity` | N/R/SR/SSR/UR Tag 色 |
| 欧气值 | `rarityScore` | — |
| 积分值 | `scoreValue` | — |
| 套系 | `series` | — |
| 权重 | `dropWeight` | 编辑后展示公示概率 % |
| 动画 | `animation` | normal/gold/rainbow |
| 限时 | `isLimited` / `limitedEnd` | — |
| 状态 | `status` | 上下架 |

**表单校验：**

- 同池内 `dropWeight` 总和展示为 100% 参考
- `rarity` 与 `rarityScore`/`scoreValue` 建议联动默认值（见 `backend-dev.md` 概率表）

**Admin API：**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `gacha_item/list` | 按 poolId 筛选 |
| POST | `gacha_item/createOrUpdate` | 单条 |
| POST | `gacha_item/batchCreateOrUpdate` | 批量导入 |
| POST | `gacha_item/delete` | 软删除 status=0 |

**后端实现参考**：复用 `src/server/handlers/bag.ts` 中 `handleItemList` 模式，新建 `src/server/handlers/gacha-admin.ts`。

---

### 4.4 抽赏记录（新建 P0）

**路由**：`/gachaManagement/drawLogList`  
**文件**：`src/app/pages/gachaManagement/draw-log-list.tsx`

| 列 | 字段 | 筛选 |
|----|------|------|
| 时间 | `createdAt` | 日期范围 |
| 用户 | `nickname` / `userId` | 关键词 |
| 来源 | `drawType` | single / bag_box |
| 赏池/福袋 | `poolId` | — |
| 赏品 | `itemName` + `rarity` | 稀有度 |
| 积分 | `scoreGained` | — |
| 重复 | `isDuplicate` | — |
| 批次 | `batchId` | — |

**说明**：`drawType=bag_box` 为选格开赏，`drawType=single` 为盲盒机抽赏。

**Admin API：**

```
POST /features/v1/gacha_draw_log/list
入参：{ page, pageSize, userId?, poolId?, drawType?, rarity?, dateFrom?, dateTo? }
```

---

### 4.5 次数流水 / 积分流水 / 任务记录（新建 P1）

三个页面结构类似，ProTable + 筛选：

| 页面 | 表 | 关键列 |
|------|-----|--------|
| 次数流水 | `gacha_chance_log` | delta、balance、source（login/share/bag_draw/draw） |
| 积分流水 | `gacha_score_log` | delta、balance、source、refId |
| 任务记录 | `gacha_task_log` | taskType、taskDate、reward |

**运营操作（P1）：**

- 用户详情页「手动补发次数」→ 调用 `gacha_chance/grant`（Admin 专用）
- 用户详情页「手动调整积分」→ 调用 `gacha_score/grant`（需审计日志）

---

### 4.6 排行榜快照（新建 P1）

**路由**：`/gachaManagement/rankSnapshotList`  
**文件**：`src/app/pages/gachaManagement/rank-snapshot-list.tsx`

| 筛选 | 说明 |
|------|------|
| `rankType` | active / lucky / score |
| `periodKey` | 2026W36 / season_1 |
| `snapshotAt` | 快照时间 |

**展示**：Top 50/100 表格，支持导出 CSV。

**Admin API：**

```
POST /features/v1/gacha_rank_snapshot/list
POST /features/v1/gacha_rank_snapshot/trigger   // 手动触发快照（可选）
```

---

### 4.7 福袋详情 / 格子管理（新建 P0）

**路由**：`/lotteryManagement/bagDetail?id=bag_001`  
**文件**：`src/app/pages/lotteryManagement/bag-detail.tsx`

**页面布局：**

```
┌─────────────────────────────────────────────┐
│ 福袋基本信息（名称、价格、总格数、状态）      │
├─────────────────────────────────────────────┤
│ Tab: 赏品配置 | 格子状态 | 开赏记录          │
├─────────────────────────────────────────────┤
│ 【赏品配置】bag_item 列表（概率、库存）       │
│ 【格子状态】网格图 sold/locked/available     │
│ 【开赏记录】grab_bag_index + draw_log        │
└─────────────────────────────────────────────┘
```

**格子状态网格（核心）：**

- 调用 C 端 API `GET /api/v1/bag/box/state?bagId=`（或 Admin 封装）
- 颜色：已售(灰)、锁定(黄)、可选(绿)
- 悬停显示：锁格用户、开赏奖品名

**从福袋列表跳转：**

改造 `bagList.tsx` 操作列，增加「详情」「格子」入口。

**与选格开赏关系说明（页面内提示）：**

> 用户须先锁格 → 消耗免费次数 `POST /bag/draw` 开赏；亦可走付费订单流程。

---

### 4.8 选格开赏记录（新建 P1）

**路由**：`/lotteryManagement/bagDrawLogList`  
**文件**：`src/app/pages/lotteryManagement/bag-draw-log-list.tsx`

筛选 `gacha_draw_log.draw_type = 'bag_box'`，关联 `grab_bag_index` 展示 `boxNo`。

---

### 4.9 用户列表（改造 P0）

**文件**：`src/app/pages/user-management/user-list.tsx`

**新增列：**

| 列 | 字段 |
|----|------|
| 抽赏次数 | `drawChances` |
| 累计积分 | `totalScore` |
| 本周欧气 | `weekMaxLucky` |
| 图鉴进度 | `collectionCount/collectionTotal` |
| 邀请码 | `inviteCode` |

**后端改造**：`handleUserList` / `mapUser` 增加 Gacha 字段查询。

---

### 4.10 用户详情（改造 P0）

**文件**：`src/app/pages/user-management/user-detail.tsx`

**Descriptions 扩展区：**

```
抽赏次数、累计抽数、积分、赛季积分、荣誉积分
本周欧气、保底 SR/SSR 进度
图鉴收集数、碎片数、佩戴称号
邀请码、邀请人数
```

**新增 Tab：**

| Tab | 内容 |
|-----|------|
| 抽赏记录 | 该用户 `gacha_draw_log` |
| 图鉴 | `gacha_collection` 列表 |
| 次数流水 | `gacha_chance_log` |
| 积分流水 | `gacha_score_log` |

**运营按钮：**

- 补发次数（Modal：数量 + 备注）
- 佩戴称号重置
- 查看保底计数（只读）

---

### 4.11 订单列表（小改 P2）

福袋选盒订单（`order_kind=bag_pick`）增加：

- 列：开赏状态、格子号列表
- 操作：查看开赏结果（`bag_order_open.result_json`）

---

## 5. 后台 Admin API 设计

### 5.1 路由规范

沿用现有模式：

```
POST /features/v1/{resource}/{action}
Authorization: Bearer <admin_token>   // system/user/login 签发
```

在 `src/server/dispatch.ts` 注册，Handler 放 `src/server/handlers/gacha-admin.ts`。

### 5.2 API 清单

#### 赏池 / 赏品

| 路径 | 说明 |
|------|------|
| `gacha_pool/list` | 赏池列表 |
| `gacha_pool/createOrUpdate` | 创建/更新赏池 |
| `gacha_item/list` | 赏品列表（poolId） |
| `gacha_item/createOrUpdate` | 创建/更新赏品 |
| `gacha_item/delete` | 下架赏品 |

#### 流水 / 记录

| 路径 | 说明 |
|------|------|
| `gacha_draw_log/list` | 抽赏记录（含 bag_box） |
| `gacha_chance_log/list` | 次数流水 |
| `gacha_score_log/list` | 积分流水 |
| `gacha_task_log/list` | 任务记录 |
| `gacha_rank_snapshot/list` | 排行榜快照 |

#### 用户运营

| 路径 | 说明 |
|------|------|
| `user/list` | **扩展** Gacha 字段 |
| `user/get` | **扩展** Gacha 字段 + 保底 |
| `gacha_chance/grant` | 手动补发/扣减次数 |
| `gacha_score/grant` | 手动调整积分 |
| `user/collection/list` | 用户图鉴列表 |

#### 福袋 / 格子

| 路径 | 说明 |
|------|------|
| `bag/box/state` | 格子状态（复用或代理 mall API） |
| `bag/draw_log/list` | 选格开赏记录 |
| `grab_bag_index/list` | 中奖索引列表 |

#### 概览

| 路径 | 说明 |
|------|------|
| `dashboard/stats` | 运营大盘指标 |

### 5.3 响应格式

与现有后台保持一致：

```typescript
// 成功
{ code: 200, data: { list, total }, message: 'success' }

// 列表类（兼容旧前端）
{ status: 'Success', list: [], total: 0 }
```

> 建议新页面统一用 `code: 200`，旧页面逐步迁移；或 Request 层做适配。

---

## 6. 前端工程结构

### 6.1 新增目录

```
src/app/pages/gachaManagement/
├── pool-list.tsx
├── item-list.tsx
├── draw-log-list.tsx
├── chance-log-list.tsx
├── score-log-list.tsx
├── rank-snapshot-list.tsx
├── task-log-list.tsx
├── use-add-edit-pool-modal.tsx
└── use-add-edit-gacha-item-modal.tsx

src/app/pages/lotteryManagement/
├── bag-detail.tsx              # 新建
└── bag-draw-log-list.tsx       # 新建

src/app/request/
├── gacha-pool.ts               # Admin API 封装
├── gacha-item.ts
├── gacha-draw-log.ts
├── gacha-chance-log.ts
├── gacha-score-log.ts
├── gacha-rank-snapshot.ts
└── dashboard-stats.ts

app/(admin)/gachaManagement/
├── poolList/page.tsx
├── itemList/page.tsx
├── drawLogList/page.tsx
├── chanceLogList/page.tsx
├── scoreLogList/page.tsx
├── rankSnapshotList/page.tsx
└── taskLogList/page.tsx

app/(admin)/lotteryManagement/
├── bagDetail/page.tsx          # 新建
└── bagDrawLogList/page.tsx     # 新建

src/server/handlers/
└── gacha-admin.ts              # 后台 Handler 聚合
```

### 6.2 页面模板（沿用现有模式）

```tsx
// app/(admin)/gachaManagement/itemList/page.tsx
import ItemList from 'src/app/pages/gachaManagement/item-list';
export default function Page() {
  return <ItemList />;
}
```

### 6.3 组件复用

| 已有 | 复用方式 |
|------|----------|
| `ProTable` + `ActionType` | 所有列表页 |
| `use-add-edit-*-modal.tsx` | 赏品/赏池编辑弹窗 |
| `uploadRequest` | 图片上传 |
| `edit-lottery.tsx` | 福袋赏品配置可继续复用 |

### 6.4 稀有度展示组件（新建）

```tsx
// src/components/gacha/RarityTag.tsx
const COLOR_MAP = { N: 'default', R: 'blue', SR: 'purple', SSR: 'gold', UR: 'red' };
```

---

## 7. 数据模型对照

### 7.1 两套「赏品」的关系

| 概念 | 表 | 用于 | 后台入口 |
|------|-----|------|----------|
| 库存赏品（供应链） | `stockpile` | 传统发货、福袋补货 | 赏品库存列表 |
| 福袋赏品（池内） | `bag_item` | 选格/付费开赏 | 福袋详情 → 赏品配置 |
| Gacha 赏品（盲盒机） | `gacha_item` | 盲盒机随机抽 | 抽赏运营 → 赏品管理 |

**运营注意：** 三者可共用素材图，但 **ID 与概率独立维护**。后期可做「从库存赏品导入到 Gacha 赏品」功能（P2）。

### 7.2 用户 Gacha 字段（`app_user` 扩展）

| 字段 | 后台展示位置 |
|------|--------------|
| `draw_chances` | 用户列表/详情 |
| `total_score` / `season_score` / `honor_score` | 用户详情 |
| `total_draws` / `week_draws` | 用户详情 |
| `week_max_lucky` | 用户列表/详情 |
| `pity_sr_count` / `pity_ssr_count` | 用户详情（只读） |
| `fragments` | 用户详情 |
| `equipped_title` / `unlocked_titles` | 用户详情 |
| `invite_code` / `invited_by` | 用户列表/详情 |

---

## 8. 开发分期

### Phase 1 — 核心运营（1.5 周）P0

| 序号 | 任务 | 后端 | 前端 |
|------|------|------|------|
| 1 | Admin API 基础 Handler | `gacha-admin.ts` + dispatch 注册 | — |
| 2 | 赏池/赏品 CRUD | `gacha_pool/*`、`gacha_item/*` | pool-list、item-list |
| 3 | 抽赏记录查询 | `gacha_draw_log/list` | draw-log-list |
| 4 | 用户列表/详情扩展 | `user/list`、`user/get` 加字段 | user-list、user-detail |
| 5 | 福袋详情+格子状态 | `bag/box/state` 代理 | bag-detail |
| 6 | 菜单注册 | — | defaultProps + 路由 |

**验收：**

- [ ] 可后台新增/编辑 Gacha 赏品并影响 C 端 `GET /gacha/pool`
- [ ] 可查看全站抽赏记录（含 bag_box）
- [ ] 用户详情可见次数、积分、图鉴数
- [ ] 福袋详情可查看格子售出/锁定状态

### Phase 2 — 运营增强（1 周）P1

| 序号 | 任务 |
|------|------|
| 7 | 次数/积分/任务流水页 |
| 8 | 排行榜快照页 + 手动触发 |
| 9 | 用户详情：补发次数、图鉴 Tab |
| 10 | 数据概览 Dashboard 真实指标 |
| 11 | 选格开赏记录独立页 |

### Phase 3 — 完善（0.5 周）P2

| 序号 | 任务 |
|------|------|
| 12 | 订单列表关联开赏结果 |
| 13 | 赏品批量导入（Excel/JSON） |
| 14 | 从 stockpile 导入 gacha_item |
| 15 | 任务配置页（登录+2、分享+1 等可调） |

---

## 9. 关键交互流程

### 9.1 运营上架新赏池

```
赏池管理 → 新建赏池
  → 赏品管理 → 添加赏品（设权重/稀有度）
  → C 端 GET /gacha/pool 验证
```

### 9.2 运营核查选格开赏

```
福袋列表 → 福袋详情 → 格子状态 Tab
  → 抽赏记录筛选 drawType=bag_box
  → 用户详情核对次数扣减
```

### 9.3 客诉处理（次数补发）

```
用户管理 → 搜索用户 → 详情
  → 次数流水（确认是否已发）
  → 补发次数（gacha_chance/grant，source=admin_grant）
```

---

## 10. 权限与安全

| 项 | 方案 |
|----|------|
| Admin API 鉴权 | 复用 `system/user/login` Token，dispatch 层校验 |
| 手动补发 | 仅管理员角色；写 `gacha_chance_log` source=`admin_grant` |
| 概率修改 | 操作日志（P2）：谁改了哪个赏品权重 |
| C 端 / Admin 隔离 | Admin 走 `/features/v1`，C 端走 `/api/v1` |

---

## 11. 测试要点

| 场景 | 验证 |
|------|------|
| 后台改 gacha_item 权重 | C 端 pool 公示概率同步变化 |
| 后台下架赏品 status=0 | C 端 draw 不再出该赏品 |
| 用户详情次数 | 与 C 端 `GET /user/profile` 一致 |
| 抽赏记录 | gacha draw + bag draw 均能查到 |
| 福袋格子状态 | 与 C 端 WS/HTTP state 一致 |
| 补发次数 | 用户 C 端 balance 增加，流水可查 |

---

## 12. 文件变更清单（汇总）

### 新建

| 类型 | 路径 |
|------|------|
| 文档 | `docs/admin-gacha-plan.md`（本文档） |
| Handler | `src/server/handlers/gacha-admin.ts` |
| 页面 | `src/app/pages/gachaManagement/*.tsx`（7 个） |
| 页面 | `src/app/pages/lotteryManagement/bag-detail.tsx` |
| Request | `src/app/request/gacha-*.ts`（6 个） |
| 路由 | `app/(admin)/gachaManagement/**/page.tsx`（7 个） |
| 组件 | `src/components/gacha/RarityTag.tsx` |

### 修改

| 文件 | 变更 |
|------|------|
| `src/app/layout/defaultProps.tsx` | 新增抽赏运营菜单 |
| `src/server/dispatch.ts` | 注册 gacha admin 路由 |
| `src/server/handlers/order-user.ts` | user list/get 扩展 Gacha 字段 |
| `src/app/pages/user-management/user-list.tsx` | 新列 |
| `src/app/pages/user-management/user-detail.tsx` | Gacha 区 + Tab |
| `src/app/pages/lotteryManagement/bagList.tsx` | 详情入口 |
| `src/app/pages/panel/dashboard.tsx` | 真实大盘 |

---

## 13. 附录：双玩法后台对照速查

| 维度 | 盲盒机（Gacha） | 选格开赏（Bag Draw） |
|------|----------------|---------------------|
| 后台赏品表 | `gacha_item` | `bag_item` |
| 后台配置入口 | 抽赏运营 → 赏品管理 | 福袋详情 → 赏品配置 |
| 概率配置 | `drop_weight` | `prob_rate` |
| 开赏记录 | `draw_type=single` | `draw_type=bag_box` |
| 格子状态 | — | 福袋详情 → 格子状态 |
| 付费替代 | — | 订单管理 → 福袋订单 |
| 共用数据 | `gacha_chance_log`、`gacha_score_log`、`gacha_collection`、用户 Gacha 字段 |

---

## 14. 推荐开发顺序（给执行人）

```
Week 1
  Day 1-2: gacha-admin Handler + 赏池/赏品 API + 页面
  Day 3:   抽赏记录页 + dispatch 注册
  Day 4:   用户 list/get 扩展 + 用户页面改造
  Day 5:   福袋详情 + 格子网格

Week 2
  Day 1-2: 流水类页面 + Dashboard
  Day 3:   排行榜快照 + 补发次数
  Day 4-5: 联调测试 + 修 bug
```

如需开始实施，建议从 **Phase 1 的 `gacha-admin.ts` + 赏品管理页** 切入，直接打通「后台改概率 → C 端生效」闭环。
