import { useMemo } from 'react'
import type { PeriodId, Student } from '@/types'
import { buildReportText } from '@/lib/reportText'

interface UseAttendanceStatsOptions {
  className: string
  students: Student[]
  period: PeriodId
  /** 用于列表展示的学生（筛选后）；不传则用 students，统计栏仍用 students 的应到/实到等 */
  listStudents?: Student[]
}

export function useAttendanceStats({ className, students, period, listStudents }: UseAttendanceStatsOptions) {
  const list = listStudents ?? students
  return useMemo(() => {
    const listTotal = list.length
    const oneColumn = listTotal < 21
    const twoColumns = listTotal >= 21 && listTotal <= 30
    const threeColumns = listTotal > 30

    const leftCountTwo = twoColumns ? Math.ceil(listTotal / 2) : 0
    const leftCountThree = threeColumns ? Math.ceil(listTotal / 3) : 0
    const centerCountThree = threeColumns ? Math.ceil((listTotal - leftCountThree) / 2) : 0

    const studentsLeft = oneColumn
      ? list
      : twoColumns
        ? list.slice(0, leftCountTwo)
        : list.slice(0, leftCountThree)

    const studentsCenter = twoColumns
      ? list.slice(leftCountTwo)
      : threeColumns
        ? list.slice(leftCountThree, leftCountThree + centerCountThree)
        : []

    const studentsRight = threeColumns ? list.slice(leftCountThree + centerCountThree) : []

    const presentCount = students.filter((student) => student.attendanceStatus === 1).length
    const leaveCount = students.filter((student) => student.attendanceStatus === 2).length
    const lateCount = students.filter((student) => student.attendanceStatus === 3).length

    const studentIndexMap = new Map(students.map((student, index) => [student.id, index + 1]))

    return {
      oneColumn,
      twoColumns,
      threeColumns,
      studentsLeft,
      studentsCenter,
      studentsRight,
      presentCount,
      leaveCount,
      lateCount,
      reportText: buildReportText(className, students, period),
      getGlobalIndex(studentId: string) {
        return studentIndexMap.get(studentId) ?? 0
      },
    }
  }, [className, period, students, list])
}
