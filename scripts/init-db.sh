#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

DC="docker compose"
if ! docker info >/dev/null 2>&1; then
  DC="sudo docker compose"
fi

if ! $DC ps db 2>/dev/null | grep -q 'Up'; then
  echo "数据库容器未运行，请先 docker compose up -d db"
  exit 1
fi

run_sql() {
  local file="$1"
  sed '1,17d' "$file" | sed '/^\\connect/d' | $DC exec -T db psql -U postgres -d fuudao_admin -v ON_ERROR_STOP=0
}

echo ">>> 初始化数据库结构..."
run_sql docs/sql/init.sql
run_sql docs/sql/arcade-tables.sql
run_sql docs/sql/seed.sql
echo ">>> 数据库初始化完成"
