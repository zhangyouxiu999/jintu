# 打包与发布

## 通用流程

前端代码有变更后，先构建并同步到原生工程：

```bash
npm run cap:sync
```

其中 `cap:sync` 等价于先执行 `npm run build`，再执行 `npx cap sync`。

## Android

### 打开工程

```bash
npm run android
```

### 生成测试安装包

```bash
npm run apk:debug
```

产物路径：

- `android/app/build/outputs/apk/debug/app-debug.apk`

### 生成 Release 包

```bash
npm run apk:release
```

若已配置签名，产物为：

- `android/app/build/outputs/apk/release/app-release.apk`

若未配置签名，通常会得到未签名的：

- `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### Android Release 签名

项目使用 `android/keystore.properties` 配置签名信息，典型流程如下：

1. 在 `android/` 下生成或准备 `.jks` 密钥库
2. 复制 `android/keystore.properties.example` 为 `android/keystore.properties`
3. 填写 `storeFile`、`storePassword`、`keyAlias`、`keyPassword`
4. 回到项目根目录执行 `npm run apk:release`

注意：

- `keystore.properties` 和 `.jks` 不应提交到仓库
- 如仅需测试分发，优先使用 `npm run apk:debug`

### Android 环境要求

- JDK 17
- Android SDK
- Android Studio（推荐）

若出现 `SDK location not found`、`Unable to locate a Java Runtime` 等问题，优先检查本机 JDK 与 Android SDK 是否已安装。

## iOS

### 打开工程

```bash
npm run ios
```

### 首次依赖安装

如本机首次运行 iOS 工程，通常还需要在 `ios/App` 下安装 Pods：

```bash
cd ios/App
pod install
```

### 常规流程

1. 执行 `npm run cap:sync`
2. 打开 Xcode 工程
3. 在 Xcode 中选择模拟器或真机运行
4. 需要正式包时使用 `Product -> Archive`

### iOS 环境要求

- macOS
- Xcode
- CocoaPods

## 更新与数据保留

当前数据主要保存在设备本地。为了保证更新后数据不丢失，应遵守以下约定：

- 覆盖安装，不要卸载后重装
- 保持 `appId` / 包名不变
- 不要随意修改既有本地存储键名
- 如未来调整存储结构，应提供兼容读取或迁移逻辑

## 发布前检查

- 已执行 `npm run build`
- 原生工程已同步
- Android / iOS 版本号已确认
- Android 签名配置已确认
- 若为生产构建，已确认环境变量与品牌信息配置正确
