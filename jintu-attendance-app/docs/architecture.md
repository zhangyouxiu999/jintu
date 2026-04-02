# 技术、开发与发布说明

## 1. 文档定位

本文档合并了原先的架构说明、开发说明和打包发布说明，统一回答这 3 类问题：

- 项目现在的技术结构是什么
- 日常开发应该遵守什么约定
- 如何构建、同步和打包交付

## 2. 技术栈

- `Vite`
- `React 18`
- `TypeScript`
- `Tamagui`
- `Tailwind CSS`
- `Capacitor 6`

## 3. 整体结构

项目采用 Web 前端 + Capacitor 原生壳的方式交付：

- `src/`：页面、组件、hooks、store
- `src/tamagui.config.ts`：主题、tokens 与组件运行时配置
- `android/` / `ios/`：原生容器
- `dist/`：前端构建产物

应用为单端、本地优先架构，不依赖服务端才能完成核心使用链路。

## 4. 当前目录结构

| 目录 | 说明 |
|------|------|
| `src/pages` | 页面级组件 |
| `src/components` | 通用组件与 UI 封装 |
| `src/hooks` | 页面数据和交互 hooks |
| `src/store` | 本地数据存储与 hydrate |
| `src/lib` | 工具函数与平台能力封装 |
| `docs` | 正式维护文档 |
| `docs/archive` | 历史报告和实验归档 |
| `android` / `ios` | 原生工程 |

## 5. 路由组织

### 5.1 正式路由

- `/login`
- `/class-setup`
- `/`
- `/attendance/:classId`
- `/students/:classId`
- `/schedule/:classId`
- `/grades/:classId`
- `/history/:classId`
- `/more`
- `/classes`

### 5.2 兼容重定向

- `/schedule`、`/grades`、`/history` 自动补全为当前班级路由
- `/settings`、`/templates` 重定向到 `/more`

### 5.3 页面骨架

`AppLayout` 是业务页统一外壳，负责：

- 提供当前班级上下文
- 渲染顶部“当前班级入口”
- 管理班级抽屉与切换逻辑
- 渲染统一内容区

`src/components/ui/*` 当前统一基于 `Tamagui` 封装，移动端弹层优先使用 `Dialog / AlertDialog / Sheet` 能力。
其中 `src/components/ui/app-ui.tsx` 作为聚合出口，具体按 `core / list / overlays` 分拆维护，避免继续把页面骨架、列表行和弹层节奏堆进单文件。

## 6. 数据存储

当前数据默认保存在浏览器 / WebView 的 `localStorage`。

### 6.1 主要 store

- `src/store/classes.ts`
- `src/store/students.ts`
- `src/store/attendance.ts`
- `src/store/grades.ts`
- `src/store/schedule.ts`
- `src/store/storage.ts`

应用启动时通过 `src/store/db.ts` 执行 hydrate。

### 6.2 数据约定

- 默认以本地存储为主
- 调整存储结构时优先保持兼容读取
- 不随意修改既有 key 名称
- 原生更新应尽量保持数据可延续

## 7. 页面职责拆分

- `Attendance`：页面壳负责路由与组合，过滤/虚拟列表/公告弹层状态下沉到 page hook 与片段组件
- `StudentListPage`：名单维护与导入导出
- `Schedule` / `Grades` / `History`：当前班级扩展页
- `Grades`：页面壳负责组合，学期/科目/导入导出等状态下沉到 page hook 与片段组件
- `MorePage`：当前班级切换、模板、偏好、退出登录
- `ClassList`：低频班级管理

## 8. 原生能力边界

项目优先使用 Capacitor 能力，同时保留 Web 回退：

- 分享 / 下载
- 剪贴板
- 生命周期监听
- 安卓返回键
- 安全区适配

## 9. 开发环境

建议使用：

- Node.js 18+
- npm
- macOS
- Android Studio / Xcode（按需）

## 10. 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动本地开发环境 |
| `npm run lint` | 执行 ESLint 检查 |
| `npm run build` | 生产构建 |
| `npm run test:e2e` | 执行 Playwright 回归 |
| `npm run cap:sync` | 构建并同步到 Capacitor 原生工程 |
| `npm run android` | 打开 Android 工程 |
| `npm run ios` | 打开 iOS 工程 |
| `npm run apk:debug` | 生成 Android 测试安装包 |
| `npm run apk:release` | 生成 Android Release 包 |

## 11. 开发约定

### 11.1 路由开发约定

新增页面前，先明确它属于：

- 点名主链路
- 当前班级扩展
- 更多工具
- 低频管理

不要重新引入并列一级导航心智。

### 11.2 UI 与交互约定

- 共享 UI 组件优先在 `src/components/ui/*` 调整
- 页面动作优先收敛到统一组件层，不在页面内各写一套
- 学生维护逻辑优先放在学生名单页，不回流到点名页

### 11.3 目录与实验约定

- 实验性页面、脚本、截图不要直接留在运行时目录
- 一次性审查与设计提取物统一归档到 `docs/archive/`

## 12. 构建与同步

前端代码有变更后，先构建并同步到原生工程：

```bash
npm run cap:sync
```

其中 `cap:sync` 等价于先执行 `npm run build`，再执行 `npx cap sync`。

## 13. Android 打包

### 13.1 打开工程

```bash
npm run android
```

### 13.2 生成测试安装包

```bash
npm run apk:debug
```

产物路径：

- `android/app/build/outputs/apk/debug/app-debug.apk`

### 13.3 生成 Release 包

```bash
npm run apk:release
```

若已配置签名，产物通常为：

- `android/app/build/outputs/apk/release/app-release.apk`

### 13.4 Android Release 签名

项目使用 `android/keystore.properties` 配置签名信息，典型流程如下：

1. 在 `android/` 下生成或准备 `.jks` 密钥库
2. 复制 `android/keystore.properties.example` 为 `android/keystore.properties`
3. 填写 `storeFile`、`storePassword`、`keyAlias`、`keyPassword`
4. 回到项目根目录执行 `npm run apk:release`

注意：

- `keystore.properties` 和 `.jks` 不应提交到仓库
- 如仅需测试分发，优先使用 `npm run apk:debug`

## 14. iOS 打包

### 14.1 打开工程

```bash
npm run ios
```

### 14.2 首次依赖安装

如本机首次运行 iOS 工程，通常还需要在 `ios/App` 下安装 Pods：

```bash
cd ios/App
pod install
```

### 14.3 常规流程

1. 执行 `npm run cap:sync`
2. 打开 Xcode 工程
3. 在 Xcode 中选择模拟器或真机运行
4. 需要正式包时使用 `Product -> Archive`

## 15. 更新与数据保留

当前数据主要保存在设备本地。为了保证更新后数据不丢失，应遵守以下约定：

- 覆盖安装，不要卸载后重装
- 保持 `appId` / 包名不变
- 不要随意修改既有本地存储键名
- 如未来调整存储结构，应提供兼容读取或迁移逻辑

## 16. 发布前检查

- 已执行 `npm run build`
- 原生工程已同步
- Android / iOS 版本号已确认
- Android 签名配置已确认
- 若为生产构建，已确认环境变量与品牌信息配置正确

## 17. 清理后的约束

- 运行时不再保留原型实验页和原型专用样式
- 一次性审查与设计提取物统一归档到 `docs/archive/`
- 新增实验内容必须与正式运行路径隔离
