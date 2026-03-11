# 考勤 App（轻量版）

仅 iOS / Android 本地 App，离线纯本地，只需**班级名称 + 学生姓名**。

## 从 0 到落地

**请阅读 [从0到落地步骤.md](./从0到落地步骤.md)**，按阶段完成数据层、页面与原生能力。

本仓库已包含：

- Vite + React + TypeScript + Tailwind
- HashRouter 与页面：登录、班级列表、点名、历史、课程表、成绩、模板、设置
- 本地数据层（localStorage）与 `src/types` 与《最优技术方案》一致
- Capacitor 6：Share、Filesystem、安全区等已接入

更多阶段与扩展见 [从0到落地步骤.md](./从0到落地步骤.md)；**全部文档索引**见 [docs/README.md](./docs/README.md)。

## 本地运行（浏览器）

```bash
npm install
npm run dev
```

若出现 `vite: command not found` 或启动失败，多半是依赖解压不完整（路径含中文/空格时偶发），可清除后重装：

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

构建：

```bash
npm run build
```

## 商用部署（售卖账号 + 本地 App）

若通过**售卖账号**方式卖本地 App，请务必：

1. **配置登录凭据**：复制 `.env.example` 为 `.env`，设置 `VITE_LOGIN_USERNAME` 与 `VITE_LOGIN_PASSWORD`（生产构建下未配置则无法登录）。
2. **可选品牌**：通过 `VITE_APP_NAME` 修改应用展示名称。
3. **两种卖法**：见 [docs/售卖账号模式说明.md](./docs/售卖账号模式说明.md)——**一客户一包**（无需后端）或**通用包+多账号**（需简易登录校验接口）。
4. **路线图**：见 [docs/商用化路线图.md](./docs/商用化路线图.md)。

## 打包与分发

- **Android 打包**：见 [ANDROID_BUILD.md](./ANDROID_BUILD.md)；带签名 Release 见 [docs/带签证打包-Android.md](./docs/带签证打包-Android.md)。
- **iOS 打包**：见 [IOS_BUILD.md](./IOS_BUILD.md)。
- **更新 App 不丢数据**：见 [docs/App更新与数据保留.md](./docs/App更新与数据保留.md)。  
- **文档总览**：见 [docs/README.md](./docs/README.md)。

## 设计文档（在 admin 项目中）

- `../docs/点名页-离线纯本地设计方案.md`
- `../docs/点名页-最优技术方案（详细）.md`

当前 **admin 项目保持不动**，本文件夹为独立新项目。
