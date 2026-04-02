import { useState, useEffect, useRef, memo, type CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { AttendanceStatus, Student } from '@/types'

interface SortableStudentRowProps {
  student: Student
  index: number
  showEdit?: boolean
  showIndex?: boolean
  isAndroid?: boolean
  onIndexChange?: (id: string, newIndex: string) => void
  onStatus: (id: string, status: AttendanceStatus) => void
  onEdit: (id: string, name: string) => void
  onDelete: (id: string) => void
}

const STATUS_CONFIG = {
  1: { label: '已到', active: '!bg-[var(--success)] !text-white !border-[var(--success)]' },
  2: { label: '请假', active: '!bg-[var(--leave)] !text-white !border-[var(--leave)]' },
  3: { label: '晚到', active: '!bg-[var(--primary)] !text-white !border-[var(--primary)]' },
  0: { label: '未到', active: '!bg-[var(--on-surface-muted)] !text-white !border-[var(--on-surface-muted)]' },
} as const

function SortableStudentRow({
  student,
  index,
  showEdit = false,
  showIndex = true,
  isAndroid = false,
  onIndexChange,
  onStatus,
  onEdit,
  onDelete,
}: SortableStudentRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: student.id,
  })
  const [inputValue, setInputValue] = useState(index.toString())
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(index.toString())
  }, [index])

  const handleIndexBlur = () => {
    if (inputValue !== index.toString() && onIndexChange) onIndexChange(student.id, inputValue)
  }

  const getIndicatorColor = () => {
    if (showEdit) return 'var(--outline-subtle)'
    switch (student.attendanceStatus) {
      case 1: return 'var(--success)'
      case 2: return 'var(--leave)'
      case 3: return 'var(--primary)'
      default: return 'transparent'
    }
  }

  const getRowBg = () => {
    if (showEdit) return 'bg-[var(--surface)]'
    switch (student.attendanceStatus) {
      case 1: return 'bg-[var(--success-container)]/45'
      case 2: return 'bg-[var(--leave-container)]/45'
      case 3: return 'bg-[var(--late-container)]/45'
      default: return 'bg-[var(--surface)]'
    }
  }

  const rowStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transform != null
      ? transition
      : 'background-color 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
    position: 'relative',
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  const setRef = (el: HTMLDivElement | null) => {
    setNodeRef(el)
    ;(rowRef as React.MutableRefObject<HTMLDivElement | null>).current = el
  }

  return (
    <div
      ref={setRef}
      data-testid={`sortable-student-row-${student.id}`}
      style={rowStyle}
      {...attributes}
      className={cn(
        'relative flex w-full items-center overflow-hidden',
        showEdit ? 'min-h-[68px]' : 'min-h-[56px]',
        getRowBg(),
        isDragging && 'rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.10)]'
      )}
    >
      <div
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ backgroundColor: getIndicatorColor() }}
      />

      <div
        {...listeners}
        className={cn(
          'flex h-full shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing',
          showEdit ? 'min-h-[68px] w-11 pl-3' : 'min-h-[56px] w-10 pl-3'
        )}
        aria-label="拖动排序"
      >
        <GripVertical className="h-4 w-4 text-[var(--on-surface-muted)]/70" strokeWidth={2} />
      </div>

      {showIndex && (
        <div className={cn('shrink-0', showEdit ? 'mr-2 w-8' : 'mr-1 w-5')}>
          {onIndexChange ? (
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleIndexBlur}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className={cn(
                'w-full border border-[var(--outline-subtle)] bg-[var(--surface-2)] px-0.5 py-0 text-center font-medium text-[var(--on-surface-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40',
                showEdit ? 'h-8 rounded-[8px] text-[12px]' : 'h-8 rounded-[8px] text-[12px] leading-none'
              )}
            />
          ) : (
            <span className={cn(
              'block text-center font-medium tabular-nums text-[var(--on-surface-muted)]',
              showEdit ? 'text-[12px]' : 'text-[12px] leading-none'
            )}>
              {index}
            </span>
          )}
        </div>
      )}

      <div className={cn('flex min-w-0 flex-1 items-center', showEdit ? 'pl-0' : 'pl-1')}>
        <span className={cn(
          showEdit ? 'block truncate text-[15px] font-semibold leading-5 text-[var(--on-surface)]' : 'block truncate text-[14px] font-medium leading-5 text-[var(--on-surface)]',
          isAndroid ? 'max-w-[5.5em]' : 'max-w-[7em] sm:max-w-none'
        )}>
          {student.name}
        </span>
      </div>

      {showEdit ? (
        <div className="flex shrink-0 items-center gap-2 self-center pr-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onEdit(student.id, student.name)}
            className="h-9 w-9 rounded-[12px] border-[var(--outline)] bg-[var(--surface-2)] text-[var(--on-surface-muted)] shadow-none"
            aria-label="编辑"
          >
            <Pencil className="h-[16px] w-[16px]" strokeWidth={1.5} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onDelete(student.id)}
            className="h-9 w-9 rounded-[12px] border-[var(--error)]/18 bg-[var(--error-container)]/65 text-[var(--error)] shadow-none"
            aria-label="删除"
          >
            <Trash2 className="h-[16px] w-[16px]" strokeWidth={1.5} />
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-[5px] self-center pr-3">
          {([1, 2, 3, 0] as AttendanceStatus[]).map((status) => {
            const cfg = STATUS_CONFIG[status]
            const isActive = student.attendanceStatus === status
            return (
              <Button
                key={status}
                type="button"
                variant="outline"
                onClick={() => onStatus(student.id, status)}
                className={cn(
                'h-8 min-w-[40px] rounded-[12px] border-[var(--outline-subtle)] px-2 !text-[12px] font-medium leading-none',
                isActive && cfg.active
              )}
              >
                {cfg.label}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default memo(SortableStudentRow)
