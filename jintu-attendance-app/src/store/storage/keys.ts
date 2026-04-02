export const PREFIX = 'jintu_attendance_'
export const VERSIONED_PREFIX = 'jintu_attendance_v2_'
export const SCHEMA_VERSION = 3 as const

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

export const VERSIONED_KEYS = {
  schemaVersion: VERSIONED_PREFIX + 'schema_version',
  attendanceDraft: (draftKey: string) => VERSIONED_PREFIX + `attendance_draft_${draftKey}`,
  attendanceDraftIndexByClass: (classId: string) => VERSIONED_PREFIX + `attendance_draft_index_${classId}`,
  confirmedAttendanceRecord: (recordKey: string) => VERSIONED_PREFIX + `attendance_record_${recordKey}`,
  confirmedAttendanceIndexByClass: (classId: string) => VERSIONED_PREFIX + `attendance_record_index_${classId}`,
  scheduleByClass: (classId: string) => VERSIONED_PREFIX + `schedule_${classId}`,
  gradesByClass: (classId: string) => VERSIONED_PREFIX + `grades_${classId}`,
} as const

export function attendanceKeyOf(classId: string, date: string, period: number): string {
  return `${classId}|${date}|${period}`
}
