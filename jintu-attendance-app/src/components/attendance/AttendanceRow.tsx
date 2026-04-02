import { memo, useCallback } from 'react'
import type { AttendanceStatus, Student } from '@/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface AttendanceStatusOption {
  status: AttendanceStatus
  label: string
  activeClassName: string
}

interface AttendanceRowProps {
  student: Student
  index: number
  options: AttendanceStatusOption[]
  rowClassName?: string
  onSelect: (studentId: string, status: AttendanceStatus) => void
}

function AttendanceRow({
  student,
  index,
  options,
  rowClassName,
  onSelect,
}: AttendanceRowProps) {
  const handleSelect = useCallback((status: AttendanceStatus) => {
    onSelect(student.id, status)
  }, [onSelect, student.id])

  return (
    <div
      data-testid={`attendance-row-${student.id}`}
      className={cn(
        'flex items-center gap-3 rounded-[16px] border border-[var(--outline-variant)] bg-[var(--surface)] px-3 py-2.5 transition-colors',
        rowClassName
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-[12px] bg-[var(--surface-2)] text-[12px] font-semibold leading-none text-[var(--on-surface-muted)]">
        {index}
      </div>

      <div className="min-w-0 flex-1 self-center pr-1">
        <p className="truncate text-[15px] font-semibold leading-5 tracking-[-0.02em] text-[var(--on-surface)]">
          {student.name}
        </p>
      </div>

      <div className="w-[212px] max-w-[62%] shrink-0 self-center rounded-[14px] bg-[var(--surface-2)] p-1">
        <div className="grid grid-cols-4 gap-1">
          {options.map((option) => (
            <Button
              key={option.status}
              type="button"
              variant="ghost"
              onClick={() => handleSelect(option.status)}
              className={cn(
                'h-8 min-w-0 rounded-[12px] border border-transparent px-1.5 text-[12px] font-semibold text-[var(--on-surface-muted)] shadow-none [&_span]:leading-none',
                student.attendanceStatus === option.status && option.activeClassName
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(AttendanceRow, (prev, next) =>
  prev.student === next.student
  && prev.index === next.index
  && prev.options === next.options
  && prev.rowClassName === next.rowClassName
  && prev.onSelect === next.onSelect
)
