/**
 * 存储初始化：从本地持久化恢复，后续可替换为 Capacitor Preferences / SQLite。
 */
import * as classesStore from './classes'
import * as studentsStore from './students'
import * as attendanceStore from './attendance'
import * as announcementsStore from './announcements'
import { storage } from './storage'

let initialized = false

export async function init(): Promise<void> {
  if (initialized) return
  try {
    // schema v3：保留班级/学生/课表/成绩，重置旧 attendance 数据
    storage.migrateToV3()

    const classesData = storage.loadClasses()
    if (classesData != null) classesStore.hydrateFromPersisted(classesData)

    const studentsData = storage.loadStudents()
    if (studentsData != null) studentsStore.hydrateFromPersisted(studentsData)

    attendanceStore.hydrateFromPersisted()

    const announcementsData = storage.loadAnnouncements()
    if (announcementsData != null) announcementsStore.hydrateFromPersisted(announcementsData)
  } catch (e) {
    console.warn('[db] hydrate from storage failed:', e)
  }
  initialized = true
}

export function isInitialized(): boolean {
  return initialized
}

export function uuid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/x/g, () =>
        ((Math.random() * 16) | 0).toString(16)
      )
}
