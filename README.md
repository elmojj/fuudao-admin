# 富游岛后台 v2

富游岛赏品/福袋电商管理后台。

## 技术栈

- **包管理**: pnpm
- **框架**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript + Ant Design 5 + ProComponents
- **状态管理**: Redux Toolkit + Redux Saga
- **样式**: styled-components + Ant Design Theme

## 快速开始

```bash
pnpm install
pnpm dev
```

访问 http://localhost:3000/login

## 构建

```bash
pnpm build
pnpm start
```

## 项目结构

```
app/                    # Next.js App Router 路由
src/
  app/
    request/            # API 请求层（数据逻辑）
    store/              # Redux 状态
    pages/              # 业务页面组件
    layout/             # ProLayout 布局
  components/login/     # 登录组件
  providers/            # 全局 Provider
  utils/                # 工具函数
public/
  global-config.js      # 运行时 API 配置
docs/                   # 项目文档
```

## API 配置

后端 API 已内置在 Next.js 中，默认地址为 `http://localhost:3000/`（与前端同域）。

环境变量见 `.env.local.example`：

```
DATABASE_URL=postgresql://postgres@localhost:5432/fuudao_admin
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/
```

> 若之前访问过远程 API，请清除浏览器 `localStorage` 中的 `requestUrl` 键。

## 路由对照

| 路径 | 功能 |
|------|------|
| `/login` | 登录 |
| `/autoLogin` | 第三方 Token 自动登录 |
| `/panel/dashboard` | 数据概览 |
| `/lotteryManagement/*` | 赏品管理 |
| `/orderManagement/orderList` | 订单列表 |
| `/logisticManagement/logisticList` | 物流列表 |
| `/userManagement/*` | 用户管理 |
