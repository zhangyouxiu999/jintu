# iOS 打包说明

当前已配置 **Capacitor 6**，并生成好 `ios/` 原生工程，可直接在 Xcode 中打开并打包。

## 环境要求

- **macOS**
- **Xcode 15+**（App Store 安装完整 Xcode，不要只用 Command Line Tools）
- **CocoaPods**：`sudo gem install cocoapods` 或 `brew install cocoapods`

## 首次在本机安装依赖（仅需一次）

1. 切换为完整 Xcode（若当前是 Command Line Tools）：
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

2. 安装 CocoaPods（若未安装）：
   ```bash
   sudo gem install cocoapods
   # 或
   brew install cocoapods
   ```

3. 在项目根目录安装 iOS 原生依赖：
   ```bash
   cd ios/App && pod install && cd ../..
   ```

## 日常打包流程

1. **先构建网页**（有代码改动时）：
   ```bash
   npm run build
   ```

2. **同步到 iOS 工程**：
   ```bash
   npx cap sync ios
   ```

3. **用 Xcode 打开**：
   ```bash
   npx cap open ios
   ```
   或直接双击打开 `ios/App/App.xcworkspace`（务必用 .xcworkspace，不要用 .xcodeproj）。

4. 在 Xcode 中：
   - 选择真机或模拟器
   - 菜单 **Product → Archive** 可打正式包
   - 或 **Product → Run** 在模拟器/真机运行

## 快捷命令

- `npm run cap:sync`：build 并 sync 到 ios + android（不打开 IDE）
- `npm run ios`：先 cap:sync，再打开 Xcode
- `npm run android`：先 cap:sync，再打开 Android Studio

## 应用信息

- **App ID**：`io.jintu.attendance`
- **显示名称**：由 `capacitor.config.ts` 的 `appName` 决定（或前端通过 `VITE_APP_NAME` 配置），修改后需 `npx cap sync ios`。

## 没有 Apple 开发者账号（免费使用）

不付费也能在 iOS 上跑起来，只是有范围限制：

| 方式 | 需要账号 | 说明 |
|------|----------|------|
| **模拟器** | 不需要 | 在 Xcode 里选任意 iPhone/iPad 模拟器，**Product → Run** 即可，无时间限制 |
| **自己的 iPhone/iPad** | 免费 Apple ID | 用数据线连电脑，Xcode 里选真机 **Run**，App 会装到手机上，**约 7 天后需重新用 Xcode 跑一次**（免费签名有效期 7 天） |
| **导出 .ipa 装自己设备** | 免费 Apple ID | 用免费账号 Archive → Distribute App → **Development** 可导出 .ipa，装到**本机已连过、信任过的设备**，同样 7 天有效 |

**免费 Apple ID 设置**：Xcode → **Settings（或 Preferences）→ Accounts** → 左下角 **+** → **Apple ID**，用你的 iCloud/邮箱登录即可。登录后回到项目 **Signing & Capabilities** 里选自动签名，Team 会显示 “Personal Team”。

**没有付费账号时不能做的**：不能打「给其他人随便安装」的包（Ad Hoc 要付费）、不能上架 App Store。

---

## 其他可用的分发方式（想「随便装」时）

在不想买 Apple 开发者账号的前提下，还可以用下面几种方式让更多人用上：

| 方式 | 适用设备 | 说明 |
|------|----------|------|
| **PWA / 网页「添加到主屏幕」** | iOS、Android | 把前端打包后的网站部署到任意 **HTTPS** 地址（如你的服务器、Vercel、Netlify）。用户用 **Safari** 打开链接 → 点分享 → **「添加到主屏幕」**，桌面会出现图标，点开像 App 一样全屏用。**不需要 Apple 账号、无 7 天限制、任何人可装**。需保证页面在移动端适配良好。 |
| **直接发链接用浏览器打开** | iOS、Android | 不「安装」App，只发一个网址。用户用 Safari/Chrome 打开即可使用。最简单，无需打包、无需签名；缺点是没有桌面图标、体验略像网页。 |
| **做 Android 版，发 APK** | 仅 Android | 用 Capacitor 加一层 `@capacitor/android`，打 **release APK**。用户下载 .apk 安装（需允许「未知来源」）。**真正的随便装**，不限于 iOS。 |
| **第三方签名 / 企业签** | 仅 iOS | 市面上有通过企业证书或滥用开发者账号做「签名」的服务，把 .ipa 签成「可安装」。**违反 Apple 条款**，证书容易被封、App 会被撤销，且存在安全与隐私风险，**不推荐**。 |

**推荐组合**：  
- 主要用户是 **iPhone** → 用 **PWA**（部署网页 + 添加到主屏幕）。  
- 有 **Android** 用户 → 再加 **Android 工程打 APK**，实现两边都能随便装。

---

## 打包为 iOS 安装包（.ipa）

要得到可在真机安装的 **.ipa**，必须在 Xcode 里完成「归档 → 导出」：

### 1. 前置条件

- 本机已用 **完整 Xcode**，且执行过 `pod install`（见上文）
- **Apple 账号**：免费 Apple ID 即可导出 Development 包（仅限自己设备、7 天有效）；要 Ad Hoc / 上架需**付费开发者账号**（$99/年）

### 2. 在 Xcode 里打包出 .ipa

1. **同步最新网页**（项目根目录）：
   ```bash
   npm run build && npx cap sync ios
   ```

2. **用 Xcode 打开**：
   ```bash
   npx cap open ios
   ```
   或双击 `ios/App/App.xcworkspace`。

3. **配置签名**（首次必须做）：
   - 左侧选中 **App** 工程 → 选中 **App** target
   - 顶部 **Signing & Capabilities** → 勾选 **Automatically manage signing**
   - 选你的 **Team**（用 Apple ID 登录后会出现）
   - 若没有 Team：Xcode → Settings → Accounts → 添加 Apple ID

4. **选真机再归档**：
   - 顶部设备选 **Any iOS Device (arm64)**（不要选模拟器）
   - 菜单 **Product → Archive**
   - 等待归档完成，会弹出 **Organizer** 窗口

5. **导出 .ipa**：
   - 在 Organizer 里选中刚生成的 Archive → 点 **Distribute App**
   - 选 **Ad Hoc**（仅限已登记设备）或 **Development**（开发安装）→ Next
   - 按提示选签名和导出路径 → **Export**，即得到 `.ipa` 和安装说明

### 3. 安装到手机

- **Development**：用数据线连手机，Xcode 里选该设备 Run，或把 .ipa 拖到 **Apple Configurator** / **爱思助手** 等工具安装（需设备已信任证书）
- **Ad Hoc**：先把设备 UDID 加入开发者后台，导出时勾选该设备，再用 **Apple Configurator** 或 **爱思助手** 安装该 .ipa

**不能**像 Android 那样「直接打一个任意手机都能装的安装包」：iOS 安装包必须用 Apple 的签名与分发方式（开发 / Ad Hoc / 企业 / App Store）。

---

## 若出现 “pod install” 报错

- 确保已安装完整 **Xcode**，且 `xcode-select` 指向 Xcode
- 确保已安装 **CocoaPods**，并进入 `ios/App` 再执行 `pod install`
