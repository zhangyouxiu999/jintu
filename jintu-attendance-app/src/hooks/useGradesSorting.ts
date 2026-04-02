import { useMemo, useState } from 'react'
import type { GradesForClass, Student } from '@/types'
import { sumScores } from '@/lib/grades'

interface UseGradesSortingParams {
  students: Student[]
  grades: GradesForClass
  getScore: (studentId: string, subject: string) => string
}

export function useGradesSorting({ students, grades, getScore }: UseGradesSortingParams) {
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'total'>('order')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [sortSheetOpen, setSortSheetOpen] = useState(false)

  const sortedStudents = useMemo(() => {
    const list = [...students]
    if (sortBy === 'order') return list

    if (sortBy === 'name') {
      list.sort((a, b) => (sortDir === 'asc' ? 1 : -1) * (a.name.localeCompare(b.name, 'zh-CN') || 0))
      return list
    }

    list.sort((a, b) => {
      const totalA = sumScores(grades.subjects.reduce<Record<string, string>>((acc, subject) => {
        acc[subject] = getScore(a.id, subject)
        return acc
      }, {}))
      const totalB = sumScores(grades.subjects.reduce<Record<string, string>>((acc, subject) => {
        acc[subject] = getScore(b.id, subject)
        return acc
      }, {}))
      const numericA = parseFloat(totalA) || 0
      const numericB = parseFloat(totalB) || 0

      if (numericA !== numericB) {
        return sortDir === 'asc' ? numericA - numericB : numericB - numericA
      }

      return a.name.localeCompare(b.name, 'zh-CN')
    })

    return list
  }, [grades.subjects, getScore, sortBy, sortDir, students])

  return {
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    sortSheetOpen,
    setSortSheetOpen,
    sortedStudents,
  }
}
