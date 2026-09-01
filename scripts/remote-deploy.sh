# 腾讯云远程部署（在本地 Windows/Mac/Linux 执行）
# 用法: bash scripts/remote-deploy.sh <服务器IP> [ssh用户]
# 示例: bash scripts/remote-deploy.sh 123.45.67.89 ubuntu

set -euo pipefail

HOST="${1:-}"
USER="${2:-root}"
REMOTE_DIR="${REMOTE_DIR:-/opt/fuudao-admin}"

if [ -z "$HOST" ]; then
  echo "用法: bash scripts/remote-deploy.sh <服务器公网IP> [ssh用户]"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo ">>> 同步代码到 ${USER}@${HOST}:${REMOTE_DIR}"
ssh "${USER}@${HOST}" "mkdir -p ${REMOTE_DIR}"
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .env \
  "${ROOT_DIR}/" "${USER}@${HOST}:${REMOTE_DIR}/"

echo ">>> 远程构建并启动"
ssh "${USER}@${HOST}" "cd ${REMOTE_DIR} && bash scripts/deploy.sh"

echo ""
echo ">>> 完成。访问 http://${HOST}:3001/health 验证"
