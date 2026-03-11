/**
 * 复制文本到剪贴板。在 Android/iOS 上使用 Capacitor Clipboard 插件（WebView 内 navigator.clipboard 常不可用），在浏览器上使用 Clipboard API。
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { Clipboard } = await import('@capacitor/clipboard')
      await Clipboard.write({ string: text })
      return
    }
  } catch {
    /* 非原生或插件未安装时继续用 Web API */
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
  } else {
    throw new Error('Clipboard not available')
  }
}
