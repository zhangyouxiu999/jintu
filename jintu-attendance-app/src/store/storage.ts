/**
 * App 本地持久化：localStorage，键前缀避免冲突。
 * 后续可替换为 Capacitor Preferences 或 SQLite。
 */
import { appStorage } from '@/store/storage/appStorage'
import { attendanceStorage } from '@/store/storage/attendanceStorage'
import { load, save } from '@/store/storage/core'
import { gradesStorage } from '@/store/storage/gradesStorage'
import { migrateToV3 } from '@/store/storage/migrations'
import { scheduleStorage } from '@/store/storage/scheduleStorage'

export const storage = {
  save,
  load,
  migrateToV3,
  ...appStorage,
  ...attendanceStorage,
  ...scheduleStorage,
  ...gradesStorage,
}
