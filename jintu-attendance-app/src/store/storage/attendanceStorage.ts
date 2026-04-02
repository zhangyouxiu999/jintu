import type { AttendanceDraft, ConfirmedAttendanceRecord } from '@/types'
import { listKeysWithPrefix, load, loadByKeys, save, safeRemove } from '@/store/storage/core'
import { VERSIONED_KEYS, VERSIONED_PREFIX, attendanceKeyOf } from '@/store/storage/keys'

function listEntityKeys(prefix: string, indexPrefix: string): string[] {
  return listKeysWithPrefix(prefix).filter((key) => !key.startsWith(indexPrefix))
}

export const attendanceStorage = {
  saveAttendanceDraft(classId: string, date: string, period: number, draft: AttendanceDraft) {
    const draftKey = attendanceKeyOf(classId, date, period)
    save(VERSIONED_KEYS.attendanceDraft(draftKey), draft)
    const indexKey = VERSIONED_KEYS.attendanceDraftIndexByClass(classId)
    const index = load<string[]>(indexKey) ?? []
    if (!index.includes(draftKey)) save(indexKey, [...index, draftKey])
  },
  loadAttendanceDraft(classId: string, date: string, period: number): AttendanceDraft | null {
    const draftKey = attendanceKeyOf(classId, date, period)
    return load<AttendanceDraft>(VERSIONED_KEYS.attendanceDraft(draftKey))
  },
  listAttendanceDraftKeysByClass(classId: string): string[] {
    return load<string[]>(VERSIONED_KEYS.attendanceDraftIndexByClass(classId)) ?? []
  },
  removeAttendanceDraft(classId: string, date: string, period: number): void {
    const draftKey = attendanceKeyOf(classId, date, period)
    safeRemove(VERSIONED_KEYS.attendanceDraft(draftKey))
    const indexKey = VERSIONED_KEYS.attendanceDraftIndexByClass(classId)
    const index = load<string[]>(indexKey) ?? []
    if (index.includes(draftKey)) save(indexKey, index.filter((item) => item !== draftKey))
  },
  loadAllAttendanceDrafts(): AttendanceDraft[] {
    const keys = listEntityKeys(
      VERSIONED_PREFIX + 'attendance_draft_',
      VERSIONED_PREFIX + 'attendance_draft_index_'
    )
    return loadByKeys<AttendanceDraft>(keys)
  },

  saveConfirmedAttendanceRecord(classId: string, date: string, period: number, record: ConfirmedAttendanceRecord) {
    const recordKey = attendanceKeyOf(classId, date, period)
    save(VERSIONED_KEYS.confirmedAttendanceRecord(recordKey), record)
    const indexKey = VERSIONED_KEYS.confirmedAttendanceIndexByClass(classId)
    const index = load<string[]>(indexKey) ?? []
    if (!index.includes(recordKey)) save(indexKey, [...index, recordKey])
  },
  loadConfirmedAttendanceRecord(classId: string, date: string, period: number): ConfirmedAttendanceRecord | null {
    const recordKey = attendanceKeyOf(classId, date, period)
    return load<ConfirmedAttendanceRecord>(VERSIONED_KEYS.confirmedAttendanceRecord(recordKey))
  },
  listConfirmedAttendanceKeysByClass(classId: string): string[] {
    return load<string[]>(VERSIONED_KEYS.confirmedAttendanceIndexByClass(classId)) ?? []
  },
  removeConfirmedAttendanceRecord(classId: string, date: string, period: number): void {
    const recordKey = attendanceKeyOf(classId, date, period)
    safeRemove(VERSIONED_KEYS.confirmedAttendanceRecord(recordKey))
    const indexKey = VERSIONED_KEYS.confirmedAttendanceIndexByClass(classId)
    const index = load<string[]>(indexKey) ?? []
    if (index.includes(recordKey)) save(indexKey, index.filter((item) => item !== recordKey))
  },
  loadAllConfirmedAttendanceRecords(): ConfirmedAttendanceRecord[] {
    const keys = listEntityKeys(
      VERSIONED_PREFIX + 'attendance_record_',
      VERSIONED_PREFIX + 'attendance_record_index_'
    )
    return loadByKeys<ConfirmedAttendanceRecord>(keys)
  },
}
