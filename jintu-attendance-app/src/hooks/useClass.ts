import { useState, useEffect, useCallback, startTransition } from 'react'
import type { AttendanceStatus, ClassEntity, Student } from '@/types'
import * as classesStore from '@/store/classes'
import * as studentsStore from '@/store/students'
import * as attendanceStore from '@/store/attendance'

export function useClass(classId: string | undefined) {
  const [classEntity, setClassEntity] = useState<ClassEntity | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  /** 仅更新本地 state 中某学生的考勤状态，用于点名页点击时乐观更新，避免整表 refresh */
  const setStudentAttendanceStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, attendanceStatus: status } : s))
    )
  }, [])

  /** 批量更新本地考勤状态，用于一键全勤/重置考勤后避免整表 refresh */
  const setAllAttendanceStatus = useCallback((statusMap: Record<string, AttendanceStatus>) => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, attendanceStatus: statusMap[s.id] ?? 0 }))
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
    const draft = await attendanceStore.getCurrentDraft(classId)
    const merged: Student[] = list.map((s) => ({
      id: s.id,
      name: s.name,
      attendanceStatus: draft.statusMap[s.id] ?? 0,
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
      // 乐观更新：直接按新顺序重排本地 state，无需 refresh 避免 loading 闪烁
      const orderMap = new Map(orderedIds.map((id, i) => [id, i]))
      setStudents((prev) =>
        [...prev].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
      )
      await classesStore.update({ ...classEntity, studentOrder: orderedIds })
    },
    [classEntity]
  )

  const addStudents = useCallback(
    async (names: string[]) => {
      if (!classId) return []
      const normalizedNames = names.map((name) => name.trim()).filter(Boolean)
      if (normalizedNames.length === 0) return []

      const cls = await classesStore.getById(classId)
      const nextStudentOrder = [...(cls?.studentOrder ?? [])]
      const ids: string[] = []

      for (const name of normalizedNames) {
        const id = await studentsStore.addStudent(name, classId)
        ids.push(id)
        nextStudentOrder.push(id)
      }

      if (cls) {
        await classesStore.update({
          ...cls,
          studentOrder: nextStudentOrder,
        })
      }
      await refresh(true)
      return ids
    },
    [classId, refresh]
  )

  const addStudent = useCallback(
    async (name: string) => {
      const ids = await addStudents([name])
      return ids[0]
    },
    [addStudents]
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
    setAllAttendanceStatus,
    updateOrder,
    addStudent,
    addStudents,
    updateStudentName,
    deleteStudent,
    updateClassName,
  }
}
