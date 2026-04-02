import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import type { AttendanceStatus, Student } from '@/types'

const ROW_HEIGHT = 60
const ROW_GAP = 8
const ROW_STRIDE = ROW_HEIGHT + ROW_GAP
const ROW_OVERSCAN = 8

export function useAttendanceFiltersAndVirtualList(students: Student[]) {
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | null>(null)
  const [listViewportHeight, setListViewportHeight] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const listViewportRef = useRef<HTMLDivElement>(null)

  const deferredStatusFilter = useDeferredValue(statusFilter)
  const studentBuckets = useMemo(() => {
    const all = students
    const present: Student[] = []
    const absent: Student[] = []
    const leave: Student[] = []
    const late: Student[] = []

    for (const student of students) {
      if (student.attendanceStatus === 1) present.push(student)
      else if (student.attendanceStatus === 2) leave.push(student)
      else if (student.attendanceStatus === 3) late.push(student)
      else absent.push(student)
    }

    return { all, present, absent, leave, late }
  }, [students])

  const filteredStudents = useMemo(() => {
    if (deferredStatusFilter === 1) return studentBuckets.present
    if (deferredStatusFilter === 2) return studentBuckets.leave
    if (deferredStatusFilter === 3) return studentBuckets.late
    if (deferredStatusFilter === 0) return studentBuckets.absent
    return studentBuckets.all
  }, [deferredStatusFilter, studentBuckets])

  const filterItems = useMemo(() => ([
    { key: null, label: '应到', count: students.length, active: statusFilter === null },
    { key: 1 as AttendanceStatus, label: '实到', count: studentBuckets.present.length, active: statusFilter === 1 },
    { key: 0 as AttendanceStatus, label: '未到', count: studentBuckets.absent.length, active: statusFilter === 0 },
    { key: 2 as AttendanceStatus, label: '请假', count: studentBuckets.leave.length, active: statusFilter === 2 },
    { key: 3 as AttendanceStatus, label: '晚到', count: studentBuckets.late.length, active: statusFilter === 3 },
  ]), [statusFilter, studentBuckets, students.length])

  const totalRows = filteredStudents.length
  const visibleRowCount = listViewportHeight > 0
    ? Math.ceil(listViewportHeight / ROW_STRIDE) + ROW_OVERSCAN * 2
    : 20
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_STRIDE) - ROW_OVERSCAN)
  const endIndex = Math.min(totalRows, startIndex + visibleRowCount)
  const visibleStudents = filteredStudents.slice(startIndex, endIndex)
  const topSpacerHeight = startIndex * ROW_STRIDE
  const bottomSpacerHeight = Math.max(0, (totalRows - endIndex) * ROW_STRIDE)

  useEffect(() => {
    const node = listViewportRef.current
    if (!node) return

    const syncSize = () => setListViewportHeight(node.clientHeight)
    syncSize()

    const observer = new ResizeObserver(syncSize)
    observer.observe(node)

    return () => observer.disconnect()
  }, [students.length, statusFilter])

  useEffect(() => {
    const node = listViewportRef.current
    if (!node) return
    node.scrollTop = 0
    setScrollTop(0)
  }, [statusFilter])

  return {
    statusFilter,
    setStatusFilter,
    listViewportRef,
    filterItems,
    visibleStudents,
    startIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    setScrollTop,
  }
}
