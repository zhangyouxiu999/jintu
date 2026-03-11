#!/usr/bin/env bash
# 安装 Android 打包所需 JDK 17（macOS）
# 用法：在终端执行 ./scripts/install-jdk-macos.sh

set -e

echo "检查 Java..."
if java -version 2>&1 | grep -q "version"; then
  echo "已检测到 Java，无需安装。"
  java -version
  exit 0
fi

echo "未检测到可用 Java，需要安装 JDK 17。"
echo ""

# 1. Xcode 许可
echo "步骤 1/2：接受 Xcode 许可（会提示输入本机密码）"
if ! xcodebuild -version &>/dev/null; then
  echo "请在本机终端执行："
  echo "  sudo xcodebuild -license accept"
  echo "执行完成后重新运行本脚本。"
  exit 1
fi

# 2. 安装 JDK 17
if ! command -v brew &>/dev/null; then
  echo "未检测到 Homebrew，请用「方式 B」手动安装 JDK 17（无需安装 brew）："
  echo ""
  echo "  1. 浏览器打开："
  echo "     Intel Mac: https://adoptium.net/temurin/releases/?os=macos&arch=x64&version=17"
  echo "     Apple 芯片: https://adoptium.net/temurin/releases/?os=macos&arch=aarch64&version=17"
  echo "  2. 下载 .pkg 并双击安装"
  echo "  3. 新开终端，在项目根目录执行: npm run apk"
  echo ""
  exit 1
fi

echo "步骤 2/2：用 Homebrew 安装 OpenJDK 17..."
brew install openjdk@17

# 3. 提示 PATH
echo ""
echo "安装完成。若仍提示找不到 java，请执行以下之一："
echo "  方式 A：新开终端后执行"
echo "    export PATH=\"\$(brew --prefix)/opt/openjdk@17/bin:\$PATH\""
echo "  方式 B：创建系统链接（需输入密码）"
echo "    sudo ln -sfn \$(brew --prefix)/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk"
echo ""
echo "然后在本项目根目录执行： npm run apk"
