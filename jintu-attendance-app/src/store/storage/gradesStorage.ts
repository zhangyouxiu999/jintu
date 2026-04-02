import type { GradesDataByClass, GradesForClass, GradesPeriod } from '@/types'
import { load, save } from '@/store/storage/core'
import { STORAGE_KEYS, VERSIONED_KEYS } from '@/store/storage/keys'

export const gradesStorage = {
  saveGrades(data: GradesDataByClass) {
    save(STORAGE_KEYS.grades, data)
  },
  loadGrades(): GradesDataByClass | null {
    const raw = load<GradesDataByClass | Record<string, GradesForClass>>(STORAGE_KEYS.grades)
    if (!raw) return null

    const output: GradesDataByClass = {}
    for (const [classId, value] of Object.entries(raw)) {
      const periods = Array.isArray(value) ? value : null
      if (periods && periods.length > 0 && periods[0] && 'id' in periods[0] && 'name' in periods[0]) {
        output[classId] = periods as GradesPeriod[]
        continue
      }

      const legacy = value as GradesForClass
      if (legacy?.subjects && Array.isArray(legacy.subjects) && legacy.scores && typeof legacy.scores === 'object') {
        output[classId] = [{ id: `period-${classId}-0`, name: '第一期', subjects: legacy.subjects, scores: legacy.scores || {} }]
      } else {
        output[classId] = []
      }
    }
    return output
  },
  saveGradesForClass(classId: string, periods: GradesPeriod[]) {
    save(VERSIONED_KEYS.gradesByClass(classId), periods)
  },
  loadGradesForClass(classId: string): GradesPeriod[] | null {
    return load<GradesPeriod[]>(VERSIONED_KEYS.gradesByClass(classId))
  },
}
