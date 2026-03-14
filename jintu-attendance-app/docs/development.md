# 开发说明

## 项目定位

`jintu-attendance-app` 是一个独立的移动端考勤项目，基于 `Vite + React + TypeScript + Capacitor` 构建，当前以本地离线使用为主。

## 开发环境

建议使用：

- Node.js 18+
- npm
- macOS（如需 iOS 原生调试）
- Android Studio / Xcode（按需）

安装依赖并启动开发环境：

```bash
npm install
npm run dev
```

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 本地开发环境 |
| `npm run build` | 构建前端产物到 `dist/` |
| `npm run lint` | 执行 ESLint 检查 |
| `npm run preview` | 本地预览构建结果 |
| `npm run cap:sync` | 构建并同步到 Capacitor 原生工程 |
| `npm run android` | 构建、同步并打开 Android 工程 |
| `npm run ios` | 构建、同步并打开 iOS 工程 |

## 目录结构

| 目录 | 说明 |
|------|------|
| `src/` | 前端源码 |
| `src/pages/` | 页面级组件 |
| `src/components/` | 业务组件与基础 UI |
| `src/store/` | 本地数据存储与读写逻辑 |
| `src/lib/` | 工具函数与平台封装 |
| `android/` | Android 原生工程 |
| `ios/` | iOS 原生工程 |
| `docs/` | 项目文档 |

## 开发约定

- Web 开发阶段优先使用 `npm run dev`
- 原生能力相关改动后执行 `npm run cap:sync`
- 当前数据默认保存在本地，涉及存储结构调整时应考虑兼容旧数据
- 生产环境如启用登录校验，需配置 `.env` 中的 `VITE_LOGIN_USERNAME` 与 `VITE_LOGIN_PASSWORD`

## 从零搭建的历史说明

项目早期曾保留一份“从零创建项目到落地”的长文档，内容包含 Vite / Capacitor 初始化、目录搭建与页面拆分。整理后仅保留当前维护仍需要的开发说明；若需回溯历史记录，可查看 `docs/archive/README.md`。
