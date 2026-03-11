import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { animateStagger } from '@/lib/gsap'
import { Sun, FileSpreadsheet, MoreHorizontal } from 'lucide-react'
import { useClass } from '@/hooks/useClass'
import { storage } from '@/store/storage'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { showToast } from '@/lib/toast'

/** 节次简称 + 时间；isBreak 为休息行（四与五之间中午休息，八与晚一之间下午休息） */
const PERIODS = [
  { name: '一', time: '8:00-8:50', isBreak: false },
  { name: '二', time: '9:00-9:50', isBreak: false },
  { name: '三', time: '10:00-10:50', isBreak: false },
  { name: '四', time: '11:00-11:50', isBreak: false },
  { name: '中午休息', time: '12:00-14:00', isBreak: true },
  { name: '五', time: '2:00-2:50', isBreak: false },
  { name: '六', time: '3:00-3:50', isBreak: false },
  { name: '七', time: '4:00-4:50', isBreak: false },
  { name: '八', time: '5:00-5:50', isBreak: false },
  { name: '下午休息', time: '18:00-19:00', isBreak: true },
  { name: '晚一', time: '7:00-7:50', isBreak: false },
  { name: '晚二', time: '8:00-8:50', isBreak: false },
] as const
const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function cellKey(day: string, period: string) {
  return `${day}_${period}`
}

/** Excel 行标签（第一列）到课程表节次名的映射 */
const ROW_LABEL_TO_PERIOD: Record<string, string> = {
  第一节课: '一',
  第二节课: '二',
  第三节课: '三',
  第四节课: '四',
  午休: '中午休息',
  第五节课: '五',
  第六节课: '六',
  第七节课: '七',
  第八节课: '八',
  晚饭: '下午休息',
  晚一: '晚一',
  晚二: '晚二',
}

export default function Schedule() {
  const { classId } = useParams<{ classId: string }>()
  const { classEntity, loading } = useClass(classId)
  const [scheduleData, setScheduleData] = useState<Record<string, string>>({})
  const [editingCell, setEditingCell] = useState<{ day: string; period: string } | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [importSubmitting, setImportSubmitting] = useState(false)
  const importFileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scheduleTableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!classId || loading) return
    const revert = animateStagger(scheduleTableRef.current, 'tbody tr')
    return revert
  }, [classId, loading])

  useEffect(() => {
    if (!classId) return
    const all = storage.loadSchedule()
    const forClass = all?.[classId] ?? {}
    setScheduleData(forClass)
  }, [classId])

  const persistSchedule = (next: Record<string, string>) => {
    if (!classId) return
    const all = storage.loadSchedule() ?? {}
    storage.saveSchedule({ ...all, [classId]: next })
  }

  const handleCellClick = (day: string, period: string) => {
    if (editingCell) handleSaveEdit()
    const key = cellKey(day, period)
    setEditingValue(scheduleData[key] ?? '')
    setEditingCell({ day, period })
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSaveEdit = () => {
    if (!editingCell) return
    const key = cellKey(editingCell.day, editingCell.period)
    const trimmed = editingValue.trim()
    const next = { ...scheduleData }
    if (trimmed) next[key] = trimmed
    else delete next[key]
    setScheduleData(next)
    persistSchedule(next)
    setEditingCell(null)
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !classId || importSubmitting) return
    const name = file.name.toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      showToast('请选择 .xlsx 或 .xls 文件', { variant: 'error', duration: 2000 })
      return
    }
    setImportSubmitting(true)
    let data: ArrayBuffer
    try {
      data = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })
    } catch {
      showToast('文件读取失败，请重试', { variant: 'error', duration: 2500 })
      setImportSubmitting(false)
      return
    }
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.read(data, { type: 'array' })
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as (string | number | null)[][]
      let headerRowIndex = -1
      for (let r = 0; r < Math.min(rows.length, 5); r++) {
        const row = rows[r]
        if (!Array.isArray(row)) continue
        const hasMonday = row.some((c) => String(c ?? '').trim() === '周一')
        if (hasMonday) {
          headerRowIndex = r
          break
        }
      }
      if (headerRowIndex < 0) {
        showToast('未找到表头（周一～周日），请检查表格格式', { variant: 'error', duration: 2500 })
        return
      }
      const headerRow = rows[headerRowIndex] as (string | null)[]
      const weekdays: string[] = []
      for (let c = 1; c < headerRow.length; c++) {
        const cell = String(headerRow[c] ?? '').trim()
        if (cell && (cell.startsWith('周') || ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].includes(cell)))
          weekdays.push(cell)
      }
      if (weekdays.length === 0) {
        showToast('未找到星期列', { variant: 'error', duration: 2500 })
        return
      }
      const next: Record<string, string> = {}
      for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r] as (string | number | null)[]
        if (!Array.isArray(row) || row.length < 2) continue
        const firstCell = String(row[0] ?? '').trim()
        const period = ROW_LABEL_TO_PERIOD[firstCell]
        if (!period) continue
        if (period === '中午休息' || period === '下午休息') continue
        for (let c = 0; c < weekdays.length; c++) {
          const colIndex = c + 1
          if (colIndex >= row.length) break
          const val = row[colIndex]
          const str = val === null || val === undefined ? '' : String(val).trim()
          if (str) next[cellKey(weekdays[c], period)] = str
        }
      }
      setScheduleData(next)
      persistSchedule(next)
      showToast('课程表已导入', { variant: 'success', duration: 2000 })
    } catch (err) {
      console.warn('课程表 Excel 导入失败', err)
      showToast('解析失败，请检查文件格式', { variant: 'error', duration: 2500 })
    } finally {
      setImportSubmitting(false)
    }
  }

  if (loading || !classEntity) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <header
          className="glass-bar sticky top-0 z-50 flex h-14 items-center gap-2 border-b border-[var(--outline-variant)] px-[var(--page-x)] py-2 shadow-elevation-1"
          style={{ paddingTop: 'var(--safe-top)', minHeight: 'calc(56px + var(--safe-top))' }}
        >
          <div className="w-10 shrink-0" aria-hidden />
          <h1 className="min-w-0 flex-1 truncate text-title font-semibold text-[var(--on-surface)]">课程表</h1>
        </header>
        <main className="flex min-h-[200px] items-center justify-center px-[var(--page-x)] py-4">
          <p className="text-label text-[var(--on-surface-muted)]">{loading ? '' : '班级不存在'}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <input
        ref={importFileRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={handleImportExcel}
      />
      {/* 顶栏 · 与成绩单页面统一：标题芯片 + 更多下拉 */}
      <header
        className="glass-bar sticky top-0 z-50 flex flex-col border-b border-[var(--outline-variant)] shadow-elevation-1"
        style={{ paddingTop: 'var(--safe-top)', minHeight: 'calc(56px + var(--safe-top))' }}
      >
        <div className="flex min-h-14 items-center justify-between gap-2 border-b border-[var(--outline-variant)] px-[var(--page-x)] py-2">
          <div className="w-10 shrink-0" aria-hidden />
          <div className="flex min-w-0 flex-1 justify-start overflow-hidden">
            <div className="flex max-w-full items-center rounded-[var(--radius-sm)] border border-[var(--outline-variant)] bg-[var(--surface-2)] py-2 pl-3 pr-3">
              <span className="truncate text-body font-bold text-[var(--on-surface)]">{classEntity.name} · 课程表</span>
            </div>
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="h-10 w-10 shrink-0 rounded-full text-[var(--on-surface-variant)] active:scale-95"
                aria-label="更多"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  importFileRef.current?.click()
                }}
                disabled={importSubmitting}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {importSubmitting ? '导入中…' : '导入 Excel'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="px-[var(--page-x)] py-4 pb-[calc(var(--space-24)+var(--safe-bottom))]">
        <div ref={scheduleTableRef} className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outline)] bg-[var(--surface)] shadow-elevation-card">
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full border-collapse" style={{ minWidth: 80 + 7 * 68 }}>
              <colgroup>
                <col style={{ width: 80 }} />
                {WEEKDAY_NAMES.map((day) => (
                  <col key={day} style={{ width: 68 }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-r border-[var(--outline-variant)] bg-[var(--surface-2)] py-1.5 text-center shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] sm:py-2" style={{ width: 80, minWidth: 80 }}>
                    <span className="text-tiny font-medium uppercase tracking-wider text-[var(--on-surface-muted)]">时段</span>
                  </th>
                  {WEEKDAY_NAMES.map((day) => (
                    <th
                      key={day}
                      className="border-b border-[var(--outline-variant)] bg-[var(--surface-2)] py-1.5 text-center sm:py-2"
                    >
                      <span className="text-caption font-medium text-[var(--on-surface)] sm:text-label">{day}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p) => (
                  <tr
                    key={p.name}
                    className={p.isBreak ? 'border-t-2 border-[var(--outline)] bg-[var(--bg-subtle)]' : ''}
                  >
                    <td
                      className={`sticky left-0 z-10 border-b border-r border-[var(--outline-variant)] text-center align-middle bg-[var(--surface-2)] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] ${p.isBreak ? 'py-0.5' : 'py-1 sm:py-2'}`}
                      style={{ width: 80, minWidth: 80 }}
                    >
                      {p.isBreak ? (
                        <div className="flex flex-col items-center justify-center gap-0 py-0.5">
                          <Sun className="h-2.5 w-2.5 shrink-0 text-[var(--on-surface-muted)] sm:h-3 sm:w-3" aria-hidden />
                          <span className="text-tiny font-medium leading-tight text-[var(--on-surface-muted)]">{p.name}</span>
                          <span className="text-tiny leading-tight text-[var(--on-surface-muted)]/80">{p.time}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-0 py-0.5 sm:gap-0.5 sm:py-1">
                          <span className="text-caption font-medium leading-tight text-[var(--on-surface-variant)] sm:text-label">{p.name}</span>
                          <span className="text-tiny leading-tight text-[var(--on-surface-muted)]">{p.time}</span>
                        </div>
                      )}
                    </td>
                    {WEEKDAY_NAMES.map((day) => {
                      const key = cellKey(day, p.name)
                      const isEditing = editingCell?.day === day && editingCell?.period === p.name
                      const display = scheduleData[key] ?? ''
                      const isEmpty = display === ''
                      return (
                        <td
                          key={day}
                          className={`border-b border-[var(--outline-variant)] align-middle ${p.isBreak ? 'bg-[var(--bg-subtle)] p-0.5' : 'p-1 sm:p-2'}`}
                        >
                          <div className="flex min-h-0 items-center justify-center">
                            <div className={`w-full min-w-0 overflow-hidden rounded-[var(--radius-sm)] ${p.isBreak ? 'h-5 sm:h-6' : 'h-7 sm:h-9'}`}>
                              {p.isBreak ? (
                                <div className="flex h-full w-full items-center justify-center bg-transparent px-0.5">
                                  <Sun className="h-2.5 w-2.5 shrink-0 text-[var(--on-surface-muted)]/60 sm:h-3 sm:w-3" aria-hidden />
                                </div>
                              ) : isEditing ? (
                                <input
                                  ref={inputRef}
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={handleSaveEdit}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit()
                                    if (e.key === 'Escape') setEditingCell(null)
                                  }}
                                  placeholder="课程"
                                  className="h-full w-full min-w-0 rounded-[var(--radius-sm)] border-0 bg-[var(--surface)] px-1 py-0 text-center text-caption text-[var(--on-surface)] outline-none placeholder:text-[var(--on-surface-muted)] sm:px-2 sm:text-label"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleCellClick(day, p.name)}
                                  className={`h-full w-full rounded-[var(--radius-sm)] px-1 py-0 text-center text-caption transition-colors active:scale-[0.98] bg-[var(--surface-2)] active:bg-[var(--surface-hover)] sm:px-2 sm:text-label ${isEmpty ? 'text-[var(--on-surface-muted)]' : 'text-[var(--on-surface)]'}`}
                                >
                                  <span className="block truncate">{display}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
