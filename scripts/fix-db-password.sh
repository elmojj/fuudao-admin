#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

cat > .env <<'EOF'
POSTGRES_PASSWORD=testpass123456
TOKEN_SECRET=test-token-secret-for-docker-build-only-32chars
APP_PORT=3001
EOF

sudo docker compose exec -T db psql -U postgres \
  -c "ALTER USER postgres WITH PASSWORD 'testpass123456';"

sudo docker compose up -d app
sleep 15
sudo docker compose ps
curl -fsS "http://127.0.0.1:3001/health"
echo ""
curl -fsS "http://127.0.0.1:3001/api/v1/gacha/pool?poolId=default" | head -c 300
echo ""
