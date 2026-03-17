import { useState, useEffect, useRef, memo, type CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import gsap from 'gsap'
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

// 状态配置：未选中用 outline 样式，选中时为对应实色（通过 className 覆盖）
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
  const prevStatusRef = useRef<AttendanceStatus | null>(null)

  useEffect(() => {
    setInputValue(index.toString())
  }, [index])

  // 状态变化时：行轻微弹动反馈
  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = student.attendanceStatus
    if (prev === null) return
    if (prev === student.attendanceStatus) return
    const el = rowRef.current
    if (!el) return
    gsap.fromTo(
      el,
      { scaleX: 1.015 },
      { scaleX: 1, duration: 0.28, ease: 'power2.out', overwrite: true }
    )
  }, [student.attendanceStatus])

  const handleIndexBlur = () => {
    if (inputValue !== index.toString() && onIndexChange) onIndexChange(student.id, inputValue)
  }

  // 左侧状态指示条颜色
  const getIndicatorColor = () => {
    switch (student.attendanceStatus) {
      case 1: return 'var(--success)'
      case 2: return 'var(--leave)'
      case 3: return 'var(--primary)'
      default: return 'transparent'
    }
  }

  // 行背景：状态对应极淡色（晚到用 primary 蓝 0.04，与已到/请假同写法避免透明度不生效）
  const getRowBg = () => {
    switch (student.attendanceStatus) {
      case 1: return 'bg-[rgba(52,199,89,0.04)]'
      case 2: return 'bg-[rgba(255,159,10,0.04)]'
      case 3: return 'bg-[rgba(0,122,255,0.04)]'
      default: return 'bg-white'
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
      style={rowStyle}
      {...attributes}
      className={cn(
        'relative flex min-h-[44px] w-full items-center overflow-hidden',
        getRowBg(),
        isDragging && 'rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.10)]'
      )}
    >
      {/* 左侧状态指示条 */}
      <div
        className="absolute left-0 top-0 h-full w-[3px] transition-[background-color] duration-200"
        style={{ backgroundColor: getIndicatorColor() }}
      />

      {/* 拖拽手柄 */}
      <div
        {...listeners}
        className="flex h-full min-h-[44px] w-9 shrink-0 cursor-grab touch-none items-center justify-center pl-3 active:cursor-grabbing"
        aria-label="拖动排序"
      >
        <GripVertical className="h-4 w-4 text-[var(--outline)]" strokeWidth={2} />
      </div>

      {/* 序号 */}
      {showIndex && (
        <div className="mr-1 w-5 shrink-0">
          {onIndexChange ? (
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleIndexBlur}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="h-4 w-full rounded-[5px] border border-[var(--outline-subtle)] bg-[var(--surface-2)] px-0.5 py-0 text-center text-[10px] font-medium leading-tight text-[var(--on-surface-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40"
            />
          ) : (
            <span className="block text-center text-[10px] font-medium leading-tight tabular-nums text-[var(--on-surface-muted)]">{index}</span>
          )}
        </div>
      )}

      {/* 姓名 */}
      <div className="min-w-0 flex-1 pl-1">
        <span className={cn(
          'block truncate text-[13px] font-medium text-[var(--on-surface)]',
          isAndroid ? 'max-w-[5.5em]' : 'max-w-[7em] sm:max-w-none'
        )}>
          {student.name}
        </span>
      </div>

      {/* 考勤状态按钮组 or 编辑/删除 */}
      {showEdit ? (
        // 编辑模式：编辑 + 删除
        <div className="flex shrink-0 items-center gap-1 pr-3">
          <button
            type="button"
            onClick={() => onEdit(student.id, student.name)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--on-surface-muted)] transition-all duration-75 active:scale-[0.88] active:bg-[var(--surface-2)]"
            aria-label="编辑"
          >
            <Pencil className="h-[16px] w-[16px]" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(student.id)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--error)] transition-all duration-75 active:scale-[0.88] active:bg-[var(--error-container)]"
            aria-label="删除"
          >
            <Trash2 className="h-[16px] w-[16px]" strokeWidth={1.5} />
          </button>
        </div>
      ) : (
        // 点名模式：4 个状态按钮横排
        <div className="flex shrink-0 items-center gap-[5px] pr-3">
          {([1, 2, 3, 0] as AttendanceStatus[]).map((s) => {
            const cfg = STATUS_CONFIG[s]
            const isActive = student.attendanceStatus === s
            return (
              <Button
                key={s}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onStatus(student.id, s)}
                className={cn(
                  'h-6 min-w-[32px] rounded-md border-[var(--outline-subtle)] px-2 !text-[10px] font-semibold',
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
