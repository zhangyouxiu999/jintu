#!/bin/bash
#
# 金图考勤系统 - 绿联 NAS 部署包打包脚本
# 在开发机执行，生成 nas_deploy/ 文件夹
# 上传到 NAS 后通过 Docker 图形界面一键部署，无需 SSH
#
# 用法: ./scripts/deploy.sh [选项]  （在项目根目录执行）

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SKIP_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --skip-build|-s) SKIP_BUILD=true ;;
    --help|-h)
      echo "用法: ./scripts/deploy.sh [选项]"
      echo "  --skip-build, -s  跳过构建，使用已有 .next 产物"
      echo "  --help, -h        显示帮助"
      exit 0 ;;
  esac
done

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  金图考勤系统 - 绿联 NAS 部署包打包${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# ── 步骤 1: 构建 ──────────────────────────────────────
if [ "$SKIP_BUILD" = true ]; then
  echo -e "${YELLOW}[1/5] 跳过构建，使用已有产物 (--skip-build)${NC}"
else
  echo -e "${YELLOW}[1/5] 执行 next build ...${NC}"
  npm run build
fi

if [ ! -f .next/standalone/server.js ]; then
  echo -e "${RED}错误: 未找到 .next/standalone/server.js${NC}"
  echo "请确保 next.config.ts 中配置了 output: 'standalone'"
  exit 1
fi
if [ ! -d .next/static ]; then
  echo -e "${RED}错误: 未找到 .next/static 目录${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ 构建产物已就绪${NC}"

# ── 步骤 2: 导出 MongoDB 数据 ────────────────────────
echo -e "${YELLOW}[2/5] 导出 MongoDB 数据（school_cms）...${NC}"
MONGO_CONTAINER="school-mongo"
if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
  echo -e "${RED}错误: 未找到运行中的 MongoDB 容器 '${MONGO_CONTAINER}'${NC}"
  echo "请确保本地 MongoDB 容器正在运行"
  exit 1
fi

rm -rf /tmp/jintu_mongodump
docker exec "$MONGO_CONTAINER" mongodump --db school_cms --out /tmp/mongodump_inside --quiet 2>/dev/null
docker cp "$MONGO_CONTAINER":/tmp/mongodump_inside/school_cms /tmp/jintu_mongodump
docker exec "$MONGO_CONTAINER" rm -rf /tmp/mongodump_inside
BSON_COUNT=$(ls /tmp/jintu_mongodump/*.bson 2>/dev/null | wc -l | tr -d ' ')
echo -e "${GREEN}  ✓ 数据库导出完成 (${BSON_COUNT} 个集合)${NC}"

# ── 步骤 3: 组装 nas_deploy 目录 ─────────────────────
echo -e "${YELLOW}[3/5] 组装部署目录 nas_deploy/ ...${NC}"
rm -rf nas_deploy
mkdir -p nas_deploy/standalone nas_deploy/static nas_deploy/public nas_deploy/dbseed

cp -a .next/standalone/. nas_deploy/standalone/
rm -f nas_deploy/standalone/.env nas_deploy/standalone/.env.local
cp -r .next/static/* nas_deploy/static/
cp -r public/* nas_deploy/public/ 2>/dev/null || true
cp -r /tmp/jintu_mongodump/* nas_deploy/dbseed/
rm -rf /tmp/jintu_mongodump

cp deploy/Dockerfile.prod nas_deploy/Dockerfile
cp deploy/docker-compose.prod.yml nas_deploy/docker-compose.yml

echo -e "${GREEN}  ✓ 目录组装完成${NC}"

# ── 步骤 4: 生成 .env 和说明文件 ─────────────────────
echo -e "${YELLOW}[4/5] 生成配置文件 ...${NC}"

JWT_SECRET=$(openssl rand -hex 32)
cat > nas_deploy/.env << EOF
JWT_SECRET=${JWT_SECRET}
ADMIN_USERNAME=admin
ADMIN_PASSWORD=jintu123
APP_PORT=19080
EOF
echo -e "${GREEN}  ✓ .env 已生成（含唯一 JWT 密钥）${NC}"

cat > nas_deploy/使用说明.txt << 'README'
金图考勤系统 - 绿联 NAS 部署指南（无需 SSH）
================================================

【部署步骤】

  1. 将本文件夹上传到 NAS
     打开绿联 NAS 的文件管理器，把整个文件夹上传到任意位置
     （建议放在 Docker 共享目录下，如 /Docker/jintu）

  2. 在 Docker 管理界面创建项目
     打开绿联 Docker 应用 → Compose/项目 → 新建项目
     → 路径选择本文件夹 → 点击「部署」或「启动」

  3. 等待部署完成
     首次启动需要下载 MongoDB 和 Node.js 镜像（约 500MB），
     请耐心等待。部署完成后系统会自动导入预置数据。

  4. 访问系统
     浏览器打开: http://你的NAS的IP:19080
     默认账号: admin
     默认密码: jintu123

【修改账号密码】

  编辑本目录下的 .env 文件：
    ADMIN_USERNAME=你的新用户名
    ADMIN_PASSWORD=你的新密码
  然后在 Docker 界面重启 jintu-admin 容器

【修改访问端口】

  编辑 .env 文件中的 APP_PORT=新端口号
  然后在 Docker 界面重新部署项目

【数据说明】

  首次启动时，系统会自动从 dbseed/ 目录导入预置数据
  （学生、班级、考勤记录等）。如果数据库已有数据则跳过。
  数据存储在 Docker Volume 中，停止或重启容器不会丢失数据。

【技术信息】

  应用端口: 19080（可通过 .env 中 APP_PORT 修改）
  MongoDB: 4.4（仅内部通信，不对外暴露端口）
  Node.js: 20 (Alpine)
README

echo -e "${GREEN}  ✓ 使用说明已生成${NC}"

# ── 步骤 5: 打包 zip ────────────────────────────────
echo -e "${YELLOW}[5/5] 生成压缩包 nas_deploy.zip ...${NC}"
rm -f nas_deploy.zip
cd nas_deploy
zip -rq ../nas_deploy.zip . -x "*.DS_Store"
cd ..
ZIP_SIZE=$(du -sh nas_deploy.zip | cut -f1)
echo -e "${GREEN}  ✓ 已生成 nas_deploy.zip (${ZIP_SIZE})${NC}"

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  打包完成！${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "部署方法（无需 SSH）:"
echo "  1. 上传 nas_deploy.zip 到绿联 NAS 并解压"
echo "  2. 打开 Docker 应用 → Compose → 新建项目 → 选择该文件夹 → 部署"
echo "  3. 浏览器访问 http://NAS的IP:19080"
echo ""
echo "默认账号: admin / jintu123"
echo ""
