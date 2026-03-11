#!/bin/bash
# 从本地 MongoDB 导出 school_cms 数据库，便于在 NAS（或 Docker 构建版）上导入
# 用法: ./scripts/export-db-for-nas.sh
# 导出到: ./nas_deploy/data/db-export/ 或当前目录下的 db-export/
# 在 NAS 上导入: 见使用说明

set -e
OUT_DIR="${1:-./db-export}"
mkdir -p "$OUT_DIR"
echo "导出本地 MongoDB (school_cms) 到 $OUT_DIR ..."
mongodump --uri="mongodb://localhost:27017/school_cms" --out="$OUT_DIR" 2>/dev/null || {
  echo "请确保本机已安装 mongodb-database-tools 且 MongoDB 在 localhost:27017 运行。"
  echo "macOS: brew install mongodb-database-tools"
  exit 1
}
echo "✓ 已导出到 $OUT_DIR"
echo ""
echo "在 NAS 上导入步骤："
echo "  1. 将 $OUT_DIR 整个文件夹拷贝到 NAS 的 nas_deploy 目录下（如 nas_deploy/db-export）"
echo "  2. 在 NAS 上进入 nas_deploy，先启动服务：./一键启动.sh"
echo "  3. 执行："
echo "     docker cp db-export jintu-mongodb:/tmp/db-import"
echo "     docker exec jintu-mongodb mongorestore --uri='mongodb://localhost:27017' --db=school_cms /tmp/db-import/school_cms"
