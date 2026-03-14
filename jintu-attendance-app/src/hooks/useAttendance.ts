import { useCallback } from 'react'
import type { AttendanceStatus, AttendanceStatusMap } from '@/types'
import * as attendanceStore from '@/store/attendance'

export function useAttendance(classId: string | undefined) {
  const saveStatus = useCallback(
    async (studentId: string, status: AttendanceStatus) => {
      if (!classId) return
      await attendanceStore.saveStudentStatus(classId, studentId, status)
    },
    [classId]
  )

  const saveAllStatus = useCallback(
    async (statusMap: AttendanceStatusMap) => {
      if (!classId) return
      await attendanceStore.saveCurrentStatusMap(classId, statusMap)
    },
    [classId]
  )

  const confirmReport = useCallback(async () => {
    if (!classId) return
    await attendanceStore.confirmCurrentReport(classId)
  }, [classId])

  return { saveStatus, saveAllStatus, confirmReport, getCurrentPeriodId: attendanceStore.getCurrentPeriodId }
}
