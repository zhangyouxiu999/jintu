import { useEffect } from 'react'

/**
 * Android 返回键 / 系统返回手势：执行 history.back()，仅在根路由时退出应用。
 * 已去掉左/右边缘滑动手势返回。
 */
export default function BackHandler() {
  useEffect(() => {
    let listenerPromise: Promise<{ remove: () => Promise<void> }> | null = null
    import('@capacitor/core').then(({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return
      return import('@capacitor/app').then(({ App: CapacitorApp }) => {
        listenerPromise = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back()
          } else {
            CapacitorApp.exitApp()
          }
        })
        return listenerPromise
      })
    }).catch(() => {})
    return () => {
      listenerPromise?.then((l) => l.remove()).catch(() => {})
    }
  }, [])

  return null
}
