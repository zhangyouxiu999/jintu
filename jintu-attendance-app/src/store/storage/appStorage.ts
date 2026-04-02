import type { AnnouncementEntity, ClassEntity, StudentEntity } from '@/types'
import { load, save, safeRemove } from '@/store/storage/core'
import { STORAGE_KEYS } from '@/store/storage/keys'

export const appStorage = {
  saveClasses(data: ClassEntity[]) {
    save(STORAGE_KEYS.classes, data)
  },
  loadClasses(): ClassEntity[] | null {
    return load<ClassEntity[]>(STORAGE_KEYS.classes)
  },

  saveStudents(data: StudentEntity[]) {
    save(STORAGE_KEYS.students, data)
  },
  loadStudents(): StudentEntity[] | null {
    return load<StudentEntity[]>(STORAGE_KEYS.students)
  },

  saveAnnouncements(data: AnnouncementEntity[]) {
    save(STORAGE_KEYS.announcements, data)
  },
  loadAnnouncements(): AnnouncementEntity[] | null {
    return load<AnnouncementEntity[]>(STORAGE_KEYS.announcements)
  },

  saveAppTitle(title: string) {
    save(STORAGE_KEYS.appTitle, title)
  },
  loadAppTitle(): string | null {
    return load<string>(STORAGE_KEYS.appTitle)
  },

  saveAuth(loggedIn: boolean) {
    save(STORAGE_KEYS.auth, loggedIn)
  },
  loadAuth(): boolean {
    return load<boolean>(STORAGE_KEYS.auth) === true
  },

  saveCurrentClassId(id: string | null) {
    try {
      if (id == null) {
        safeRemove(STORAGE_KEYS.currentClassId)
      } else {
        save(STORAGE_KEYS.currentClassId, id)
      }
    } catch (error) {
      console.warn('[storage] saveCurrentClassId failed', error)
    }
  },
  loadCurrentClassId(): string | null {
    return load<string>(STORAGE_KEYS.currentClassId)
  },

  saveCurrentPeriodId(classId: string, periodId: string) {
    const map = load<Record<string, string>>(STORAGE_KEYS.currentPeriodIdByClass) ?? {}
    save(STORAGE_KEYS.currentPeriodIdByClass, { ...map, [classId]: periodId })
  },
  loadCurrentPeriodId(classId: string): string | null {
    const map = load<Record<string, string>>(STORAGE_KEYS.currentPeriodIdByClass)
    return map?.[classId] ?? null
  },

  saveAutoResetAttendance(enabled: boolean) {
    save(STORAGE_KEYS.autoResetAttendance, enabled)
  },
  loadAutoResetAttendance(): boolean {
    return load<boolean>(STORAGE_KEYS.autoResetAttendance) === true
  },
}
