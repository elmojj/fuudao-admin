#!/usr/bin/env bash
# 腾讯云 CVM / 轻量应用服务器首次初始化（Ubuntu 22.04+）
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  exec sudo bash "$0" "$@"
fi

apt-get update
apt-get install -y ca-certificates curl git openssl

if ! command -v docker >/dev/null 2>&1; then
  apt-get install -y docker.io docker-compose-v2
  systemctl enable docker
  systemctl start docker
fi

if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin || true
fi

if id ubuntu >/dev/null 2>&1; then
  usermod -aG docker ubuntu || true
fi

ufw allow OpenSSH || true
ufw allow 3001/tcp || true
echo "y" | ufw enable || true

echo "Docker 已就绪。"