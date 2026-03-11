import { useCallback } from 'react'
import * as attendanceStore from '@/store/attendance'
import * as classesStore from '@/store/classes'
import { today } from '@/lib/date'

export function useAttendance(classId: string | undefined) {
  const saveStatus = useCallback(
    async (studentId: string, status: number) => {
      if (!classId) return
      const date = today()
      const period = attendanceStore.getCurrentPeriodId()
      let snap = await attendanceStore.get(classId, date, period)
      const cls = await classesStore.getById(classId)
      const studentIds = cls?.studentOrder ?? []
      if (!snap) {
        snap = await attendanceStore.getOrCreate(classId, date, period, studentIds)
      }
      const next = { ...snap, statusMap: { ...snap.statusMap, [studentId]: status } }
      await attendanceStore.upsert(next)
    },
    [classId]
  )

  const saveAllStatus = useCallback(
    async (statusMap: Record<string, number>) => {
      if (!classId) return
      const date = today()
      const period = attendanceStore.getCurrentPeriodId()
      let snap = await attendanceStore.get(classId, date, period)
      const cls = await classesStore.getById(classId)
      const studentIds = cls?.studentOrder ?? []
      if (!snap) {
        snap = await attendanceStore.getOrCreate(classId, date, period, studentIds)
      }
      await attendanceStore.upsert({ ...snap, statusMap })
    },
    [classId]
  )

  const confirmReport = useCallback(async () => {
    if (!classId) return
    const date = today()
    const period = attendanceStore.getCurrentPeriodId()
    const snap = await attendanceStore.get(classId, date, period)
    if (snap) {
      await attendanceStore.upsert({ ...snap, confirmedAt: new Date().toISOString() })
    }
  }, [classId])

  return { saveStatus, saveAllStatus, confirmReport, getCurrentPeriodId: attendanceStore.getCurrentPeriodId }
}
