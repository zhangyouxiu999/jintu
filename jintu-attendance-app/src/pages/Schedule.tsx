import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { animateStagger } from '@/lib/gsap'
import { FileDown, FileSpreadsheet, FileUp, MoreHorizontal, Sun } from 'lucide-react'
import { useAppLayout } from '@/components/AppLayout'
import PageHeader, { pageHeaderShellClassName } from '@/components/PageHeader'
import { useScheduleData } from '@/hooks/useScheduleData'
import { useClass } from '@/hooks/useClass'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { SCHEDULE_PERIODS, SCHEDULE_WEEKDAY_NAMES, cellKey } from '@/lib/schedule'

export default function Schedule() {
  const { classId } = useParams<{ classId: string }>()
  const { classEntity, loading } = useClass(classId)
  const {
    scheduleData,
    editingCell,
    setEditingCell,
    editingValue,
    setEditingValue,
    importSubmitting,
    importFileRef,
    inputRef,
    handleCellClick,
    handleSaveEdit,
    handleImportExcel,
  } = useScheduleData(classId)
  const scheduleTableRef = useRef<HTMLDivElement>(null)

  const { setPageActions } = useAppLayout()

  useEffect(() => {
    if (!classId || loading) return
    setPageActions({
      importAction: {
        id: 'schedule-import',
        label: '导入课表 Excel',
        icon: FileUp,
        disabled: importSubmitting,
        onSelect: () => importFileRef.current?.click(),
      },
      exportAction: {
        id: 'schedule-export',
        label: '导出课表',
        icon: FileDown,
        disabled: true,
      },
    })
    return () => setPageActions({})
  }, [classId, loading, importSubmitting, setPageActions])

  useEffect(() => {
    if (!classId || loading) return
    const revert = animateStagger(scheduleTableRef.current, 'tbody tr')
    return revert
  }, [classId, loading])

  if (loading || !classEntity) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <PageHeader title="课程表" />
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
      <header className={`${pageHeaderShellClassName} flex flex-col`}>
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
        <div ref={scheduleTableRef} className="overflow-hidden rounded-[20px] border border-[var(--outline)] bg-[var(--surface)]">
          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <table className="min-w-[556px] w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-20 min-w-20 border-b border-r border-[var(--outline-variant)] bg-[var(--surface-2)] py-1.5 text-center sm:py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--on-surface-muted)]">时段</span>
                  </th>
                {SCHEDULE_WEEKDAY_NAMES.map((day) => (
                    <th
                      key={day}
                      className="w-[68px] min-w-[68px] border-b border-[var(--outline-variant)] bg-[var(--surface-2)] py-1.5 text-center sm:py-2"
                    >
                      <span className="text-[12px] font-semibold text-[var(--on-surface-variant)] sm:text-[13px]">{day}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCHEDULE_PERIODS.map((p) => (
                  <tr
                    key={p.name}
                    className={p.isBreak ? 'border-t-2 border-[var(--outline)] bg-[var(--bg-subtle)]' : ''}
                  >
                    <td
                      className={cn(
                        'sticky left-0 z-10 w-20 min-w-20 border-b border-r border-[var(--outline-variant)] bg-[var(--surface-2)] text-center align-middle',
                        p.isBreak ? 'py-0.5' : 'py-1 sm:py-2'
                      )}
                    >
                      {p.isBreak ? (
                        <div className="flex flex-col items-center justify-center gap-0 py-0.5">
                          <Sun className="h-2.5 w-2.5 shrink-0 text-[var(--on-surface-muted)] sm:h-3 sm:w-3" aria-hidden />
                          <span className="text-[10px] font-medium leading-tight text-[var(--on-surface-muted)]">{p.name}</span>
                          <span className="text-[10px] leading-tight text-[var(--on-surface-muted)]">{p.time}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-0 py-0.5 sm:gap-0.5 sm:py-1">
                          <span className="text-[11px] font-semibold leading-tight text-[var(--on-surface-variant)] sm:text-[12px]">{p.name}</span>
                          <span className="text-[10px] leading-tight text-[var(--on-surface-muted)]">{p.time}</span>
                        </div>
                      )}
                    </td>
                    {SCHEDULE_WEEKDAY_NAMES.map((day) => {
                      const key = cellKey(day, p.name)
                      const isEditing = editingCell?.day === day && editingCell?.period === p.name
                      const display = scheduleData[key] ?? ''
                      const isEmpty = display === ''
                      return (
                        <td
                          key={day}
                          className={cn(
                            'border-b border-[var(--outline-variant)] align-middle',
                            p.isBreak ? 'bg-[var(--surface-2)]/60 p-0.5' : 'p-1 sm:p-2'
                          )}
                        >
                          <div className="flex min-h-0 items-center justify-center">
                            <div
                              className={cn(
                                'w-full min-w-0 overflow-hidden rounded-[var(--radius-sm)]',
                                p.isBreak ? 'h-5 sm:h-6' : 'h-7 sm:h-9'
                              )}
                            >
                              {p.isBreak ? (
                                <div className="flex h-full w-full items-center justify-center bg-transparent px-0.5">
                                  <Sun className="h-2.5 w-2.5 shrink-0 text-[var(--on-surface-muted)]/60 sm:h-3 sm:w-3" aria-hidden />
                                </div>
                              ) : isEditing ? (
                                <Input
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
                                  className={cn(
                                    'h-full w-full rounded-[10px] bg-[var(--surface-2)] px-1 py-0 text-center text-[11px] sm:px-2 sm:text-[12px]',
                                    'transition-[transform,background-color] duration-75 ease-out',
                                    'active:scale-[0.90] active:bg-[var(--surface-2)]',
                                    isEmpty ? 'text-[var(--on-surface-muted)]' : 'font-medium text-[var(--on-surface-variant)]'
                                  )}
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
