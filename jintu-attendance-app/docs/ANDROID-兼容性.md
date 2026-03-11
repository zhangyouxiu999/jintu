# Android 兼容性说明

本说明汇总考勤 App 在 Android 上的兼容性检查与已做适配。

## 环境

- **Capacitor**: 6.x
- **minSdkVersion**: 22
- **targetSdkVersion**: 34
- **路由**: HashRouter，适合 Capacitor 无服务器场景

## 已适配项

### 1. 返回键与返回手势
- `BackHandler` 使用 `@capacitor/app` 的 `backButton` 事件，在 Android 上可正确响应系统返回键/手势；在根路由时退出应用，否则 `history.back()`。

### 2. 剪贴板
- `src/lib/clipboard.ts` 在 `Capacitor.isNativePlatform()` 时使用 `@capacitor/clipboard` 写入剪贴板，避免 WebView 内 `navigator.clipboard` 不可用的问题。

### 3. 历史考勤导出 Excel
- Android WebView 中通过 `<a download>` + blob URL 无法可靠保存文件。
- **处理方式**：在原生平台使用 `@capacitor/filesystem` 将 xlsx 写入 Cache 目录，再用 `@capacitor/share` 调起系统分享，用户可保存到文件或分享到其他应用；浏览器端仍使用原有 blob + a.download。

### 4. 安全区与布局
- `index.html` 已设置 `viewport-fit=cover`。
- CSS 使用 `env(safe-area-inset-*)`，并设回退值 `0px`，在支持安全区的设备上可正确留白，旧设备不会错位。

### 5. 存储
- 使用 `localStorage` / `sessionStorage`，Android WebView 完全支持；数据在 App 内持久化。

## 通用兼容点

| 项目         | 说明 |
|--------------|------|
| 触摸事件     | 使用标准 `TouchEvent`，Android 支持正常。 |
| 玻璃拟态     | `backdrop-filter` 与 `-webkit-backdrop-filter`，Android Chromium WebView 支持。 |
| 字体         | Google Fonts（Plus Jakarta Sans）通过 INTERNET 权限加载，可考虑后续打包字体以减少依赖。 |
| crypto       | `db.ts` 中 `crypto.randomUUID()` 在 Android WebView 可用，并有降级实现。 |
| 确认框       | `window.confirm` 在 WebView 中可用。 |
| Toast        | 使用 DOM 创建节点并挂到 `body`，在 WebView 中无问题。 |

## 构建与运行

- 开发：`npm run build && npx cap sync android && npx cap open android`
- 打包 APK：`npm run apk:release`（release）或 `npm run apk:debug`（debug）
- Release 需配置 `android/keystore.properties`，参见项目内 Android 构建文档。

## 建议

1. **字体**：若需完全离线或减少首屏请求，可将 Plus Jakarta Sans 打包进 assets 或使用系统字体作为回退。
2. **存储**：若后续需要更大容量或结构化存储，可考虑迁移到 Capacitor Preferences 或 SQLite。
3. **导出**：当前导出在 Android 上通过「分享」保存；若需固定保存到「下载」目录，可再接入 Download Manager 或额外权限与 UI。

上述项均已按 Android 兼容方式实现或留有回退，整体可在 Android 上正常使用。
