import type { GradesForClass } from '@/types'

export const DEFAULT_SUBJECTS = ['语文', '数学', '英语']

export function sumScores(scores: Record<string, string>): string {
  const nums = Object.values(scores)
    .map((value) => parseFloat(String(value).trim()))
    .filter((value) => !Number.isNaN(value))

  if (nums.length === 0) return ''

  return String(nums.reduce((a, b) => a + b, 0))
}

export function createNewPeriodId() {
  return `period-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function renameSubjectInGrades(grades: GradesForClass, oldName: string, newName: string): GradesForClass {
  const next: GradesForClass = {
    subjects: grades.subjects.map((subject) => (subject === oldName ? newName : subject)),
    scores: { ...grades.scores },
  }

  Object.keys(next.scores).forEach((studentId) => {
    if (next.scores[studentId][oldName] !== undefined) {
      next.scores[studentId][newName] = next.scores[studentId][oldName]
      delete next.scores[studentId][oldName]
    }
  })

  return next
}

export function removeSubjectFromGrades(grades: GradesForClass, subject: string): GradesForClass {
  const next: GradesForClass = {
    subjects: grades.subjects.filter((item) => item !== subject),
    scores: { ...grades.scores },
  }

  Object.keys(next.scores).forEach((studentId) => {
    delete next.scores[studentId][subject]
    if (Object.keys(next.scores[studentId]).length === 0) {
      delete next.scores[studentId]
    }
  })

  return next
}
