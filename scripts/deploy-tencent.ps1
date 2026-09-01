# 腾讯云 CVM 一键部署（在本地 Windows 执行，需已安装 OpenSSH 客户端）
param(
  [Parameter(Mandatory = $true)]
  [string]$ServerIp,

  [string]$User = "root",
  [string]$RemoteDir = "/opt/fuudao-admin"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host ">>> 打包项目..."
$Archive = Join-Path $env:TEMP "fuudao-admin.tar.gz"
if (Test-Path $Archive) { Remove-Item $Archive }
tar -czf $Archive -C $ProjectRoot --exclude=node_modules --exclude=.next --exclude=.git .

Write-Host ">>> 上传到 ${User}@${ServerIp}:${RemoteDir} ..."
ssh "${User}@${ServerIp}" "mkdir -p $RemoteDir"
scp $Archive "${User}@${ServerIp}:${RemoteDir}/project.tar.gz"
ssh "${User}@${ServerIp}" @"
set -e
cd $RemoteDir
tar -xzf project.tar.gz && rm project.tar.gz
bash scripts/tencent-cvm-setup.sh 2>/dev/null || true
bash scripts/deploy.sh
"@

Write-Host ""
Write-Host "部署完成！"
Write-Host "API:    http://${ServerIp}:3001/api/v1/bag/box/state?bagId=bag_001"
Write-Host "WS:     ws://${ServerIp}:3001/ws/bag?bagId=bag_001"
Write-Host "健康检查: http://${ServerIp}:3001/health"
Write-Host ""
Write-Host "请在腾讯云控制台 -> 安全组 放行 TCP 3001"
