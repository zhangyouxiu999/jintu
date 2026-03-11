import { useState, useEffect, useRef, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import gsap from 'gsap'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { Student } from '@/types'

/** 序号 45px + 姓名内容自适应 + 考勤状态内容宽度靠右、下行右侧留边距更大 */
const GRID_COLS = '45px minmax(2.5rem, 1fr) auto'
const GRID_COLS_EDIT = '45px minmax(2.5rem, 1fr)'

interface SortableStudentRowProps {
  student: Student
  index: number
  showEdit?: boolean
  showIndex?: boolean
  /** 由父组件传入，避免每行异步 setState 导致进入页面时大量重绘闪烁 */
  isAndroid?: boolean
  onIndexChange?: (id: string, newIndex: string) => void
  onStatus: (id: string, status: number) => void
  onEdit: (id: string, name: string) => void
  onDelete: (id: string) => void
}

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
  const prevStatusRef = useRef<number | null>(null)

  useEffect(() => {
    setInputValue(index.toString())
  }, [index])

  // 考勤状态变化时：行轻微缩放 + 高亮反馈
  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = student.attendanceStatus
    if (prev === null) return // 首屏不播动画
    if (prev === student.attendanceStatus) return
    const el = rowRef.current
    if (!el) return
    gsap.fromTo(
      el,
      { scale: 1.02, boxShadow: '0 0 0 2px var(--primary-container)' },
      { scale: 1, boxShadow: 'none', duration: 0.35, ease: 'power2.out', overwrite: true }
    )
  }, [student.attendanceStatus])

  const handleIndexBlur = () => {
    if (inputValue !== index.toString() && onIndexChange) onIndexChange(student.id, inputValue)
  }

  /** 竖线：当前背景色加深，偏柔不抢眼 */
  const getLeftBorderColor = () => {
    switch (student.attendanceStatus) {
      case 1: return 'var(--success-border)'
      case 2: return 'var(--leave-border)'
      case 3: return 'var(--late-border)'
      default: return 'var(--surface-border)'
    }
  }

  const getRowBg = () => {
    switch (student.attendanceStatus) {
      case 1: return 'bg-[var(--success-container)]'
      case 2: return 'bg-[var(--leave-container)]'
      case 3: return 'bg-[var(--late-container)]'
      default: return 'bg-[var(--surface)]'
    }
  }

  /** 修改学生时：行内从右向左滑动露出删除区。拖拽时用 sortable 的 transition，否则对左边框/背景做过渡 */
  const rowStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transform != null ? transition : 'border-color 0.3s ease-out, background-color 0.3s ease-out, box-shadow 0.3s ease-out',
    position: 'relative',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    borderLeftWidth: '2px',
    borderLeftStyle: 'solid',
    borderLeftColor: getLeftBorderColor(),
  }

  const DELETE_STRIP_WIDTH = 80

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
        'flex w-full items-stretch overflow-hidden py-2 pl-2 pr-6',
        getRowBg()
      )}
    >
      {/* 主内容区：修改学生时为 grid 两列（序号+姓名），否则为 grid 三列（+考勤状态） */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showEdit ? GRID_COLS_EDIT : GRID_COLS,
          gap: '0.5rem 1.5rem',
          alignItems: 'center',
          flex: 1,
          minWidth: 0,
          transition: 'margin-right 0.25s ease',
          marginRight: showEdit ? 0 : 0,
        }}
        className="items-stretch"
      >
        <div className="flex min-h-0 items-center gap-1.5">
          <div
            {...listeners}
            className="group flex h-full min-h-[2.5rem] cursor-grab active:cursor-grabbing touch-none items-center justify-center self-stretch rounded px-1.5 transition-colors active:bg-[var(--outline-variant)]"
            aria-label="拖动排序"
          >
            <GripVertical className="h-4 w-4 text-[var(--on-surface-muted)] transition-transform group-hover:scale-110 group-active:scale-100" />
          </div>
          {showIndex &&
            (onIndexChange ? (
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleIndexBlur}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-7 h-5 rounded-[var(--radius-sm)] border border-[var(--outline)] bg-[var(--surface-2)] text-center text-tiny font-medium text-[var(--on-surface-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
              />
            ) : (
              <span className="text-tiny font-medium tabular-nums text-[var(--on-surface-muted)]">{index}</span>
            ))}
        </div>
        <div className="flex min-w-0 items-center gap-2 pl-3">
          <span className={cn('min-w-0 truncate text-sm font-medium text-[var(--on-surface)]', showEdit && 'flex-1', isAndroid ? 'max-w-[5.5em]' : 'max-w-[80px] sm:max-w-none')}>{student.name}</span>
        </div>
        {!showEdit && (
        <div className="grid w-max max-w-full grid-cols-[auto_auto] gap-1 justify-self-end">
        <button
          type="button"
          className={cn(
            'h-7 w-max min-w-0 border px-2.5 rounded-[var(--radius-sm)] text-[10px] font-bold transition-all duration-200',
            student.attendanceStatus === 1 ? 'border-transparent bg-[var(--success)] text-white' : 'border-[var(--outline)] bg-[var(--surface)] text-[var(--success)]'
          )}
          onClick={() => onStatus(student.id, 1)}
        >
          已到
        </button>
        <button
          type="button"
          className={cn(
            'h-7 w-max min-w-0 border px-2.5 rounded-[var(--radius-sm)] text-[10px] font-bold transition-all duration-200',
            student.attendanceStatus === 2 ? 'border-transparent bg-[var(--leave)] text-white' : 'border-[var(--outline)] bg-[var(--surface)] text-[var(--leave)]'
          )}
          onClick={() => onStatus(student.id, 2)}
        >
          请假
        </button>
        <button
          type="button"
          className={cn(
            'h-7 w-max min-w-0 border px-2.5 rounded-[var(--radius-sm)] text-[10px] font-bold transition-all duration-200',
            student.attendanceStatus === 3 ? 'border-transparent bg-[var(--late)] text-white' : 'border-[var(--outline)] bg-[var(--surface)] text-[var(--late)]'
          )}
          onClick={() => onStatus(student.id, 3)}
        >
          晚到
        </button>
        <button
          type="button"
          className={cn(
            'h-7 w-max min-w-0 border px-2.5 rounded-[var(--radius-sm)] text-[10px] font-bold transition-all duration-200',
            student.attendanceStatus === 0 ? 'border-transparent bg-[var(--on-surface-muted)] text-white' : 'border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface-muted)]'
          )}
          onClick={() => onStatus(student.id, 0)}
        >
          未到
        </button>
        </div>
        )}
      </div>
      {/* 修改学生时：右侧删除区从右向左滑入 */}
      <div
        className="flex shrink-0 items-center justify-end gap-0.5 bg-[var(--error)]/10 transition-[width] duration-300 ease-out"
        style={{
          width: showEdit ? DELETE_STRIP_WIDTH : 0,
          minWidth: showEdit ? DELETE_STRIP_WIDTH : 0,
          overflow: 'hidden',
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full text-[var(--on-surface-variant)]"
          onClick={() => onEdit(student.id, student.name)}
          aria-label="编辑"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full text-[var(--error)]"
          onClick={() => onDelete(student.id)}
          aria-label="删除"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default memo(SortableStudentRow)
