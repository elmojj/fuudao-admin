# 项目功能概览

## 1. 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript 5 |
| UI 组件库 | Ant Design 5 + `@ant-design/pro-components` |
| 路由 | React Router v6（Hash 路由） |
| 状态管理 | Redux Toolkit + Redux Saga + `redux-injectors` |
| HTTP 客户端 | Axios |
| 构建工具 | Create React App + CRACO |
| 样式方案 | styled-components + Ant Design Theme |
| 工具库 | ahooks, dayjs, lodash, echarts, xlsx, crypto-js |

## 2. 项目结构

```
src/
├── app/
│   ├── core/           # 路由、登录
│   ├── layout/         # ProLayout 主布局
│   ├── pages/          # 业务页面
│   ├── request/        # API 请求层（含类型定义）
│   ├── store/          # Redux Store
│   └── host-app.ts     # 统一请求入口
├── components/         # 通用组件
├── data/               # 遗留数据模型与常量
├── styles/             # 全局样式
└── utils/              # 工具函数
```

## 3. 业务模块

### 3.1 认证与系统

| 功能 | 路由 | 说明 |
|------|------|------|
| 用户登录 | `/login` | 用户名 + 密码 + 验证码 |
| 自动登录 | `/autoLogin` | Token 自动登录 |
| 心跳保活 | — | `portal/pingLogin`（已注释） |

**相关文件：** `src/app/core/login/`、`src/app/request/login/index.ts`

### 3.2 数据概览

| 功能 | 路由 | 状态 |
|------|------|------|
| 仪表盘 | `/panel/dashboard` | ⚠️ 占位页面，未实现 |

### 3.3 赏品管理

| 功能 | 路由 | 说明 |
|------|------|------|
| 赏品库存列表 | `/lotteryManagement/lotteryList` | 库存赏品 CRUD |
| 福袋列表 | `/lotteryManagement/bagList` | 福袋（抽赏包）管理 |
| 福袋类别 | `/lotteryManagement/bagCategoryList` | 福袋分类管理 |
| 赏品等级 | `/lotteryManagement/lotteryLevelList` | 普通赏/保底赏/终极赏等级 |
| 创建福袋 | `/lotteryManagement/createBag` | 新建福袋及内含赏品配置 |

**相关文件：** `src/app/pages/lotteryManagement/`

### 3.4 订单管理

| 功能 | 路由 | 说明 |
|------|------|------|
| 订单列表 | `/orderManagement/orderList` | 订单查询、批量创建物流单 |

**订单状态：** 待支付 → 已支付 → 申请发货 → 已发货 → 已完成（含超时取消、退款等中间态）

**相关文件：** `src/app/pages/order-management/`

### 3.5 物流管理

| 功能 | 路由 | 说明 |
|------|------|------|
| 物流列表 | `/logisticManagement/logisticList` | 物流单查询、发货、签收、导出 |

**物流状态：** 申请发货 → 已发货 → 已签收

**相关文件：** `src/app/pages/logistic-list/`

### 3.6 用户管理

| 功能 | 路由 | 说明 |
|------|------|------|
| 用户列表 | `/userManagement/userList` | 用户查询、消费统计 |
| 用户详情 | `/userManagement/userDetail` | 用户详细信息 |

**相关文件：** `src/app/pages/user-management/`

## 4. 路由结构

```
/
├── / (index)              → 登录页
├── /login                 → 登录页
├── /autoLogin             → 自动登录
├── /panel                 → 数据概览（LayoutMain）
│   └── /panel/dashboard
├── /lotteryManagement     → 赏品管理（LayoutMain）
│   ├── /lotteryManagement/lotteryList
│   ├── /lotteryManagement/bagList
│   ├── /lotteryManagement/bagCategoryList
│   ├── /lotteryManagement/lotteryLevelList
│   └── /lotteryManagement/createBag
├── /orderManagement       → 订单管理（LayoutMain）
│   └── /orderManagement/orderList
├── /logisticManagement    → 物流管理（LayoutMain）
│   └── /logisticManagement/logisticList
└── /userManagement        → 用户管理（LayoutMain）
    ├── /userManagement/userList
    └── /userManagement/userDetail
```

**路由定义：** `src/app/core/router/index.tsx`  
**侧边栏菜单：** `src/app/layout/defaultProps.tsx`

## 5. 状态管理

### Redux Store 模块

| Slice | 文件 | 缓存数据 |
|-------|------|----------|
| `base` | `src/app/store/base/` | 福袋 Map、赏品库存 Map、赏品等级列表、快递公司列表 |
| `theme` | `src/app/store/theme/` | 主题模式（light/dark） |

### 布局初始化预加载

进入主布局时，`baseSaga` 并行拉取以下数据并缓存到 Redux：

- 福袋列表（最多 50000 条）→ `bagListMap`
- 赏品库存列表 → `lotteryListMap`
- 赏品等级列表 → `lotteryLevelList`
- 快递公司列表 → `deliveryList`

**相关文件：** `src/app/store/base/saga.ts`

## 6. API 请求架构

```
页面/组件
  ↓
src/app/request/*.ts        # 业务 API 函数 + TS 类型
  ↓
src/app/host-app.ts         # postRequest / getRequest / downloadRequest / uploadRequest
  ↓
src/app/request/request.ts  # Axios 实例 + Bearer Token 拦截器
  ↓
BASE_URL + endpoint         # https://adminapiv2.fuudao.cn/
```

- Token 存储于 `localStorage.token`
- 401 响应自动跳转登录页
- 支持请求去重队列（`request-queue.ts`）

## 7. 遗留/未接入功能

以下组件来自原 WaterDesk 水务平台，**未接入当前路由**：

| 组件 | 路径 | 说明 |
|------|------|------|
| 系统角色 | `src/components/system-role/` | 角色权限管理 |
| 系统日志 | `src/components/system-log/` | 操作日志 |
| 系统图标 | `src/components/system-icon/` | 图标管理 |
| 待发货/待签收列表 | `/logisticManagement/waitSendList` 等 | 路由存在但指向占位页 |
