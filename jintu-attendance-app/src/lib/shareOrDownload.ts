/**
 * 统一「原生端分享 / 浏览器下载」逻辑，避免多处重复。
 * 原生：写入 Cache 后调系统分享；浏览器：Blob + a.download。
 */
const SAFE_PATH_REGEX = /[/\\:*?"<>|]/g

function toSafePath(fileName: string): string {
  return fileName.replace(SAFE_PATH_REGEX, '_').trim() || 'file.xlsx'
}

/** ArrayBuffer 分块转 base64，避免大文件时 String.fromCharCode 参数过多 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export interface ShareOrDownloadOptions {
  /** 原生分享面板标题 */
  dialogTitle?: string
}

/**
 * 根据运行环境：原生端调用系统分享，浏览器端触发下载。
 * @param buffer 文件内容
 * @param fileName 文件名（含扩展名），会做安全字符替换后写入 Cache
 */
export async function shareOrDownloadFile(
  buffer: ArrayBuffer,
  fileName: string,
  options: ShareOrDownloadOptions = {}
): Promise<void> {
  const safePath = toSafePath(fileName)
  const { Capacitor } = await import('@capacitor/core')

  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const { Share } = await import('@capacitor/share')
    const base64 = arrayBufferToBase64(buffer)
    await Filesystem.writeFile({ path: safePath, data: base64, directory: Directory.Cache })
    const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path: safePath })
    await Share.share({
      title: fileName,
      dialogTitle: options.dialogTitle ?? '导出',
      files: [uri],
    })
    return
  }

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
