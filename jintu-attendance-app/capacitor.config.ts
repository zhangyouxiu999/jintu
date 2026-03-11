import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.jintu.attendance',
  appName: '稍微一点',
  webDir: 'dist',
  server: {
    // 本地开发时可指向 Vite 地址；打包后使用内置 webDir
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config
