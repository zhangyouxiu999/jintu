import { startTransition } from 'react'
import { Users } from 'lucide-react'
import type { AttendanceStatus, Student } from '@/types'
import { ATTENDANCE_STATUS_META, ATTENDANCE_STATUS_OPTIONS } from '@/hooks/useAttendancePage'
import AttendanceRow from '@/components/attendance/AttendanceRow'
import { SegmentedFilterBar } from '@/components/ui/app-ui'
import { EmptyStateCard, SurfaceCard } from '@/components/ui/mobile-ui'

interface AttendanceStudentListProps {
  classId?: string
  students: Student[]
  setStatusFilter: (value: AttendanceStatus | null) => void
  filterItems: Array<{ key: AttendanceStatus | null, label: string, count: number, active: boolean }>
  listViewportRef: React.RefObject<HTMLDivElement>
  setScrollTop: (value: number) => void
  topSpacerHeight: number
  bottomSpacerHeight: number
  visibleStudents: Student[]
  startIndex: number
  onSelect: (studentId: string, status: AttendanceStatus) => void
  onEmptyAction: () => void
}

export default function AttendanceStudentList({
  students,
  setStatusFilter,
  filterItems,
  listViewportRef,
  setScrollTop,
  topSpacerHeight,
  bottomSpacerHeight,
  visibleStudents,
  startIndex,
  onSelect,
  onEmptyAction,
}: AttendanceStudentListProps) {
  if (students.length === 0) {
    return (
      <EmptyStateCard
        icon={Users}
        title="还没有学生"
        actionLabel="添加学生"
        onAction={onEmptyAction}
      />
    )
  }

  return (
    <SurfaceCard density="compact" className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
      <div className="border-b border-[var(--outline-variant)] px-3.5 py-2.5">
        <SegmentedFilterBar
          items={filterItems.map((item) => ({
            key: String(item.key),
            label: item.label,
            count: item.count,
            active: item.active,
            ariaLabel: `筛选：${item.label}`,
            onSelect: () => {
              startTransition(() => {
                setStatusFilter(item.active ? null : item.key)
              })
            },
          }))}
        />
      </div>

      <div
        ref={listViewportRef}
        className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <div style={{ paddingTop: topSpacerHeight, paddingBottom: bottomSpacerHeight }}>
          <div className="space-y-2">
            {visibleStudents.map((student, index) => (
              <AttendanceRow
                key={student.id}
                student={student}
                index={startIndex + index + 1}
                options={ATTENDANCE_STATUS_OPTIONS}
                rowClassName={ATTENDANCE_STATUS_META[student.attendanceStatus].rowClassName}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </SurfaceCard>
  )
}
