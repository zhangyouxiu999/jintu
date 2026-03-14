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
