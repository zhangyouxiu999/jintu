/**
 * App 本地持久化：localStorage，键前缀避免冲突。
 * 后续可替换为 Capacitor Preferences 或 SQLite。
 */
const PREFIX = 'jintu_attendance_'

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
} as const

/** 课程表：按班级 id 存，每班为 周一_一 -> 课程名 */
export type ScheduleDataByClass = Record<string, Record<string, string>>

/** 单期成绩单：科目 + 分数 */
export type GradesForClass = { subjects: string[]; scores: Record<string, Record<string, string>> }

/** 成绩单分期：id、名称 + 数据 */
export type GradesPeriod = { id: string; name: string; subjects: string[]; scores: Record<string, Record<string, string>> }

/** 按班级存：每班为分期列表（多张成绩单） */
export type GradesDataByClass = Record<string, GradesPeriod[]>

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

  saveClasses(data: unknown) {
    save(STORAGE_KEYS.classes, data)
  },
  loadClasses() {
    return load<unknown>(STORAGE_KEYS.classes)
  },

  saveStudents(data: unknown) {
    save(STORAGE_KEYS.students, data)
  },
  loadStudents() {
    return load<unknown>(STORAGE_KEYS.students)
  },

  saveAttendance(data: unknown) {
    save(STORAGE_KEYS.attendance, data)
  },
  loadAttendance() {
    return load<unknown>(STORAGE_KEYS.attendance)
  },

  saveAnnouncements(data: unknown) {
    save(STORAGE_KEYS.announcements, data)
  },
  loadAnnouncements() {
    return load<unknown>(STORAGE_KEYS.announcements)
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
}
