# 考勤 App

基于 `Vite + React + TypeScript + Capacitor` 的移动端考勤工具，定位为老师个人使用的本地优先工作台。当前版本的产品主线已经收敛为：

`登录 -> 首次建班 -> 当前班级点名 -> 当前班级扩展能力 -> 更多工具`

## 当前产品结构

- 首页不再承担模块导航，登录后直接回到当前班级点名页。
- 学生名单、课表、成绩、历史都从顶部“当前班级”面板进入，始终围绕当前班级展开。
- “更多工具”承载当前班级切换、模板下载、自动重置考勤、退出登录等低频动作，但完整班级维护已收口到班级管理页。
- 班级管理页保留为深层低频页面，负责改名、删除、整班导出等操作。

## 技术栈

- `Vite`
- `React 18`
- `TypeScript`
- `Tamagui`
- `Tailwind CSS`
- `Capacitor 6`

## 本地开发

```bash
npm install
npm run dev
```

## 常用命令

```bash
npm run lint
npm run build
npm run test:e2e
npm run cap:sync
```

## 主要路由

- `/login`：登录
- `/class-setup`：首次建班流程
- `/`：首页入口，自动进入当前班级点名或首次建班
- `/attendance/:classId`：当前班级点名页
- `/students/:classId`：当前班级学生名单
- `/schedule/:classId`：当前班级课表
- `/grades/:classId`：当前班级成绩
- `/history/:classId`：当前班级历史考勤
- `/more`：班级切换、模板、偏好、退出登录
- `/classes`：班级管理

## 文档入口

- 产品与交互说明：[docs/PRD.md](./docs/PRD.md)
- 技术、开发与发布说明：[docs/architecture.md](./docs/architecture.md)
- 文档索引：[docs/README.md](./docs/README.md)
- 历史归档：[docs/archive/README.md](./docs/archive/README.md)
