# 服务部署说明

本文档说明如何将 fuudao-admin 部署到腾讯云服务器（Docker 方式）。

## 架构概览

```
客户端 / 小程序
      │
      ▼
┌─────────────────┐
│  腾讯云安全组    │  TCP 22（SSH）、TCP 3001（HTTP + WebSocket）
└────────┬────────┘
         │
┌────────▼────────┐
│  Docker Compose │
│  ├─ app :3001   │  Next.js + Custom Server（HTTP API + WS）
│  └─ db  :5432   │  PostgreSQL 16（仅内网）
└─────────────────┘
```

- **HTTP API**：`http://<公网IP>:3001/api/v1/...`
- **WebSocket**：`ws://<公网IP>:3001/ws/bag?bagId=...`
- **健康检查**：`http://<公网IP>:3001/health`

## 环境要求

| 项目 | 要求 |
|------|------|
| 服务器 | 腾讯云 CVM 或轻量应用服务器，Ubuntu 22.04+ |
| 配置 | 建议 2 核 4G，磁盘 ≥ 40GB |
| 软件 | Docker 29+、Docker Compose v2 |
| 端口 | 对外放行 **3001**（应用）、**22**（SSH） |

## 一、腾讯云控制台配置

### 1. 安全组入站规则

路径：**云服务器 → 实例 → 安全组 → 入站规则**

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 22 | 你的 IP 或 0.0.0.0/0 | SSH 登录 |
| TCP | 3001 | 0.0.0.0/0 | API + WebSocket |

### 2. 轻量应用服务器防火墙（如适用）

若使用轻量应用服务器，还需在实例详情页的 **防火墙** 中放行 **TCP 3001**。

## 二、服务器首次初始化

SSH 登录服务器后执行：

```bash
# 上传代码到服务器后，在项目根目录执行
sudo bash scripts/tencent-cvm-setup.sh
```

脚本会自动完成：

- 安装 Docker、Docker Compose
- 将 `ubuntu` 用户加入 `docker` 组
- 配置 UFW 放行 22、3001 端口

### Docker 镜像加速（国内必配）

若拉取镜像超时，配置腾讯云镜像加速器：

```bash
sudo python3 -c "
import json
with open('/etc/docker/daemon.json','w') as f:
    json.dump({'registry-mirrors':[
        'https://mirror.ccs.tencentyun.com',
        'https://docker.m.daocloud.io'
    ]}, f)
"
sudo systemctl restart docker
```

也可直接执行项目中的 `scripts/fix-docker-mirror.sh`。

## 三、环境变量

复制模板并填写：

```bash
cp .env.production.example .env
```

`.env` 内容示例：

```env
POSTGRES_PASSWORD=你的强密码
TOKEN_SECRET=至少32位随机字符串
APP_PORT=3001
```

| 变量 | 说明 |
|------|------|
| `POSTGRES_PASSWORD` | PostgreSQL 数据库密码 |
| `TOKEN_SECRET` | JWT 签名密钥，**生产环境必填** |
| `APP_PORT` | 对外映射端口，默认 3001 |

首次部署时，`scripts/deploy.sh` 可自动生成随机密码并写入 `.env`。

## 四、部署方式

### 方式 A：服务器上直接部署（推荐）

```bash
cd ~/fuudao-admin

# 修复脚本换行符（从 Windows 上传时可能需要）
find scripts -name '*.sh' -exec sed -i 's/\r$//' {} +

# 一键构建并启动
bash scripts/deploy.sh
```

`deploy.sh` 执行流程：

1. 检查 / 生成 `.env`
2. `docker compose up -d --build` 构建镜像并启动
3. 等待数据库就绪后执行 `scripts/init-db.sh` 初始化表结构
4. 重启应用容器

### 方式 B：本地 Windows 一键上传部署

在本地项目根目录执行（需安装 OpenSSH 或 PuTTY）：

```powershell
.\scripts\deploy-tencent.ps1 -ServerIp "你的公网IP" -User ubuntu
```

脚本会打包代码、SCP 上传、远程执行部署。

### 方式 C：手动 Docker Compose

```bash
cd ~/fuudao-admin
sudo docker compose --env-file .env up -d --build
```

## 五、数据库初始化

首次部署需初始化数据库（`deploy.sh` 会自动调用）：

```bash
bash scripts/init-db.sh
```

该脚本依次执行：

- `docs/sql/init.sql`（基础表结构）
- `docs/sql/arcade-tables.sql`（娱乐场 / 锁盒表）
- `docs/sql/seed.sql`（演示数据，含 `bag_001`）

应用启动时还会自动执行增量迁移（`ensureMallTables`、`ensureArcadeTables`、`ensureBagOrderTables`）。

## 六、验证部署

### 服务器本机

```bash
curl http://127.0.0.1:3001/health
# 期望：{"status":"ok"}

curl "http://127.0.0.1:3001/api/v1/bag/box/state?bagId=bag_001"
# 期望：{"code":0,"data":{...},"message":"success"}

sudo docker compose ps
# app、db 状态均应为 Up (healthy)
```

### 公网访问

```bash
curl http://<公网IP>:3001/health
curl "http://<公网IP>:3001/api/v1/bag/box/state?bagId=bag_001"
```

## 七、更新 / 重新部署

代码更新后，在服务器上执行：

```bash
cd ~/fuudao-admin

# 方式 1：重新上传代码包后
tar -xzf project.tar.gz
find scripts -name '*.sh' -exec sed -i 's/\r$//' {} +
sudo docker compose --env-file .env up -d --build

# 方式 2：git pull 后
git pull
sudo docker compose --env-file .env up -d --build
```

数据库迁移会在应用启动时自动执行，无需手动操作。

## 八、常用运维命令

```bash
cd ~/fuudao-admin

# 查看容器状态
sudo docker compose ps

# 查看应用日志
sudo docker compose logs -f app

# 查看数据库日志
sudo docker compose logs -f db

# 重启应用
sudo docker compose restart app

# 停止所有服务
sudo docker compose down

# 停止并清除数据卷（慎用，会删除数据库）
sudo docker compose down -v
```

## 九、小程序配置

### 无域名（开发联调）

在微信开发者工具中：

- 勾选 **不校验合法域名**
- API 基址：`http://<公网IP>:3001/`
- WebSocket：`ws://<公网IP>:3001/ws/bag`

### 正式上线

需完成域名备案，并配置：

- **request 合法域名**：`https://api.example.com`
- **socket 合法域名**：`wss://api.example.com`
- Nginx 反向代理 + SSL 证书

## 十、环境变量参考（应用容器）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NODE_ENV` | `production` | 运行模式 |
| `HOSTNAME` | `0.0.0.0` | 监听地址 |
| `PORT` | `3001` | 应用端口 |
| `DATABASE_URL` | 由 compose 注入 | PostgreSQL 连接串 |
| `TOKEN_SECRET` | 必填 | 用户 Token 签名密钥 |
| `WECHAT_PAY_MOCK` | 未设置即 Mock | 设为 `false` 关闭 Mock 支付 |

## 十一、故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 公网连接超时 | 安全组 / 防火墙未放行 3001 | 检查腾讯云安全组与轻量防火墙 |
| Docker 拉镜像超时 | 未配置镜像加速 | 执行 `scripts/fix-docker-mirror.sh` |
| 应用容器反复重启 | 数据库未初始化 | 执行 `bash scripts/init-db.sh` |
| `pipefail` 脚本报错 | Windows 换行符 | `sed -i 's/\r$//' scripts/*.sh` |
| 登录后 Token 失效 | `TOKEN_SECRET` 变更 | 保持 `.env` 中密钥不变，或让用户重新登录 |
| 构建时 pnpm 报错 | 容器内 Node 版本 | Dockerfile 已使用 `tsx` 直接启动，无需 `pnpm start` |

## 十二、相关文件

| 文件 | 用途 |
|------|------|
| `Dockerfile` | 多阶段构建镜像 |
| `docker-compose.yml` | 编排 app + db |
| `.env.production.example` | 环境变量模板 |
| `scripts/deploy.sh` | 一键部署 |
| `scripts/init-db.sh` | 数据库初始化 |
| `scripts/tencent-cvm-setup.sh` | 服务器首次环境准备 |
| `scripts/deploy-tencent.ps1` | Windows 远程部署 |
| `scripts/fix-docker-mirror.sh` | Docker 镜像加速 |
| `server.ts` | Custom Server（HTTP + WebSocket） |
