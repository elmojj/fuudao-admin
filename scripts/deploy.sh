#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "请先安装 Docker: https://docs.docker.com/engine/install/"
  exit 1
fi

if [ ! -f .env ]; then
  if [ ! -f .env.production.example ]; then
    echo "缺少 .env.production.example"
    exit 1
  fi
  cp .env.production.example .env
  POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  TOKEN_SECRET="$(openssl rand -base64 48 | tr -d '/+=')"
  sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
  sed -i "s|TOKEN_SECRET=.*|TOKEN_SECRET=${TOKEN_SECRET}|" .env
  echo "已生成 .env（含随机密码与 TOKEN_SECRET）"
fi

echo "构建并启动容器..."
if docker compose version >/dev/null 2>&1; then
  docker compose --env-file .env up -d --build
else
  sudo docker compose --env-file .env up -d --build
fi

echo ">>> 等待数据库就绪..."
sleep 8
bash scripts/init-db.sh || true

if docker compose version >/dev/null 2>&1; then
  docker compose restart app || true
else
  sudo docker compose restart app || true
fi

echo ""
echo "部署完成。检查状态："
if docker compose version >/dev/null 2>&1; then
  docker compose ps
else
  sudo docker compose ps
fi
echo ""
echo "健康检查："
sleep 5
curl -fsS "http://127.0.0.1:${APP_PORT:-3001}/health" || true
echo ""
echo "API 示例：http://<公网IP>:${APP_PORT:-3001}/api/v1/bag/box/state?bagId=bag_001"
echo "WebSocket：ws://<公网IP>:${APP_PORT:-3001}/ws/bag?bagId=bag_001"
echo ""
echo "腾讯云安全组请放行 TCP ${APP_PORT:-3001}"
