# Android 打包说明

项目已配置 **Capacitor 6**，并包含 `android/` 原生工程，可打包成 **APK**，供用户直接安装（无需 Google 账号、无 7 天限制，**随便装**）。

---

## 总结（快速参考）

### 环境与打包

| 事项 | 说明 |
|------|------|
| **环境** | 需要 **JDK 17** + **Android SDK**。SDK 可通过安装 [Android Studio](https://developer.android.com/studio) 获得（默认装到 `~/Library/Android/sdk`）。 |
| **打可安装的 APK（推荐）** | 在项目根目录执行 **`npm run apk:debug`**，得到**已签名**的 APK，可直接发给别人安装。 |
| **APK 输出位置** | **可安装的包**：`android/app/build/outputs/apk/debug/app-debug.apk`<br>未签名 release：`android/app/build/outputs/apk/release/app-release-unsigned.apk`（部分手机会报「没有证书」） |
| **SDK 位置** | 默认 `~/Library/Android/sdk`；项目里 `android/local.properties` 已指向该路径。 |
| **常用命令** | `npm run apk:debug` 打可安装包；`npm run apk:release` 打 release（需配置 keystore）；`npm run android` 先同步再打开 Android Studio。 |

**若提示「没有证书」**：改用 **`npm run apk:debug`** 生成的 **app-debug.apk**，该包带 debug 签名，可正常安装。

### 如何让其他手机下载并安装

**先准备好可安装的 APK**：执行 `npm run apk:debug`，使用下面的 **app-debug.apk**（路径：`android/app/build/outputs/apk/debug/app-debug.apk`）。

| 方式 | 操作步骤 |
|------|----------|
| **微信 / QQ / 钉钉** | 电脑上把 **app-debug.apk** 发到群聊或「文件传输助手」。对方手机打开对应聊天，点文件下载到手机，在「文件管理」或「下载」里找到该 APK，点击安装（需允许「安装未知应用」）。 |
| **网盘分享** | 将 **app-debug.apk** 上传到百度网盘 / 阿里云盘 / 微云等，生成分享链接或二维码发给对方。对方用手机浏览器或网盘 App 打开链接，下载 APK 后点击安装。 |
| **数据线 (USB)** | 用数据线连接电脑与手机，把 **app-debug.apk** 复制到手机存储（如 `Download` 文件夹）。在手机上用「文件管理」找到该文件，点击安装。 |
| **同一 WiFi 下载页** | 在电脑上进入 APK 所在目录，执行：<br>`cd android/app/build/outputs/apk/debug`<br>`python3 -m http.server 8080`<br>在「系统设置 → 网络」中查看电脑本机 IP（如 `192.168.1.100`）。对方手机连**同一 WiFi**，浏览器打开 `http://192.168.1.100:8080`，点击 **app-debug.apk** 下载，下载完成后在「下载」中点击安装。 |

**安装前提醒对方**：在系统设置中允许「安装未知来源应用」或对浏览器/文件管理器授予「安装未知应用」权限（不同品牌在「安全」或「应用管理」中设置）。

---

## 环境要求

- **Android Studio**（推荐最新稳定版，带 Android SDK；若只用命令行打包，可不装，但需 JDK）
- **JDK 17**（用 `npm run apk:debug` / `apk:release` 打 APK 时必须：安装 JDK 并确保 `java` 在 PATH 中，或设置 `JAVA_HOME`）
- **Android SDK**（用 `apk:debug` / `apk:release` 时也必须：安装 **Android Studio** 后会自带 SDK，默认在 `~/Library/Android/sdk`；项目里已用 `android/local.properties` 的 `sdk.dir` 指向该路径，若你装到别处请修改该文件）

### 安装缺少的环境（macOS）

若执行 `npm run apk:release` 或 `npm run apk:debug` 报错 **Unable to locate a Java Runtime**，需要先安装 JDK 17。任选一种方式即可。

**方式 A：有 Homebrew 时**

1. 接受 Xcode 许可：`sudo xcodebuild -license accept`
2. 安装：`brew install openjdk@17`
3. 新开终端，或执行：`export PATH="$(brew --prefix)/opt/openjdk@17/bin:$PATH"` 后再执行 `npm run apk:debug`。

**方式 B：没有 Homebrew 时（推荐，不用装 brew）**

1. 打开浏览器访问：**https://adoptium.net/temurin/releases/?os=macos&arch=x64&version=17**  
   （若是 Apple 芯片 Mac，把 `arch=x64` 改成 `arch=aarch64`）
2. 下载 **.pkg** 安装包（例如 **Eclipse Temurin 17 (LTS)** 的 macOS PKG）。
3. 双击运行 .pkg，按提示完成安装。
4. **新开一个终端**，执行 `java -version` 应能看到 17.x。然后在本项目根目录执行 `npm run apk:debug` 即可。

安装后 JDK 一般在 `/Library/Java/JavaVirtualMachines/` 下，系统会自动把 `java` 加入 PATH。若新终端仍提示 `command not found`，可执行：
   ```bash
   export PATH="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home/bin:$PATH"
   ```
   再执行 `npm run apk:debug`。

**报错 `SDK location not found` / `ANDROID_HOME` 时**：说明本机还没有 Android SDK。请安装 **Android Studio**（https://developer.android.com/studio），安装过程中会下载 SDK 到 `~/Library/Android/sdk`。装好后直接再执行 `npm run apk:debug` 即可（项目已配置 `android/local.properties` 指向该默认路径）。

## 日常开发流程

1. **构建网页并同步到 Android**（有代码改动时）：
   ```bash
   npm run build && npx cap sync android
   ```
   或使用快捷命令（会同时 sync 到 iOS 和 Android）：
   ```bash
   npm run cap:sync
   ```

2. **同步并打开 Android Studio**：
   ```bash
   npm run android
   ```
   （= 先 build + sync，再打开 Android Studio。若只需打开 IDE 不同步，可执行 `npx cap open android`。）

3. 在 Android Studio 中：
   - 连真机或选模拟器，点 **Run** 运行
   - 或打 **release** 包（见下文）

## 快捷命令

- `npm run cap:sync`：build 并 sync 到 **ios + android**（不打开 IDE）
- `npm run android`：先 cap:sync，再打开 Android Studio
- `npm run ios`：先 cap:sync，再打开 Xcode

## 打包为 release APK（可随便装）

### 方式一：一条命令直接打出 APK（推荐）

在项目根目录执行（需本机已安装 **JDK 17** 并配置好 `JAVA_HOME` 或 `PATH`）：

```bash
npm run apk:release
```

未配置 keystore 时，APK 位于：

- **android/app/build/outputs/apk/release/app-release-unsigned.apk**

此为未签名包，部分设备可能无法安装。若需正式签名，见下方「方式二」或「命令行带签证打包」。可直接安装的包请用 **`npm run apk:debug`**。

### 方式二：命令行带签证打包（推荐，已接入项目）

项目已接入基于 **keystore.properties** 的 Release 签名，一条命令即可打出**已签名** release APK：

1. **首次配置（仅一次）**：在 `android/` 下生成密钥库并填写配置，详见 **docs/带签证打包-Android.md**。
2. **打包**：在项目根目录执行：
   ```bash
   npm run apk:release
   ```
   产物：`android/app/build/outputs/apk/release/app-release.apk`（已签名，可分发/上架）。

涉及文件：`android/keystore.properties`（勿提交）、`android/jintu-release-key.jks`（勿提交）、`android/app/build.gradle`（读取 keystore 并配置 signingConfigs）。完整配置与密钥生成见 **docs/带签证打包-Android.md**。

### 方式三：用 Android Studio 打（含签名）

要得到可发给他人安装的 **.apk**：

1. **同步最新网页**（项目根目录）：
   ```bash
   npm run build && npx cap sync android
   ```

2. **用 Android Studio 打开**：
   ```bash
   npx cap open android
   ```

3. **生成 release APK**：
   - 菜单 **Build → Build Bundle(s) / APK(s) → Build APK(s)**，或 **Build → Generate Signed Bundle / APK**（可选，用于上架或正式签名）
   - 未签名时得到 `android/app/build/outputs/apk/release/app-release-unsigned.apk`。若已按 **docs/带签证打包-Android.md** 配置 keystore，用 **npm run apk:release** 即可打出已签名 APK，无需在 Studio 里再配一次。

4. **在 Studio 内签名（可选）**：
   - **Build → Generate Signed Bundle / APK** → 选 **APK**
   - 创建或选择 keystore，按向导完成
   - 生成的已签名 APK 在 `android/app/release/` 或所选目录

5. **分发**：把 `.apk` 文件发给用户，用户在手机上允许「未知来源」后即可安装。

## 应用信息

- **applicationId**：`io.jintu.attendance`
- **显示名称**：由 `capacitor.config.ts` 的 `appName` 决定（或前端通过 `VITE_APP_NAME` 配置），修改后需 `npx cap sync android`。

## 与 iOS 的对比

| 项目     | Android                    | iOS（无付费开发者账号）   |
|----------|----------------------------|----------------------------|
| 安装包   | .apk                       | .ipa（需签名，免费 7 天）  |
| 分发方式 | 直接发 apk 文件，随便装    | PWA 或 7 天自签            |
| 签名     | 可自签 keystore，无年费    | 必须 Apple 签名           |
