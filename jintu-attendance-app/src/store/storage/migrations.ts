import type { ScheduleDataByClass } from '@/types'
import { gradesStorage } from '@/store/storage/gradesStorage'
import { load, listKeysWithPrefix, save, safeRemove } from '@/store/storage/core'
import { SCHEMA_VERSION, STORAGE_KEYS, VERSIONED_KEYS, VERSIONED_PREFIX } from '@/store/storage/keys'
import { scheduleStorage } from '@/store/storage/scheduleStorage'

function clearAttendanceStorage(): void {
  safeRemove(STORAGE_KEYS.attendance)

  const prefixes = [
    VERSIONED_PREFIX + 'attendance_snapshot_',
    VERSIONED_PREFIX + 'attendance_index_',
    VERSIONED_PREFIX + 'attendance_draft_',
    VERSIONED_PREFIX + 'attendance_draft_index_',
    VERSIONED_PREFIX + 'attendance_record_',
    VERSIONED_PREFIX + 'attendance_record_index_',
  ]

  for (const prefix of prefixes) {
    const keys = listKeysWithPrefix(prefix)
    for (const key of keys) safeRemove(key)
  }
}

export function migrateToV3(): void {
  const current = load<number>(VERSIONED_KEYS.schemaVersion) ?? 0
  if (current >= SCHEMA_VERSION) return

  if (current < 2) {
    try {
      const allGrades = gradesStorage.loadGrades() ?? {}
      for (const [classId, periods] of Object.entries(allGrades)) {
        gradesStorage.saveGradesForClass(classId, periods)
      }
    } catch (error) {
      console.warn('[storage] migrate grades to versioned keys failed:', error)
    }

    try {
      const allSchedule = load<ScheduleDataByClass>(STORAGE_KEYS.schedule) ?? {}
      for (const [classId, data] of Object.entries(allSchedule)) {
        scheduleStorage.saveScheduleForClass(classId, data)
      }
    } catch (error) {
      console.warn('[storage] migrate schedule to versioned keys failed:', error)
    }
  }

  clearAttendanceStorage()
  save(VERSIONED_KEYS.schemaVersion, SCHEMA_VERSION)
}
