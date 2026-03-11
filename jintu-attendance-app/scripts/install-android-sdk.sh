#!/usr/bin/env bash
# 仅安装 Android 命令行 SDK（不装 Android Studio）
# 使用前请先到 https://developer.android.com/studio#command-line-tools-only 下载 macOS 的 commandlinetools-mac-*_latest.zip
# 用法：./scripts/install-android-sdk.sh [zip 文件路径]
# 示例：./scripts/install-android-sdk.sh ~/Downloads/commandlinetools-mac-11076708_latest.zip

set -e

SDK_ROOT="$HOME/Library/Android/sdk"
ZIP="${1:-}"

if [ -z "$ZIP" ]; then
  # 尝试在下载目录找
  ZIP=$(ls -t ~/Downloads/commandlinetools-mac-*_latest.zip 2>/dev/null | head -1)
fi

if [ -z "$ZIP" ] || [ ! -f "$ZIP" ]; then
  echo "请先下载 Command Line Tools："
  echo "  https://developer.android.com/studio#command-line-tools-only"
  echo "  选择 macOS，下载 .zip 后执行："
  echo "  $0 ~/Downloads/commandlinetools-mac-xxxxx_latest.zip"
  exit 1
fi

echo "使用: $ZIP"
echo "安装到: $SDK_ROOT"
mkdir -p "$SDK_ROOT/cmdline-tools"
unzip -o "$ZIP" -d "$SDK_ROOT/cmdline-tools"
if [ -d "$SDK_ROOT/cmdline-tools/cmdline-tools" ] && [ ! -d "$SDK_ROOT/cmdline-tools/latest" ]; then
  mv "$SDK_ROOT/cmdline-tools/cmdline-tools" "$SDK_ROOT/cmdline-tools/latest"
fi

export PATH="$SDK_ROOT/cmdline-tools/latest/bin:$PATH"
echo "接受许可..."
yes | sdkmanager --licenses || true
echo "安装 platform-tools, build-tools, platforms;android-34..."
sdkmanager "platform-tools" "build-tools;34.0.0" "platforms;android-34"

echo ""
echo "安装完成。请新开终端，在项目根目录执行: npm run apk"
echo "若仍报错，可在当前终端执行: export ANDROID_HOME=$SDK_ROOT 后再执行 npm run apk"
