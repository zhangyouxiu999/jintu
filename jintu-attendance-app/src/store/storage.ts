/**
 * App 本地持久化：localStorage，键前缀避免冲突。
 * 后续可替换为 Capacitor Preferences 或 SQLite。
 */
import type {
  AnnouncementEntity,
  AttendanceSnapshot,
  ClassEntity,
  GradesDataByClass,
  GradesForClass,
  GradesPeriod,
  ScheduleDataByClass,
  StudentEntity,
} from '@/types'

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

const STORAGE_KEYS_V2 = {
  schemaVersion: PREFIX_V2 + 'schema_version',
  /** Attendance：每条快照单独存，另外按班级维护索引（snapshotKey 列表） */
  attendanceSnapshot: (snapshotKey: string) => PREFIX_V2 + `attendance_snapshot_${snapshotKey}`,
  attendanceIndexByClass: (classId: string) => PREFIX_V2 + `attendance_index_${classId}`,
  /** Schedule：按班级单独存 */
  scheduleByClass: (classId: string) => PREFIX_V2 + `schedule_${classId}`,
  /** Grades：按班级单独存（periods 数组） */
  gradesByClass: (classId: string) => PREFIX_V2 + `grades_${classId}`,
} as const

const SCHEMA_VERSION_V2 = 2 as const

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.warn('[storage] remove failed:', key, e)
  }
}

function snapshotKeyOf(classId: string, date: string, period: number): string {
  // 与 src/store/attendance.ts 的 key() 兼容：`${classId}|${date}|${period}`
  return `${classId}|${date}|${period}`
}

function save(key: string, data: unknown): void {
  try {
    const raw = JSON.stringify(data)
    localStorage.setItem(key, raw)
  } catch (e) {
    console.warn('[storage] save failed:', key, e)
  }
}

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return null
    return JSON.parse(raw) as T
  } catch (e) {
    console.warn('[storage] load failed:', key, e)
    return null
  }
}

export const storage = {
  save,
  load,

  /**
   * 一次性迁移到 v2 schema：
   * - 保留旧 key（回滚安全）
   * - 仅在 schemaVersion < 2 时执行
   */
  migrateToV2(): void {
    const current = load<number>(STORAGE_KEYS_V2.schemaVersion) ?? 0
    if (current >= SCHEMA_VERSION_V2) return

    // 1) Attendance：旧结构为快照数组
    try {
      const oldAttendance = load<AttendanceSnapshot[]>(STORAGE_KEYS.attendance) ?? []
      const indexByClass = new Map<string, string[]>()
      for (const snap of oldAttendance) {
        if (!snap?.classId || !snap?.date || snap?.period == null) continue
        const sk = snapshotKeyOf(snap.classId, snap.date, snap.period)
        save(STORAGE_KEYS_V2.attendanceSnapshot(sk), snap)
        const list = indexByClass.get(snap.classId) ?? []
        if (!list.includes(sk)) list.push(sk)
        indexByClass.set(snap.classId, list)
      }
      for (const [classId, list] of indexByClass) {
        save(STORAGE_KEYS_V2.attendanceIndexByClass(classId), list)
      }
    } catch (e) {
      console.warn('[storage] migrate attendance to v2 failed:', e)
    }

    // 2) Grades：旧结构为 GradesDataByClass（或 legacy GradesForClass，loadGrades 内已兼容）
    try {
      const allGrades = this.loadGrades() ?? {}
      for (const [classId, periods] of Object.entries(allGrades)) {
        save(STORAGE_KEYS_V2.gradesByClass(classId), periods)
      }
    } catch (e) {
      console.warn('[storage] migrate grades to v2 failed:', e)
    }

    // 3) Schedule：旧结构为 ScheduleDataByClass
    try {
      const allSchedule = load<ScheduleDataByClass>(STORAGE_KEYS.schedule) ?? {}
      for (const [classId, data] of Object.entries(allSchedule)) {
        save(STORAGE_KEYS_V2.scheduleByClass(classId), data)
      }
    } catch (e) {
      console.warn('[storage] migrate schedule to v2 failed:', e)
    }

    save(STORAGE_KEYS_V2.schemaVersion, SCHEMA_VERSION_V2)
  },

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

  saveAttendance(data: AttendanceSnapshot[]) {
    save(STORAGE_KEYS.attendance, data)
  },
  loadAttendance(): AttendanceSnapshot[] | null {
    return load<AttendanceSnapshot[]>(STORAGE_KEYS.attendance)
  },

  /** v2：按快照粒度存取（用于高频写入优化） */
  saveAttendanceSnapshot(classId: string, date: string, period: number, snap: AttendanceSnapshot) {
    const sk = snapshotKeyOf(classId, date, period)
    save(STORAGE_KEYS_V2.attendanceSnapshot(sk), snap)
    const indexKey = STORAGE_KEYS_V2.attendanceIndexByClass(classId)
    const index = load<string[]>(indexKey) ?? []
    if (!index.includes(sk)) save(indexKey, [...index, sk])
  },
  loadAttendanceSnapshot(classId: string, date: string, period: number): AttendanceSnapshot | null {
    const sk = snapshotKeyOf(classId, date, period)
    return load<AttendanceSnapshot>(STORAGE_KEYS_V2.attendanceSnapshot(sk))
  },
  listAttendanceSnapshotKeysByClass(classId: string): string[] {
    return load<string[]>(STORAGE_KEYS_V2.attendanceIndexByClass(classId)) ?? []
  },
  removeAttendanceSnapshot(classId: string, date: string, period: number): void {
    const sk = snapshotKeyOf(classId, date, period)
    safeRemove(STORAGE_KEYS_V2.attendanceSnapshot(sk))
    const indexKey = STORAGE_KEYS_V2.attendanceIndexByClass(classId)
    const index = load<string[]>(indexKey) ?? []
    if (index.includes(sk)) save(indexKey, index.filter((x) => x !== sk))
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

  saveSchedule(data: ScheduleDataByClass) {
    save(STORAGE_KEYS.schedule, data)
  },
  loadSchedule(): ScheduleDataByClass | null {
    return load<ScheduleDataByClass>(STORAGE_KEYS.schedule)
  },
  /** v2：按班级存取 */
  saveScheduleForClass(classId: string, data: NonNullable<ScheduleDataByClass[string]>) {
    save(STORAGE_KEYS_V2.scheduleByClass(classId), data)
  },
  loadScheduleForClass(classId: string): NonNullable<ScheduleDataByClass[string]> | null {
    return load<NonNullable<ScheduleDataByClass[string]>>(STORAGE_KEYS_V2.scheduleByClass(classId))
  },

  saveGrades(data: GradesDataByClass) {
    save(STORAGE_KEYS.grades, data)
  },
  loadGrades(): GradesDataByClass | null {
    const raw = load<GradesDataByClass | Record<string, GradesForClass>>(STORAGE_KEYS.grades)
    if (!raw) return null
    const out: GradesDataByClass = {}
    for (const [classId, val] of Object.entries(raw)) {
      const arr = Array.isArray(val) ? val : null
      if (arr && arr.length > 0 && arr[0] && 'id' in arr[0] && 'name' in arr[0]) {
        out[classId] = arr as GradesPeriod[]
      } else {
        const legacy = val as GradesForClass
        if (legacy?.subjects && Array.isArray(legacy.subjects) && legacy.scores && typeof legacy.scores === 'object')
          out[classId] = [{ id: `period-${classId}-0`, name: '第一期', subjects: legacy.subjects, scores: legacy.scores || {} }]
        else
          out[classId] = []
      }
    }
    return out
  },
  /** v2：按班级存取（periods 数组） */
  saveGradesForClass(classId: string, periods: GradesPeriod[]) {
    save(STORAGE_KEYS_V2.gradesByClass(classId), periods)
  },
  loadGradesForClass(classId: string): GradesPeriod[] | null {
    return load<GradesPeriod[]>(STORAGE_KEYS_V2.gradesByClass(classId))
  },

  saveCurrentClassId(id: string | null) {
    try {
      if (id == null) {
        localStorage.removeItem(STORAGE_KEYS.currentClassId)
      } else {
        save(STORAGE_KEYS.currentClassId, id)
      }
    } catch (e) {
      console.warn('[storage] saveCurrentClassId failed', e)
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
