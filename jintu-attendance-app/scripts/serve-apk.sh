#!/usr/bin/env bash
# 在 release APK 目录启动 HTTP 服务，供同一 WiFi 下的手机下载
# 用法：在项目根目录执行 npm run apk:serve

cd "$(dirname "$0")/.." || exit 1
RELEASE_DIR="android/app/build/outputs/apk/release"
PORT="${APK_SERVE_PORT:-8080}"

if [ ! -d "$RELEASE_DIR" ]; then
  echo "未找到 APK 目录，请先执行: npm run apk:release"
  exit 1
fi

# 获取本机 IP（WiFi 一般为 en0）
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
echo "-------------------------------------------"
echo "APK 下载已启动"
echo "同一 WiFi 下，其他手机浏览器打开："
echo "  http://${IP}:${PORT}"
echo "点击 app-release.apk 即可下载"
echo "-------------------------------------------"
echo "按 Ctrl+C 停止服务"
echo ""

cd "$RELEASE_DIR" && exec python3 -m http.server "$PORT"
