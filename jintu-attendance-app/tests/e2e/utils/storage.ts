import type { Page } from '@playwright/test'

const PREFIX = 'jintu_attendance_'
const PREFIX_V2 = 'jintu_attendance_v2_'

export const STORAGE_KEYS = {
  classes: PREFIX + 'classes',
  students: PREFIX + 'students',
  attendance: PREFIX + 'attendance',
  announcements: PREFIX + 'announcements',
  appTitle: PREFIX + 'app_title',
  auth: PREFIX + 'auth',
  schedule: PREFIX + 'schedule',
  grades: PREFIX + 'grades',
  currentClassId: PREFIX + 'current_class_id',
  currentPeriodIdByClass: PREFIX + 'current_period_id_by_class',
  autoResetAttendance: PREFIX + 'auto_reset_attendance',
} as const

export const V2_KEYS = {
  scheduleByClass: (classId: string) => PREFIX_V2 + `schedule_${classId}`,
  gradesByClass: (classId: string) => PREFIX_V2 + `grades_${classId}`,
  attendanceSnapshot: (snapshotKey: string) => PREFIX_V2 + `attendance_snapshot_${snapshotKey}`,
  attendanceIndexByClass: (classId: string) => PREFIX_V2 + `attendance_index_${classId}`,
  schemaVersion: PREFIX_V2 + 'schema_version',
} as const

export interface SeedData {
  auth?: boolean
  appTitle?: string
  classes?: unknown[]
  students?: unknown[]
  attendance?: unknown[]
  announcements?: unknown[]
  currentClassId?: string | null
  currentPeriodIdByClass?: Record<string, string>
  autoResetAttendance?: boolean
  scheduleByClass?: Record<string, Record<string, string>>
  gradesByClass?: Record<string, unknown>
}

export async function seedLocalStorage(page: Page, seed: SeedData) {
  await page.addInitScript((seedValue) => {
    const set = (key: string, value: unknown) => {
      if (value === undefined) return
      if (value === null) {
        localStorage.removeItem(key)
        return
      }
      localStorage.setItem(key, JSON.stringify(value))
    }

    localStorage.clear()

    if (seedValue.auth !== undefined) set('jintu_attendance_auth', seedValue.auth)
    set('jintu_attendance_app_title', seedValue.appTitle)
    set('jintu_attendance_classes', seedValue.classes)
    set('jintu_attendance_students', seedValue.students)
    set('jintu_attendance_attendance', seedValue.attendance)
    set('jintu_attendance_announcements', seedValue.announcements)
    set('jintu_attendance_current_class_id', seedValue.currentClassId)
    set('jintu_attendance_current_period_id_by_class', seedValue.currentPeriodIdByClass)
    set('jintu_attendance_auto_reset_attendance', seedValue.autoResetAttendance)

    if (seedValue.scheduleByClass) {
      set('jintu_attendance_schedule', seedValue.scheduleByClass)
      for (const [classId, data] of Object.entries(seedValue.scheduleByClass)) {
        localStorage.setItem(`jintu_attendance_v2_schedule_${classId}`, JSON.stringify(data))
      }
    }

    if (seedValue.gradesByClass) {
      set('jintu_attendance_grades', seedValue.gradesByClass)
      for (const [classId, data] of Object.entries(seedValue.gradesByClass)) {
        localStorage.setItem(`jintu_attendance_v2_grades_${classId}`, JSON.stringify(data))
      }
    }
  }, seed)
}
