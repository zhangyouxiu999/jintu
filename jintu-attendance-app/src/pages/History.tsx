import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { History as HistoryIcon, Download, ChevronDown, ChevronUp } from 'lucide-react'
import * as attendanceStore from '@/store/attendance'
import * as classesStore from '@/store/classes'
import * as studentsStore from '@/store/students'
import type { ConfirmedAttendanceRecord } from '@/types'
import { buildReportTextFromSnapshot, getReportDateLabelFromDate } from '@/lib/reportText'
import { PERIOD_NAMES } from '@/lib/period'
import { FormSheet, InlineMetaRow, ListSection, PageActionRow, SecondaryButton, SimpleListRow } from '@/components/ui/app-ui'
import { Button } from '@/components/ui/button'
import { EmptyStateCard, LoadingStateCard } from '@/components/ui/mobile-ui'
import { showToast } from '@/lib/toast'

export default function History() {
  const { classId } = useParams<{ classId?: string }>()
  const navigate = useNavigate()
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [list, setList] = useState<ConfirmedAttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [detailSnap, setDetailSnap] = useState<ConfirmedAttendanceRecord | null>(null)
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const classButtonsRef = useRef<HTMLDivElement>(null)
  const snapshotListRef = useRef<HTMLUListElement>(null)

  const load = useCallback(async () => {
    const all = await classesStore.getAll()
    setClasses(all.map((classEntity) => ({ id: classEntity.id, name: classEntity.name })))
    if (classId) {
      const snapshots = await attendanceStore.listConfirmedByClass(classId)
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
    if (!classId) return
    studentsStore.getByClassId(classId).then((students) => {
      const names: Record<string, string> = {}
      for (const student of students) names[student.id] = student.name
      setStudentNames(names)
    })
  }, [classId])

  const currentClass = classId ? classes.find((classEntity) => classEntity.id === classId) : null
  const historyDateCount = new Set(list.map((item) => item.date)).size

  const handleExport = useCallback(async () => {
    const fileName = `${currentClass?.name ?? '考勤'}历史考勤.xlsx`
    try {
      const XLSX = await import('xlsx')
      const headers = ['日期', '时段', '应到', '实到', '请假', '晚到', '未到', '请假名单', '晚到名单', '未到名单']
      const rows: (string | number)[][] = [headers]
      for (const snapshot of list) {
        const ids = Object.keys(snapshot.statusMap)
        const total = ids.length
        const present = ids.filter((id) => snapshot.statusMap[id] === 1).length
        const leaveIds = ids.filter((id) => snapshot.statusMap[id] === 2)
        const lateIds = ids.filter((id) => snapshot.statusMap[id] === 3)
        const absentIds = ids.filter((id) => snapshot.statusMap[id] === 0)
        const leaveNames = leaveIds.map((id) => studentNames[id] ?? id).join(' ')
        const lateNames = lateIds.map((id) => studentNames[id] ?? id).join(' ')
        const absentNames = absentIds.map((id) => studentNames[id] ?? id).join(' ')
        rows.push([
          snapshot.date,
          PERIOD_NAMES[snapshot.period] ?? '',
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

  if (classId && !loading && !currentClass) {
    return <EmptyStateCard icon={HistoryIcon} title="班级不存在" iconTone="primary" />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {classId && currentClass ? (
        <>
          <PageActionRow className="items-center">
            <SecondaryButton variant="outline" className="px-4" onClick={() => navigate(`/attendance/${classId}`)}>
              返回点名
            </SecondaryButton>
            <InlineMetaRow
              left={<span>{historyDateCount} 天 · {list.length} 条记录</span>}
              right={<span>{currentClass.name}</span>}
              className="min-w-0 flex-1 rounded-full border border-[var(--outline)]/70 bg-[var(--surface)] px-3 py-2"
            />
          {list.length > 0 ? (
            <SecondaryButton variant="outline" className="px-4" onClick={() => void handleExport()}>
              <Download className="mr-1.5 h-4 w-4" />
              导出
            </SecondaryButton>
          ) : null}
          </PageActionRow>
        </>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {!classId && classes.length > 0 ? (
          <ListSection>
            <div ref={classButtonsRef} className="grid grid-cols-1 gap-0 sm:grid-cols-2">
              {classes.map((classEntity) => (
                <SimpleListRow
                  key={classEntity.id}
                  title={classEntity.name}
                  description={undefined}
                  onClick={() => navigate(`/history/${classEntity.id}`)}
                />
              ))}
            </div>
          </ListSection>
        ) : null}

        {classId ? (
          loading ? (
            <LoadingStateCard title="正在载入历史考勤" className="min-h-[200px]" />
          ) : list.length === 0 ? (
            <EmptyStateCard
              icon={HistoryIcon}
              title="暂无记录"
              actionLabel="返回点名页"
              onAction={() => navigate(`/attendance/${classId}`)}
              iconTone="primary"
            />
          ) : (
            <ListSection className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ul ref={snapshotListRef} className="space-y-2">
                  {(() => {
                    const byDate: Record<string, ConfirmedAttendanceRecord[]> = {}
                    for (const snapshot of list) {
                      if (!byDate[snapshot.date]) byDate[snapshot.date] = []
                      byDate[snapshot.date].push(snapshot)
                    }
                    const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))
                    return dates.map((date) => {
                      const periods = byDate[date]
                      const isExpanded = expandedDate === date
                      return (
                        <li key={date} className="overflow-hidden border-b border-[var(--outline-variant)] last:border-b-0">
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setExpandedDate(isExpanded ? null : date)}
                              className="flex h-auto min-h-[48px] min-w-0 flex-1 items-center justify-between rounded-[14px] px-3 py-3 text-left"
                            >
                              <span className="text-[15px] font-semibold text-[var(--on-surface)]">{date}</span>
                              {isExpanded ? (
                                <ChevronUp aria-hidden="true" className="h-[15px] w-[15px] text-[var(--on-surface-muted)]" strokeWidth={1.5} />
                              ) : (
                                <ChevronDown aria-hidden="true" className="h-[15px] w-[15px] text-[var(--on-surface-muted)]" strokeWidth={1.5} />
                              )}
                            </Button>
                            <span className="shrink-0 text-[12px] text-[var(--on-surface-muted)]">{periods.length} 个时段</span>
                          </div>
                          {isExpanded ? (
                            <div className="border-t border-[var(--outline-variant)] bg-[var(--surface-2)]/45 px-3 py-2">
                              <ul className="space-y-2">
                                {periods.map((snapshot) => (
                                  <li key={snapshot.id} className="flex items-center gap-3">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      onClick={() => setDetailSnap(snapshot)}
                                      className="flex h-auto min-h-[46px] min-w-0 flex-1 items-center justify-start rounded-[14px] bg-[var(--surface)] px-3 py-3 text-left shadow-[inset_0_0_0_1px_rgba(108,114,107,0.08)]"
                                    >
                                      <span className="text-[14px] font-medium text-[var(--on-surface-variant)]">
                                        {PERIOD_NAMES[snapshot.period] ?? '—'}
                                      </span>
                                    </Button>
                                    <span className="shrink-0 text-[12px] text-[var(--on-surface-muted)]">
                                      实到 {Object.values(snapshot.statusMap).filter((status) => status === 1).length} 人
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </li>
                      )
                    })
                  })()}
                </ul>
              </div>
            </ListSection>
          )
        ) : null}

        {!classId && classes.length === 0 && !loading ? (
          <EmptyStateCard
            icon={HistoryIcon}
            title="暂无班级"
            iconTone="primary"
          />
        ) : null}

        {detailSnap ? (
          <FormSheet
            open={!!detailSnap}
            onOpenChange={(open) => !open && setDetailSnap(null)}
            title="考勤报告"
            className="max-h-[80dvh]"
          >
            <div className="text-[12px] font-medium text-[var(--on-surface-muted)]">
              {getReportDateLabelFromDate(detailSnap.date, detailSnap.period)}
            </div>
            <div className="space-y-4">
              <div className="max-h-[48dvh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--outline-variant)] bg-[var(--surface-2)] px-4 py-3">
                <pre className="whitespace-pre-wrap text-[14px] leading-6 text-[var(--on-surface)]">
                  {buildReportTextFromSnapshot(currentClass?.name ?? '', detailSnap.date, detailSnap.period, detailSnap.statusMap, studentNames)}
                </pre>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDetailSnap(null)} className="flex-1">关闭</Button>
                <Button
                  className="flex-1"
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
                >
                  复制
                </Button>
              </div>
            </div>
          </FormSheet>
        ) : null}
      </div>
    </div>
  )
}
