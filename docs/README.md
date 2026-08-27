# 富游岛后台管理系统 — 项目文档

> 本文档基于前端代码库 `fuudao-antd-admin` 逆向分析生成，描述系统功能、数据模型及前后端交互拓扑。

## 文档索引

| 文档 | 说明 |
|------|------|
| [项目功能概览](./project-overview.md) | 技术栈、业务模块、路由结构、状态管理 |
| [数据表结构](./database-schema.md) | 根据 API 类型定义推断的后端数据实体结构 |
| [数据交互拓扑](./data-topology.md) | 前后端请求链路、实体关系、业务流程图 |
| [SQL 初始化脚本](./sql/init.sql) | PostgreSQL 建库建表脚本 |

## 本地数据库

| 项 | 值 |
|----|-----|
| 数据库 | `fuudao_admin` |
| 主机 | `localhost` |
| 端口 | `5432` |
| 用户 | `postgres` |

重新初始化（会删除已有数据）：

```bash
"C:\Program Files\PostgreSQL\12\bin\psql.exe" -h localhost -p 5432 -U postgres -f docs/sql/init.sql
```

## 本地 API（已内置）

所有 API 已在 Next.js 内本地实现，连接 PostgreSQL 数据库 `fuudao_admin`，无需访问远程 `adminapiv2.fuudao.cn`。

| 配置项 | 值 |
|--------|-----|
| API 地址 | `http://localhost:3000/`（与前端同域） |
| 数据库 | `postgresql://postgres@localhost:5432/fuudao_admin` |
| 登录账号 | `admin` / `admin` |

### 初始化数据库

```bash
"C:\Program Files\PostgreSQL\12\bin\psql.exe" -h localhost -p 5432 -U postgres -f docs/sql/init.sql
"C:\Program Files\PostgreSQL\12\bin\psql.exe" -h localhost -p 5432 -U postgres -f docs/sql/seed.sql
```

### 已实现 API 端点

- `system/user/login`、`system/user/getCaptcha`、`/logout`
- `portal/pingLogin`、`portal/getUserConfigValues`、`portal/setUserConfigValue`
- `file/upload`
- `v1/stockpile/*`
- `features/v1/bag/*`、`bag_category/*`、`item/*`、`item_level/*`
- `features/v1/order/*`、`logistics/*`、`user/*`

## 项目简介

**富游岛后台 v2**（`foruislandadmin`）是富游岛赏品/福袋/抽赏电商平台的 **管理后台前端**，基于 React + Ant Design Pro 构建，通过 REST API 与后端服务 `https://adminapiv2.fuudao.cn/` 通信。

## 重要说明

- 本仓库为 **纯前端项目**，不包含数据库 Schema、Migration 或 ORM 定义。
- 表结构文档依据 `src/app/request/` 下的 TypeScript 接口 **推断**，实际后端表名/字段可能略有差异。
- 项目源自上海慧水科技 WaterDesk 平台模板，部分遗留代码（水务/GIS 相关）未接入当前业务路由。
