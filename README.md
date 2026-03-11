# 金图考勤管理系统 (Jintu Attendance Admin)

基于 Next.js 15 和 MongoDB 构建的现代化考勤管理后台系统。

## ✨ 核心功能

- **📊 实时考勤监控**：直观展示各班级考勤状态。
- **🔐 安全鉴权**：内置 JWT 登录认证和路由保护。
- **📱 响应式设计**：适配 PC 和移动端操作。
- **🐳 容器化部署**：支持 Docker 一键部署，专为 NAS 优化。

## 🛠️ 技术栈

- **框架**: [Next.js 15](https://nextjs.org/) (App Router)
- **语言**: TypeScript
- **数据库**: MongoDB
- **样式**: Tailwind CSS + Shadcn UI
- **验证**: Zod
- **加密**: Jose (JWT)

## 🚀 快速开始

### 本地开发

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```
   *注意：本地开发通常使用 `mongodb://localhost:27017/school_cms`*

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问 [http://localhost:3000](http://localhost:3000)

### 🐳 Docker 部署 (推荐)

本项目支持一键打包为 NAS 可用的部署包。

1. **执行打包脚本**（推荐使用脚本，会一并导出数据库并生成 zip）
   ```bash
   ./scripts/deploy.sh          # 完整打包（构建 + 导出 DB + 生成 nas_deploy.zip）
   ./scripts/deploy.sh -s       # 跳过构建，使用已有 .next
   ```
   或手动构建后自行组装 `nas_deploy` 目录（见脚本内步骤）。

2. **部署到 NAS**
   - 将生成的 `nas_deploy` 文件夹上传至 NAS。
   - 使用 Docker Compose 启动项目。
   - 默认映射端口为 **19080**（避免与常见服务冲突），访问地址：`http://NAS地址:19080`

## 🔑 环境变量说明

| 变量名 | 说明 | 默认值/示例 |
|--------|------|-------------|
| `MONGODB_URI` | MongoDB 连接字符串（Docker 内用服务名 `mongodb`） | 本地开发: `mongodb://localhost:27017/school_cms`；Docker/NAS: `mongodb://mongodb:27017/school_cms` |
| `JWT_SECRET` | JWT 加密密钥 (至少32位) | 自动生成或自定义 |
| `ADMIN_USERNAME` | 管理员账号 | `admin` |
| `ADMIN_PASSWORD` | 管理员密码 | `jintu123` |
| `PORT` | 应用运行端口 | `3000` |

## 📁 目录结构

```
.
├── app/                    # Next.js 路由页面（Admin 后台）
├── components/             # React 组件
├── deploy/                 # 绿联 NAS 部署用（Dockerfile.prod、docker-compose.prod）
├── docs/                   # 文档（外网访问说明、方案设计等）
├── jintu-attendance-app/   # 移动端 App（Capacitor + Vite，独立子项目）
├── lib/                    # API 响应、数据库连接等
├── models/                 # Mongoose 数据模型
├── public/                 # 静态资源
├── scripts/                # 部署与数据库脚本（deploy.sh、导出/导入等）
├── services/               # 业务服务层
├── types/                  # 类型定义
├── docker-compose.yml      # 本地/开发用 Docker（可选）
├── Dockerfile              # 本地构建用（可选）
└── middleware.ts           # 路由鉴权中间件
```

## 🛡️ API 规范

所有 API 均采用统一响应格式：

```typescript
// 成功响应
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}

// 失败响应
{
  "success": false,
  "message": "错误描述",
  "error": { ... } // 可选的详细错误信息
}
```
