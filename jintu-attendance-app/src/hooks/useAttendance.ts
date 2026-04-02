import { useCallback } from 'react'
import type { AttendanceStatus, AttendanceStatusMap } from '@/types'
import * as attendanceStore from '@/store/attendance'

export function useAttendance(classId: string | undefined) {
  const saveStatus = useCallback(
    async (studentId: string, status: AttendanceStatus) => {
      if (!classId) return
      await attendanceStore.saveDraftStudentStatus(classId, studentId, status)
    },
    [classId]
  )

  const saveAllStatus = useCallback(
    async (statusMap: AttendanceStatusMap) => {
      if (!classId) return
      await attendanceStore.saveCurrentDraftStatusMap(classId, statusMap)
    },
    [classId]
  )

  const clearDraft = useCallback(async () => {
    if (!classId) return
    await attendanceStore.clearCurrentDraft(classId)
  }, [classId])

  const confirmDraft = useCallback(async () => {
    if (!classId) return null
    return attendanceStore.confirmCurrentDraft(classId)
  }, [classId])

  return {
    saveStatus,
    saveAllStatus,
    clearDraft,
    confirmDraft,
    getCurrentPeriodId: attendanceStore.getCurrentPeriodId,
  }
}
