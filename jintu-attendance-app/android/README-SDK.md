# 安装 Android SDK

当前报错 "SDK location not found" 说明本机**还没有 Android SDK**。任选下面一种方式安装即可。

---

## 方式一：安装 Android Studio（最简单，推荐）

1. 浏览器打开：**https://developer.android.com/studio**
2. 下载 **Android Studio** 的 .dmg，双击安装，把应用拖到「应用程序」。
3. **首次打开 Android Studio**，按向导下一步，在「Setup」里会提示安装 **Android SDK**，用默认位置（会装到 `~/Library/Android/sdk`）。
4. 等 SDK 下载完成。装好后关掉终端再开，在项目根目录执行：
   ```bash
   npm run apk:debug
   ```

此时项目里的 `android/local.properties`（`sdk.dir=/Users/cc/Library/Android/sdk`）会自动生效。

---

## 方式二：只装命令行版 SDK（不装 Android Studio）

适合只想打 APK、不想装完整 IDE 的情况。需要本机已装 **JDK 17**。

### 步骤 1：下载 Command Line Tools

1. 浏览器打开：**https://developer.android.com/studio#command-line-tools-only**
2. 在「Command line tools only」里选 **macOS**，下载 `.zip`（例如 `commandlinetools-mac-xxxxx_latest.zip`）。
3. 下载完成后记住保存位置（一般在「下载」里）。

### 步骤 2：解压并放到正确目录

在终端执行（把 `~/Downloads/commandlinetools-mac-xxx_latest.zip` 换成你实际下载的文件名）：

```bash
mkdir -p ~/Library/Android/sdk/cmdline-tools
unzip ~/Downloads/commandlinetools-mac-*_latest.zip -d ~/Library/Android/sdk/cmdline-tools
mv ~/Library/Android/sdk/cmdline-tools/cmdline-tools ~/Library/Android/sdk/cmdline-tools/latest
```

### 步骤 3：安装构建所需的包

```bash
export PATH="$HOME/Library/Android/sdk/cmdline-tools/latest/bin:$PATH"
yes | sdkmanager --licenses
sdkmanager "platform-tools" "build-tools;34.0.0" "platforms;android-34"
```

### 步骤 4：打 APK

关掉终端再开（或执行 `source ~/.zshrc` / `source ~/.bash_profile`），在项目根目录执行：

```bash
cd /Users/cc/Desktop/未命名文件夹\ 2/jintu/admin/jintu-attendance-app
npm run apk:debug
```

若希望以后终端都能找到 SDK，可把下面两行加到 `~/.zshrc` 或 `~/.bash_profile`：

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
```

---

## SDK 装在其他位置时

若你之前把 SDK 装到了别的目录，请编辑项目里的 **android/local.properties**，改成实际路径，例如：

```properties
sdk.dir=/你实际的/Android/sdk/路径
```

保存后再执行 `npm run apk:debug`。
