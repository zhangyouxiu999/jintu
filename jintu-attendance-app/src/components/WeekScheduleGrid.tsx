import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { cellKey as storageCellKey } from '@/lib/schedule'
import { Input } from '@/components/ui/input'

export type CourseColor = 'blue' | 'red' | 'teal' | 'gray'

export interface CourseCell {
  title: string
  teacher?: string
  location?: string
  color: CourseColor
}

export interface WeekDayInfo {
  label: string
  isToday: boolean
  date?: number
  month?: number
}

const TIME_ROWS: Array<
  | { type: 'course'; label: string; shortLabel: string; time: string }
  | { type: 'break'; label: string; time: string }
> = [
  { type: 'course', label: '第1节', shortLabel: '1', time: '08:00' },
  { type: 'course', label: '第2节', shortLabel: '2', time: '09:00' },
  { type: 'course', label: '第3节', shortLabel: '3', time: '10:00' },
  { type: 'course', label: '第4节', shortLabel: '4', time: '11:00' },
  { type: 'break', label: '午休', time: '11:50-14:00' },
  { type: 'course', label: '第5节', shortLabel: '5', time: '14:00' },
  { type: 'course', label: '第6节', shortLabel: '6', time: '15:00' },
  { type: 'course', label: '第7节', shortLabel: '7', time: '16:00' },
  { type: 'course', label: '第8节', shortLabel: '8', time: '17:00' },
  { type: 'break', label: '晚饭', time: '17:50-19:00' },
  { type: 'course', label: '晚一', shortLabel: '晚一', time: '19:00' },
  { type: 'course', label: '晚二', shortLabel: '晚二', time: '20:00' },
]

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function cellKey(dayIndex: number, rowIndex: number): string {
  return `${dayIndex}_${rowIndex}`
}

/** 课程行 rowIndex 对应存储的 period（周一_一 中的「一」等），休息行为 null */
const ROW_INDEX_TO_PERIOD: (string | null)[] = [
  '一', '二', '三', '四', null, '五', '六', '七', '八', null, '晚一', '晚二',
]

const MOCK_TODAY_INDEX = 2

function getMockSchedule(): Map<string, CourseCell> {
  const map = new Map<string, CourseCell>()
  const courseRowIndices = TIME_ROWS.map((r, i) => (r.type === 'course' ? i : -1)).filter((i) => i >= 0)
  const examples: CourseCell[] = [
    { title: '高等数学', teacher: '张老师', location: '教1-204', color: 'blue' },
    { title: '大学英语', teacher: '李老师', location: '教2-301', color: 'teal' },
    { title: '大学语文', teacher: '王老师', location: '教3-105', color: 'red' },
    { title: '计算机基础', teacher: '刘老师', location: '实验楼A-102', color: 'blue' },
    { title: '体育', teacher: '陈教练', location: '操场', color: 'teal' },
    { title: '自习', teacher: '', location: '', color: 'gray' },
  ]
  for (let d = 0; d < 7; d++) {
    courseRowIndices.forEach((rowIndex) => {
      const ex = examples[(d + rowIndex) % examples.length]
      map.set(cellKey(d, rowIndex), { ...ex })
    })
  }
  return map
}

export function getDefaultWeekDays(): WeekDayInfo[] {
  const mockMonth = 3
  const mockStartDate = 10
  return WEEKDAY_LABELS.map((label, i) => ({
    label,
    isToday: i === MOCK_TODAY_INDEX,
    date: mockStartDate + i,
    month: mockMonth,
  }))
}

export function formatWeekRangeLabel(weekDays: WeekDayInfo[]): string {
  if (weekDays.length === 0) return ''
  const first = weekDays[0]
  const last = weekDays[weekDays.length - 1]
  if (!first.month || !first.date || !last.month || !last.date) return ''
  if (first.month === last.month) return `${first.month}月${first.date}日–${last.date}日`
  return `${first.month}月${first.date}日–${last.month}月${last.date}日`
}

export interface ScheduleEditingState {
  day: string
  period: string
}

interface WeekScheduleGridProps {
  weekDays?: WeekDayInfo[]
  schedule?: Map<string, CourseCell>
  /** 可编辑模式：存储键为 周一_一 等，值为课程名 */
  scheduleData?: Record<string, string>
  editingCell?: ScheduleEditingState | null
  editingValue?: string
  onEditingValueChange?: (value: string) => void
  onCellClick?: (day: string, period: string) => void
  onSaveEdit?: () => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

const ROW_HEIGHT_COURSE = 32
const ROW_HEIGHT_BREAK = 16
const HEADER_HEIGHT = 28
const HEADER_TO_ROW_GAP = 2
const SECTION_GAP = 4
const ROW_GAP = 4
const COL_WIDTH = 72
const COLS_GAP = 4
const SCROLL_WIDTH = 7 * COL_WIDTH + 6 * COLS_GAP
const CELL_PADDING_X = 3
const CELL_PADDING_Y = 3

export default function WeekScheduleGrid({
  weekDays = getDefaultWeekDays(),
  schedule = getMockSchedule(),
  scheduleData,
  editingCell = null,
  editingValue = '',
  onEditingValueChange,
  onCellClick,
  onSaveEdit,
  inputRef,
}: WeekScheduleGridProps) {
  const isEditable = Boolean(scheduleData && onCellClick)
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayColRef = useRef<HTMLDivElement>(null)
  const todayIndex = weekDays.findIndex((d) => d.isToday)

  useEffect(() => {
    if (todayIndex >= 0 && todayColRef.current && scrollRef.current) {
      todayColRef.current.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    }
  }, [todayIndex])

  return (
    <div
      className="flex flex-col min-h-0 flex-1 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface)]"
      role="grid"
      aria-label="课程表"
    >
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* 左侧时段：与右侧同一套 ROW_GAP + SECTION_GAP + 行高，保证逐行对齐 */}
        <div
          className="sticky left-0 z-10 shrink-0 flex flex-col bg-[var(--surface)] pl-1.5 pr-2"
          style={{ width: 52, minWidth: 52 }}
        >
          <div
            style={{ height: HEADER_HEIGHT + HEADER_TO_ROW_GAP }}
            className="shrink-0"
            aria-hidden
          />
          <div className="flex flex-1 flex-col min-h-0" style={{ gap: ROW_GAP }}>
            {TIME_ROWS.map((row, rowIndex) => {
              const isBreak = row.type === 'break'
              const addGapBefore = rowIndex === 4 || rowIndex === 5 || rowIndex === 9 || rowIndex === 10
              return (
                <div key={rowIndex} className="shrink-0 flex flex-col">
                  {addGapBefore && <div style={{ height: SECTION_GAP }} aria-hidden />}
                  <div
                    className="flex items-center justify-end"
                    style={{ height: isBreak ? ROW_HEIGHT_BREAK : ROW_HEIGHT_COURSE }}
                    role="rowheader"
                    aria-rowindex={rowIndex + 2}
                  >
                    <span className="text-[11px] tabular-nums text-[var(--on-surface-muted)] truncate text-right max-w-full">
                      {isBreak ? `${row.label} ${row.time}` : row.time}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="shrink-0 w-px bg-[var(--outline-variant)]" aria-hidden />

        {/* 周一～周日七列 + 左右渐变遮罩提示可横向滑动 */}
        <div className="flex-1 min-w-0 relative">
          <div
            ref={scrollRef}
            className="h-full overflow-x-auto overflow-y-auto scrollbar-thin"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div
              className="flex py-4 px-2"
              style={{ width: SCROLL_WIDTH, minWidth: SCROLL_WIDTH, gap: COLS_GAP }}
            >
            {weekDays.map((day, dayIndex) => {
              const isToday = day.isToday
              return (
                <div
                  key={day.label}
                  ref={isToday ? todayColRef : undefined}
                  className={cn(
                    'flex flex-col shrink-0 rounded-[var(--radius-md)]',
                    isToday ? 'bg-[var(--primary-container)] px-2 overflow-visible' : 'px-1.5 overflow-hidden'
                  )}
                  style={{ width: COL_WIDTH }}
                >
                  <div
                    className={cn(
                      'flex flex-col flex-1 min-h-0',
                      isToday && '-mt-2 -mb-2 pt-2 pb-2'
                    )}
                  >
                    <div
                      className="flex flex-col items-center justify-center shrink-0 relative gap-0.5"
                      style={{ height: HEADER_HEIGHT, marginBottom: HEADER_TO_ROW_GAP }}
                      role="columnheader"
                      aria-colindex={dayIndex + 1}
                      aria-rowindex={1}
                    >
                      {isToday && (
                        <span
                          className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-[var(--primary)]"
                          aria-hidden
                        />
                      )}
                      <span
                        className={cn(
                          'text-[12px] leading-tight',
                          isToday
                            ? 'text-[var(--primary)] font-semibold'
                            : 'text-[var(--on-surface-muted)] font-medium'
                        )}
                      >
                        {day.label}
                      </span>
                      {day.month != null && day.date != null && (
                        <span className="text-[10px] leading-tight text-[var(--on-surface-muted)] tabular-nums">
                          {day.month}月{day.date}日
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-h-0" style={{ gap: ROW_GAP }}>
                    {TIME_ROWS.map((row, rowIndex) => {
                      const isBreak = row.type === 'break'
                      const addGapBefore =
                        rowIndex === 4 || rowIndex === 5 || rowIndex === 9 || rowIndex === 10
                      if (isBreak) {
                        return (
                          <div key={rowIndex} className="shrink-0 flex flex-col">
                            {addGapBefore && <div style={{ height: SECTION_GAP }} aria-hidden />}
                            <div
                              className="flex items-center justify-center shrink-0"
                              style={{ height: ROW_HEIGHT_BREAK }}
                              role="gridcell"
                              aria-colindex={dayIndex + 1}
                              aria-rowindex={rowIndex + 2}
                            >
                              <span className="text-[10px] text-[var(--on-surface-muted)]">
                                {row.label}
                              </span>
                            </div>
                          </div>
                        )
                      }
                      const period = ROW_INDEX_TO_PERIOD[rowIndex]
                      const dayLabel = day.label
                      const storageKey = period ? storageCellKey(dayLabel, period) : null
                      const editableTitle = storageKey && scheduleData ? (scheduleData[storageKey] ?? '') : null
                      const isEditing =
                        isEditable &&
                        editingCell?.day === dayLabel &&
                        editingCell?.period === period
                      const cell =
                        editableTitle !== null
                          ? { title: editableTitle }
                          : schedule.get(cellKey(dayIndex, rowIndex))
                      const hasContent = cell && String(cell.title).trim() !== ''
                      return (
                        <div key={rowIndex} className="shrink-0 flex flex-col">
                          {addGapBefore && <div style={{ height: SECTION_GAP }} aria-hidden />}
                          <div
                            className={cn(
                              'rounded-[var(--radius-sm)] flex flex-col min-h-0 justify-center items-center',
                              isEditable && 'press cursor-pointer',
                              hasContent || isEditing
                                ? 'bg-transparent'
                                : isEditable
                                  ? 'border border-dashed border-[var(--outline-variant)]'
                                  : 'bg-transparent'
                            )}
                            style={{
                              height: ROW_HEIGHT_COURSE,
                              color: 'var(--on-surface)',
                              padding: `${CELL_PADDING_Y}px ${CELL_PADDING_X}px`,
                            }}
                            role="gridcell"
                            aria-colindex={dayIndex + 1}
                            aria-rowindex={rowIndex + 2}
                            onClick={
                              isEditable && period
                                ? () => onCellClick?.(dayLabel, period)
                                : undefined
                            }
                          >
                            {isEditing ? (
                              <Input
                                ref={inputRef as React.Ref<HTMLInputElement>}
                                value={editingValue}
                                onChange={(e) => onEditingValueChange?.(e.target.value)}
                                onBlur={onSaveEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') onSaveEdit?.()
                                }}
                                placeholder="课程名"
                                className="h-5 w-full min-w-0 text-[11px] leading-tight py-0.5 px-1.5 border-[var(--outline-variant)]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : hasContent && cell ? (
                              <div className="w-full min-w-0 flex flex-col items-center justify-center gap-0 text-center">
                                <span className="text-[11px] truncate leading-tight text-[var(--on-surface)] w-full">
                                  {cell.title}
                                </span>
                                {'teacher' in cell && (cell.teacher || cell.location) && (
                                  <span className="text-[9px] truncate leading-tight text-[var(--on-surface-muted)] w-full">
                                    {[cell.teacher, cell.location].filter(Boolean).join(' · ')}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[9px] leading-tight text-[var(--on-surface-muted)]">
                                {isEditable ? '点击填写' : '无课'}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
