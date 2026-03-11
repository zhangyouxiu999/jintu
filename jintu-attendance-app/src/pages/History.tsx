import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, History as HistoryIcon, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { animateStagger } from '@/lib/gsap'
import * as attendanceStore from '@/store/attendance'
import * as classesStore from '@/store/classes'
import * as studentsStore from '@/store/students'
import type { AttendanceSnapshot } from '@/types'
import { buildReportTextFromSnapshot, getReportDateLabelFromDate } from '@/lib/reportText'
import { PERIOD_NAMES } from '@/lib/period'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { showToast } from '@/lib/toast'

export default function History() {
  const { classId } = useParams<{ classId?: string }>()
  const navigate = useNavigate()
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [list, setList] = useState<AttendanceSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [detailSnap, setDetailSnap] = useState<AttendanceSnapshot | null>(null)
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false)
  const classButtonsRef = useRef<HTMLDivElement>(null)
  const snapshotListRef = useRef<HTMLUListElement>(null)

  const load = useCallback(async () => {
    const all = await classesStore.getAll()
    setClasses(all.map((c) => ({ id: c.id, name: c.name })))
    if (classId) {
      const snapshots = await attendanceStore.listByClass(classId)
      setList(snapshots)
    } else {
      setList([])
    }
    setLoading(false)
  }, [classId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    if (classId) {
      studentsStore.getByClassId(classId).then((students) => {
        const names: Record<string, string> = {}
        for (const s of students) names[s.id] = s.name
        setStudentNames(names)
      })
    }
  }, [classId])

  const currentClass = classId ? classes.find((c) => c.id === classId) : null

  useEffect(() => {
    if (!classId && classes.length > 0) {
      const revert = animateStagger(classButtonsRef.current, ':scope > *')
      return revert
    }
  }, [classId, classes.length])

  useEffect(() => {
    if (classId && list.length > 0) {
      const revert = animateStagger(snapshotListRef.current, ':scope > li')
      return revert
    }
  }, [classId, list.length])

  const handleExport = useCallback(async () => {
    const fileName = `${currentClass?.name ?? '考勤'}历史考勤.xlsx`
    try {
      const XLSX = await import('xlsx')
      const headers = ['日期', '时段', '应到', '实到', '请假', '晚到', '未到', '请假名单', '晚到名单', '未到名单']
      const rows: (string | number)[][] = [headers]
      for (const s of list) {
        const ids = Object.keys(s.statusMap)
        const total = ids.length
        const present = ids.filter((id) => s.statusMap[id] === 1).length
        const leaveIds = ids.filter((id) => s.statusMap[id] === 2)
        const lateIds = ids.filter((id) => s.statusMap[id] === 3)
        const absentIds = ids.filter((id) => s.statusMap[id] === 0)
        const leaveNames = leaveIds.map((id) => studentNames[id] ?? id).join(' ')
        const lateNames = lateIds.map((id) => studentNames[id] ?? id).join(' ')
        const absentNames = absentIds.map((id) => studentNames[id] ?? id).join(' ')
        rows.push([
          s.date,
          PERIOD_NAMES[s.period] ?? '',
          total,
          present,
          leaveIds.length,
          lateIds.length,
          absentIds.length,
          leaveNames || '—',
          lateNames || '—',
          absentNames || '—',
        ])
      }
      const ws = XLSX.utils.aoa_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '考勤记录')

      const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
      const arrayBuffer = buf instanceof ArrayBuffer ? buf : new Uint8Array(buf).buffer
      const { shareOrDownloadFile } = await import('@/lib/shareOrDownload')
      await shareOrDownloadFile(arrayBuffer, fileName, { dialogTitle: '导出考勤表' })
      showToast('已导出', { variant: 'success', duration: 1800 })
    } catch {
      showToast('导出失败，请重试', { variant: 'error' })
    }
  }, [currentClass?.name, list, studentNames])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="glass-bar sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-[var(--outline-variant)] px-[var(--page-x)] shadow-elevation-1" style={{ paddingTop: 'var(--safe-top)', minHeight: 'calc(56px + var(--safe-top))' }}>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full text-[var(--on-surface-variant)] active:scale-95 active:bg-[var(--surface-hover)]" onClick={() => navigate(-1)} aria-label="返回">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-title font-semibold text-[var(--on-surface)]">{classId && currentClass ? `${currentClass.name}历史考勤` : '本地历史'}</h1>
        {classId && list.length > 0 && (
          <Button variant="outline" size="sm" className="h-6 shrink-0 rounded-[var(--radius-sm)] border-[var(--outline)] px-1.5 text-tiny text-[var(--on-surface)]" onClick={() => setExportConfirmOpen(true)}>
            <Download className="mr-1 h-2.5 w-2.5" /> 导出
          </Button>
        )}
      </header>

      <main className="px-[var(--page-x)] py-4">
        {!classId && classes.length > 0 && (
          <div className="mb-3 card-soft p-4">
            <p className="text-label font-medium text-[var(--on-surface)]">选择班级</p>
            <p className="mt-0.5 text-caption text-[var(--on-surface-variant)]">查看该班级已确认的考勤记录</p>
            <div ref={classButtonsRef} className="mt-2 flex flex-wrap gap-1.5">
              {classes.map((c) => (
                <Button key={c.id} variant="outline" size="sm" className="h-7 rounded-[var(--radius-sm)] border-[var(--outline)] px-2.5 text-tiny text-[var(--on-surface)]" onClick={() => navigate(`/history/${c.id}`)}>{c.name}</Button>
              ))}
            </div>
          </div>
        )}

        {classId && (
          <>
            {loading ? (
              <div className="min-h-[120px] py-12 text-center" aria-busy="true" />
            ) : list.length === 0 ? (
              <div className="card-soft py-12 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--primary-container)] to-[var(--primary)]/20">
                  <HistoryIcon className="h-7 w-7 text-[var(--primary)]" />
                </div>
                <p className="text-title text-[var(--on-surface)]">暂无已确认考勤记录</p>
                <p className="mt-1 text-caption">在点名页点击「报告」→「复制并关闭」后会出现在此</p>
              </div>
            ) : (
              <ul ref={snapshotListRef} className="space-y-1.5">
                {(() => {
                  const byDate: Record<string, AttendanceSnapshot[]> = {}
                  for (const snap of list) {
                    if (!byDate[snap.date]) byDate[snap.date] = []
                    byDate[snap.date].push(snap)
                  }
                  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))
                  return dates.map((date) => {
                    const periods = byDate[date]
                    const isExpanded = expandedDate === date
                    return (
                      <li key={date} className="card-soft overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedDate(isExpanded ? null : date)}
                          className="flex min-h-10 w-full items-center justify-between px-3 py-2.5 text-left active:bg-[var(--surface-hover)]"
                        >
                          <span className="text-label font-semibold text-[var(--on-surface)]">{date}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--on-surface-variant)]" /> : <ChevronDown className="h-4 w-4 text-[var(--on-surface-variant)]" />}
                        </button>
                        {isExpanded && (
                          <ul className="border-t border-[var(--outline-variant)] bg-[var(--surface-2)] px-2 pb-1.5 pt-0.5">
                            {periods.map((snap, i) => (
                              <li key={snap.id} className={i > 0 ? 'border-t border-[var(--outline-variant)]' : ''}>
                                <button
                                  type="button"
                                  onClick={() => setDetailSnap(snap)}
                                  className="flex min-h-9 w-full items-center justify-between rounded-[var(--radius-sm)] px-2.5 py-2 text-left active:bg-[var(--surface-hover)]"
                                >
                                  <span className="text-caption text-[var(--on-surface)]">{PERIOD_NAMES[snap.period] ?? '—'}</span>
                                  <span className="text-tiny tabular-nums text-[var(--on-surface-variant)]">实到 {Object.values(snap.statusMap).filter((s) => s === 1).length} 人</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })
                })()}
              </ul>
            )}
          </>
        )}

        {!classId && classes.length === 0 && !loading && (
          <div className="card-soft py-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--primary-container)] to-[var(--primary)]/20">
              <HistoryIcon className="h-7 w-7 text-[var(--primary)]" />
            </div>
            <p className="text-title text-[var(--on-surface)]">暂无班级</p>
            <p className="mt-1 text-caption">请先新增班级并完成考勤确认</p>
          </div>
        )}

        <Dialog open={exportConfirmOpen} onOpenChange={setExportConfirmOpen}>
          <DialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[66.67vh] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-6 shadow-elevation-2">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-title text-[var(--on-surface)]">确认导出</DialogTitle>
              <DialogDescription className="text-caption text-[var(--on-surface-muted)]">
                将当前班级历史考勤导出为 Excel 文件，共 {list.length} 条记录。
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setExportConfirmOpen(false)} className="rounded-[var(--radius-sm)] h-8 px-3 border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] text-caption">取消</Button>
              <Button
                size="sm"
                onClick={async () => {
                  setExportConfirmOpen(false)
                  await handleExport()
                }}
                className="rounded-[var(--radius-sm)] h-8 px-3 bg-[var(--primary)] !text-white text-caption"
              >
                确认导出
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {detailSnap && (
          <Dialog open={!!detailSnap} onOpenChange={(open) => !open && setDetailSnap(null)}>
            <DialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[66.67vh] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border-0 p-0 shadow-elevation-2">
              <DialogHeader className="shrink-0 border-b border-[var(--outline-variant)] bg-[var(--surface)] px-4 py-4 text-center sm:text-center">
                <DialogTitle className="text-title text-[var(--on-surface)] block text-center">考勤报告</DialogTitle>
                <DialogDescription className="text-caption text-[var(--on-surface-muted)]">{getReportDateLabelFromDate(detailSnap.date, detailSnap.period)}</DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <pre className="whitespace-pre-wrap font-mono text-label leading-relaxed text-[var(--on-surface)]">
                  {buildReportTextFromSnapshot(currentClass?.name ?? '', detailSnap.date, detailSnap.period, detailSnap.statusMap, studentNames)}
                </pre>
              </div>
              <div className="shrink-0 flex justify-end gap-2 border-t border-[var(--outline-variant)] bg-[var(--surface)] px-4 py-3">
                <Button variant="outline" size="sm" onClick={() => setDetailSnap(null)} className="rounded-[var(--radius-sm)] h-8 px-3 border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] text-caption">关闭</Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    const text = buildReportTextFromSnapshot(currentClass?.name ?? '', detailSnap.date, detailSnap.period, detailSnap.statusMap, studentNames)
                    try {
                      const { copyToClipboard } = await import('@/lib/clipboard')
                      await copyToClipboard(text)
                      showToast('已复制', { variant: 'success', duration: 1800 })
                    } catch {
                      showToast('复制失败，请重试', { variant: 'error' })
                    }
                  }}
                  className="rounded-[var(--radius-sm)] h-8 px-3 bg-[var(--primary)] !text-white text-caption [&_svg]:!text-white"
                >
                  复制
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
