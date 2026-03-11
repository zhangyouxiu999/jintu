#!/bin/bash
# 将本地 MongoDB 数据写入 nas_deploy/data/db，并重新打包（zip 含数据库）
# 用法: ./scripts/pack-nas-with-db.sh
# 前提: 1. 本机 MongoDB 在 localhost:27017 运行  2. 已安装 mongodb-database-tools  3. nas_deploy 已存在（先执行 ./scripts/deploy.sh --pack-only）

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NAS_DATA_DB="$REPO_ROOT/nas_deploy/data/db"
DUMP_DIR="$REPO_ROOT/db-export-temp"
TEMP_CONTAINER="jintu-mongo-temp"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$REPO_ROOT"

echo "=========================================="
echo "  将本地数据库写入 nas_deploy 并重新打包"
echo "=========================================="
echo ""

if [ ! -d nas_deploy ] || [ ! -f nas_deploy/docker-compose.yml ]; then
  echo -e "${RED}错误: nas_deploy 目录不存在或未完整。请先执行: ./scripts/deploy.sh --pack-only${NC}"
  exit 1
fi

USE_LOCAL_DUMP=false
echo -e "${YELLOW}[1/5] 从本地 MongoDB 导出 school_cms ...${NC}"
rm -rf "$DUMP_DIR"
mkdir -p "$DUMP_DIR"
if mongodump --uri="mongodb://localhost:27017/school_cms" --out="$DUMP_DIR" 2>/dev/null; then
  USE_LOCAL_DUMP=true
  echo -e "${GREEN}✓ 已从本地 MongoDB 导出${NC}"
else
  echo -e "${YELLOW}未检测到本地 MongoDB，将使用种子数据写入 nas_deploy/data/db${NC}"
fi
echo ""

echo -e "${YELLOW}[2/5] 清空 nas_deploy/data/db 并启动临时 MongoDB ...${NC}"
rm -rf "$NAS_DATA_DB"/*
mkdir -p "$NAS_DATA_DB"
docker rm -f "$TEMP_CONTAINER" 2>/dev/null || true
docker run -d \
  --name "$TEMP_CONTAINER" \
  -v "$NAS_DATA_DB:/data/db" \
  -p 27018:27017 \
  mongo:latest
echo "等待 MongoDB 就绪..."
sleep 5
echo -e "${GREEN}✓ 临时容器已启动${NC}"
echo ""

echo -e "${YELLOW}[3/5] 将数据写入 nas_deploy/data/db ...${NC}"
if [ "$USE_LOCAL_DUMP" = true ]; then
  docker cp "$DUMP_DIR" "$TEMP_CONTAINER:/tmp/dump"
  docker exec "$TEMP_CONTAINER" mongorestore --uri="mongodb://localhost:27017" --db=school_cms /tmp/dump/school_cms
  docker exec "$TEMP_CONTAINER" rm -rf /tmp/dump
  rm -rf "$DUMP_DIR"
  echo -e "${GREEN}✓ 已恢复本地导出数据${NC}"
else
  if MONGODB_URI="mongodb://localhost:27018/school_cms" node scripts/seed.js 2>/dev/null; then
    echo -e "${GREEN}✓ 已写入种子数据（班级等）${NC}"
  else
    echo -e "${YELLOW}种子脚本未执行（需 Node 与依赖），nas_deploy/data/db 仅有空库${NC}"
  fi
fi
docker stop "$TEMP_CONTAINER"
docker rm "$TEMP_CONTAINER"
echo ""

echo -e "${YELLOW}[4/5] 生成压缩包 nas_deploy.zip（含数据库）...${NC}"
rm -f nas_deploy.zip
zip -rq nas_deploy.zip nas_deploy -x "*.git*" 2>/dev/null || true
if [ -f nas_deploy.zip ]; then
  echo -e "${GREEN}✓ 已生成 nas_deploy.zip（含数据库）${NC}"
else
  echo -e "${YELLOW}zip 未生成，请检查 zip 命令${NC}"
fi
echo ""

echo -e "${GREEN}=========================================="
echo "  完成"
echo "==========================================${NC}"
echo ""
echo "nas_deploy 内已包含本地数据库内容，将 nas_deploy 或 nas_deploy.zip 拖入 NAS 后执行 ./一键启动.sh 即可。"
echo ""
