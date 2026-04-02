import type { Page } from '@playwright/test'

const PREFIX = 'jintu_attendance_'
const VERSIONED_PREFIX = 'jintu_attendance_v2_'

export const STORAGE_KEYS = {
  classes: PREFIX + 'classes',
  students: PREFIX + 'students',
  announcements: PREFIX + 'announcements',
  appTitle: PREFIX + 'app_title',
  auth: PREFIX + 'auth',
  schedule: PREFIX + 'schedule',
  grades: PREFIX + 'grades',
  currentClassId: PREFIX + 'current_class_id',
  currentPeriodIdByClass: PREFIX + 'current_period_id_by_class',
  autoResetAttendance: PREFIX + 'auto_reset_attendance',
} as const

export const VERSIONED_KEYS = {
  scheduleByClass: (classId: string) => VERSIONED_PREFIX + `schedule_${classId}`,
  gradesByClass: (classId: string) => VERSIONED_PREFIX + `grades_${classId}`,
  attendanceDraft: (draftKey: string) => VERSIONED_PREFIX + `attendance_draft_${draftKey}`,
  attendanceDraftIndexByClass: (classId: string) => VERSIONED_PREFIX + `attendance_draft_index_${classId}`,
  confirmedAttendanceRecord: (recordKey: string) => VERSIONED_PREFIX + `attendance_record_${recordKey}`,
  confirmedAttendanceIndexByClass: (classId: string) => VERSIONED_PREFIX + `attendance_record_index_${classId}`,
  schemaVersion: VERSIONED_PREFIX + 'schema_version',
} as const

export interface SeedData {
  auth?: boolean
  appTitle?: string
  classes?: unknown[]
  students?: unknown[]
  attendanceDrafts?: unknown[]
  confirmedAttendanceRecords?: unknown[]
  announcements?: unknown[]
  currentClassId?: string | null
  currentPeriodIdByClass?: Record<string, string>
  autoResetAttendance?: boolean
  scheduleByClass?: Record<string, Record<string, string>>
  gradesByClass?: Record<string, unknown>
}

export async function seedLocalStorage(page: Page, seed: SeedData) {
  await page.addInitScript((seedValue) => {
    const appendStyle = () => {
      const style = document.createElement('style')
      style.textContent = `
        *,
        *::before,
        *::after {
          animation: none !important;
          transition: none !important;
          scroll-behavior: auto !important;
        }
      `
      ;(document.head ?? document.documentElement).appendChild(style)
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', appendStyle, { once: true })
    } else {
      appendStyle()
    }

    const set = (key: string, value: unknown) => {
      if (value === undefined) return
      if (value === null) {
        localStorage.removeItem(key)
        return
      }
      localStorage.setItem(key, JSON.stringify(value))
    }

    localStorage.clear()
    localStorage.setItem('jintu_attendance_v2_schema_version', JSON.stringify(3))

    if (seedValue.auth !== undefined) set('jintu_attendance_auth', seedValue.auth)
    set('jintu_attendance_app_title', seedValue.appTitle)
    set('jintu_attendance_classes', seedValue.classes)
    set('jintu_attendance_students', seedValue.students)
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

    if (Array.isArray(seedValue.attendanceDrafts)) {
      const draftsByClass = new Map<string, string[]>()
      for (const draft of seedValue.attendanceDrafts as Array<{ classId: string; date: string; period: number }>) {
        const draftKey = `${draft.classId}|${draft.date}|${draft.period}`
        localStorage.setItem(`jintu_attendance_v2_attendance_draft_${draftKey}`, JSON.stringify(draft))
        const index = draftsByClass.get(draft.classId) ?? []
        index.push(draftKey)
        draftsByClass.set(draft.classId, index)
      }
      for (const [classId, draftKeys] of draftsByClass) {
        localStorage.setItem(`jintu_attendance_v2_attendance_draft_index_${classId}`, JSON.stringify(draftKeys))
      }
    }

    if (Array.isArray(seedValue.confirmedAttendanceRecords)) {
      const recordsByClass = new Map<string, string[]>()
      for (const record of seedValue.confirmedAttendanceRecords as Array<{ classId: string; date: string; period: number }>) {
        const recordKey = `${record.classId}|${record.date}|${record.period}`
        localStorage.setItem(`jintu_attendance_v2_attendance_record_${recordKey}`, JSON.stringify(record))
        const index = recordsByClass.get(record.classId) ?? []
        index.push(recordKey)
        recordsByClass.set(record.classId, index)
      }
      for (const [classId, recordKeys] of recordsByClass) {
        localStorage.setItem(`jintu_attendance_v2_attendance_record_index_${classId}`, JSON.stringify(recordKeys))
      }
    }
  }, seed)
}
