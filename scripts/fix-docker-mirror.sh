#!/usr/bin/env bash
set -euo pipefail
python3 <<'PY'
import json
with open("/tmp/docker-daemon.json", "w") as f:
    json.dump({"registry-mirrors": ["https://mirror.ccs.tencentyun.com", "https://docker.m.daocloud.io"]}, f)
PY
sudo mv /tmp/docker-daemon.json /etc/docker/daemon.json
sudo systemctl reset-failed docker || true
sudo systemctl restart docker
sleep 2
sudo docker info | grep -i mirror -A2 || true
