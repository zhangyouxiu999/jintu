import { useState, useEffect, useCallback, startTransition } from 'react'
import type { ClassEntity, Student } from '@/types'
import * as classesStore from '@/store/classes'
import * as studentsStore from '@/store/students'
import * as attendanceStore from '@/store/attendance'
import { today } from '@/lib/date'

export function useClass(classId: string | undefined) {
  const [classEntity, setClassEntity] = useState<ClassEntity | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  /** 仅更新本地 state 中某学生的考勤状态，用于点名页点击时乐观更新，避免整表 refresh */
  const setStudentAttendanceStatus = useCallback((studentId: string, status: number) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, attendanceStatus: status } : s))
    )
  }, [])

  const refresh = useCallback(async (silent = false) => {
    if (!classId) {
      setClassEntity(null)
      setStudents([])
      setLoading(false)
      return
    }
    if (!silent) setLoading(true)
    const [cls, list] = await Promise.all([
      classesStore.getById(classId),
      studentsStore.getByClassId(classId),
    ])
    if (!cls) {
      setClassEntity(null)
      setStudents([])
      setLoading(false)
      return
    }
    const date = today()
    const period = attendanceStore.getCurrentPeriodId()
    const snap = await attendanceStore.getOrCreate(classId, date, period, list.map((s) => s.id))
    const merged: Student[] = list.map((s) => ({
      id: s.id,
      name: s.name,
      attendanceStatus: snap.statusMap[s.id] ?? 0,
    }))
    const orderMap = new Map(cls.studentOrder.map((id, i) => [id, i]))
    merged.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
    startTransition(() => {
      setClassEntity(cls)
      setStudents(merged)
      setLoading(false)
    })
  }, [classId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const updateOrder = useCallback(
    async (orderedIds: string[]) => {
      if (!classEntity) return
      await classesStore.update({ ...classEntity, studentOrder: orderedIds })
      await refresh()
    },
    [classEntity, refresh]
  )

  const addStudent = useCallback(
    async (name: string) => {
      if (!classId) return
      const id = await studentsStore.addStudent(name, classId)
      const cls = await classesStore.getById(classId)
      if (cls) {
        await classesStore.update({
          ...cls,
          studentOrder: [...cls.studentOrder, id],
        })
      }
      await refresh(true)
      return id
    },
    [classId, refresh]
  )

  const updateStudentName = useCallback(
    async (studentId: string, name: string) => {
      if (!classId) return
      const list = await studentsStore.getByClassId(classId)
      const s = list.find((x) => x.id === studentId)
      if (!s) return
      await studentsStore.update({ ...s, name: name.trim() })
      await refresh()
    },
    [classId, refresh]
  )

  const deleteStudent = useCallback(
    async (studentId: string) => {
      if (!classId) return
      await studentsStore.remove(studentId)
      const cls = await classesStore.getById(classId)
      if (cls) {
        await classesStore.update({
          ...cls,
          studentOrder: cls.studentOrder.filter((id) => id !== studentId),
        })
      }
      await refresh()
    },
    [classId, refresh]
  )

  const updateClassName = useCallback(
    async (name: string) => {
      if (!classEntity || !name.trim()) return
      await classesStore.update({ ...classEntity, name: name.trim() })
      await refresh()
    },
    [classEntity, refresh]
  )

  return {
    classEntity,
    students,
    loading,
    refresh,
    setStudentAttendanceStatus,
    updateOrder,
    addStudent,
    updateStudentName,
    deleteStudent,
    updateClassName,
  }
}
