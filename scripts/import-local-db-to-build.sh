#!/bin/bash
# 将本地 MongoDB (school_cms) 导出并导入到构建版本的 MongoDB 容器
# 用法: ./scripts/import-local-db-to-build.sh
# 构建版本需先启动（在 nas_deploy 下执行 ./一键启动.sh 或在本项目下 docker-compose up -d）

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$REPO_ROOT/db-export"
CONTAINER_NAME="jintu-mongodb"

cd "$REPO_ROOT"
mkdir -p "$OUT_DIR"

echo "=========================================="
echo "  本地数据库 → 构建版本 MongoDB"
echo "=========================================="
echo ""

echo "[1/3] 从本地 MongoDB 导出 (school_cms) ..."
if ! mongodump --uri="mongodb://localhost:27017/school_cms" --out="$OUT_DIR" 2>/dev/null; then
  echo "错误: 无法连接本地 MongoDB (localhost:27017)。"
  echo "请确保本机 MongoDB 已启动，且已安装 mongodb-database-tools (macOS: brew install mongodb-database-tools)"
  exit 1
fi
echo "✓ 已导出到 $OUT_DIR"
echo ""

echo "[2/3] 检查构建版本 MongoDB 容器是否运行 ..."
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "未检测到运行中的容器 ${CONTAINER_NAME}。请先启动构建版本："
  echo "  方式一（推荐）: cd nas_deploy && ./一键启动.sh"
  echo "  方式二: 在项目根目录执行 docker-compose up -d"
  echo ""
  echo "启动后再执行本脚本: ./scripts/import-local-db-to-build.sh"
  exit 1
fi
echo "✓ 容器 ${CONTAINER_NAME} 已运行"
echo ""

echo "[3/3] 导入到构建版本 MongoDB ..."
docker cp "$OUT_DIR" "${CONTAINER_NAME}:/tmp/db-import"
docker exec "${CONTAINER_NAME}" mongorestore --uri="mongodb://localhost:27017" --db=school_cms --drop "/tmp/db-import/school_cms"
docker exec "${CONTAINER_NAME}" rm -rf /tmp/db-import
echo "✓ 导入完成"
echo ""
echo "构建版本数据库已更新为本地数据。访问 http://localhost:19080 查看。"
