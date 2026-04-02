import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BookOpen, FileDown, FileUp } from 'lucide-react'
import GlobalActionDrawer from '@/components/GlobalActionDrawer'
import { getCurrentWeekDays } from '@/lib/date'
import { SCHEDULE_PERIODS, cellKey } from '@/lib/schedule'
import { FormSheet, InlineMetaRow, ListSection, PageActionRow, SecondaryButton, SimpleListRow } from '@/components/ui/app-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyStateCard, LoadingStateCard } from '@/components/ui/mobile-ui'
import { useClassList } from '@/hooks/useClassList'
import { useScheduleData } from '@/hooks/useScheduleData'
import { buildScheduleOnlyWorkbook } from '@/lib/exportClassExcel'
import { shareOrDownloadFile } from '@/lib/shareOrDownload'
import { showToast } from '@/lib/toast'

function formatWeekRangeLabel(weekDays: ReturnType<typeof getCurrentWeekDays>): string {
  if (weekDays.length === 0) return ''
  const first = weekDays[0]
  const last = weekDays[weekDays.length - 1]
  if (!first.month || !first.date || !last.month || !last.date) return ''
  if (first.month === last.month) return `${first.month}月${first.date}日-${last.date}日`
  return `${first.month}月${first.date}日-${last.month}月${last.date}日`
}

export default function Schedule() {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const { list: classList } = useClassList()
  const weekDays = useMemo(() => getCurrentWeekDays(), [])
  const [selectedDay, setSelectedDay] = useState(weekDays.find((day) => day.isToday)?.label ?? weekDays[0]?.label ?? '周一')
  const [toolDrawerOpen, setToolDrawerOpen] = useState(false)

  const {
    scheduleData,
    editingCell,
    editingValue,
    setEditingCell,
    setEditingValue,
    handleSaveEdit,
    inputRef,
    importFileRef,
    handleImportExcel,
    importSubmitting,
  } = useScheduleData(classId)

  const className = classId ? classList.find((item) => item.id === classId)?.name ?? '' : ''
  const weekRangeLabel = useMemo(() => formatWeekRangeLabel(weekDays), [weekDays])

  const selectedDayInfo = weekDays.find((day) => day.label === selectedDay) ?? weekDays[0]
  const dayEntries = useMemo(() => {
    return SCHEDULE_PERIODS
      .filter((item) => !item.isBreak)
      .map((period) => {
        const key = cellKey(selectedDay, period.name)
        const title = scheduleData[key] ?? ''
        return { ...period, key, title }
      })
  }, [scheduleData, selectedDay])

  const openEdit = (period: string) => {
    const key = cellKey(selectedDay, period)
    setEditingValue(scheduleData[key] ?? '')
    setEditingCell({ day: selectedDay, period })
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleExportSchedule = async () => {
    if (!classId || !className) {
      showToast('未选择班级', { variant: 'error' })
      return
    }
    try {
      const buf = await buildScheduleOnlyWorkbook(className, scheduleData ?? {})
      const fileName = `${className}课程表.xlsx`
      await shareOrDownloadFile(buf, fileName, { dialogTitle: '导出课程表' })
      showToast('已导出', { variant: 'success', duration: 1800 })
    } catch {
      showToast('导出失败，请重试', { variant: 'error' })
    }
  }

  if (!classId) {
    return <EmptyStateCard icon={BookOpen} title="未选择班级" iconTone="primary" />
  }

  if (!className && classList.length > 0) {
    return <EmptyStateCard icon={BookOpen} title="班级不存在" iconTone="primary" />
  }

  if (classList.length === 0 && !className) {
    return <LoadingStateCard title="正在载入课表" />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3" data-class-id={classId}>
      <input
        ref={importFileRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={handleImportExcel}
      />

      <GlobalActionDrawer
        open={toolDrawerOpen}
        onOpenChange={setToolDrawerOpen}
        title={`${className || '当前班级'} · 课表工具`}
        actions={{
          importAction: {
            id: 'import-schedule',
            label: importSubmitting ? '导入中…' : '导入课表',
            icon: FileUp,
            onSelect: () => importFileRef.current?.click(),
            disabled: importSubmitting,
          },
          exportAction: {
            id: 'export-schedule',
            label: '导出课表',
            icon: FileDown,
            onSelect: () => void handleExportSchedule(),
          },
        }}
      />

      <PageActionRow>
        <SecondaryButton type="button" variant="outline" className="px-4" onClick={() => navigate(`/attendance/${classId}`)}>
          返回点名
        </SecondaryButton>
        <SecondaryButton type="button" variant="outline" className="px-4" onClick={() => setToolDrawerOpen(true)}>
          更多操作
        </SecondaryButton>
      </PageActionRow>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {weekDays.map((day) => (
          <Button
            key={day.label}
            type="button"
            variant={day.label === selectedDay ? 'secondary' : 'outline'}
            className="h-11 shrink-0 rounded-full px-4"
            onClick={() => setSelectedDay(day.label)}
          >
            <div className="flex flex-col items-center">
              <span className="text-[12px] font-semibold">{day.label}</span>
              <span className="text-[12px] leading-none opacity-75">{day.month}月{day.date}日</span>
            </div>
          </Button>
        ))}
      </div>

      {selectedDayInfo ? (
        <InlineMetaRow
          left={<span>{weekRangeLabel || '本周'}</span>}
          right={<span>{selectedDayInfo.label} · {selectedDayInfo.month}月{selectedDayInfo.date}日</span>}
          className="px-1"
        />
      ) : null}

      <ListSection className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-[var(--outline-variant)]/80">
          {dayEntries.map((entry) => (
            <SimpleListRow
              key={entry.key}
              onClick={() => openEdit(entry.name)}
              title={entry.title.trim() || '未安排课程'}
              description={entry.name}
              trailing={<span className="text-[12px] font-medium text-[var(--on-surface-muted)]">{entry.time}</span>}
            />
          ))}
        </div>
      </ListSection>

      <FormSheet
        open={!!editingCell}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCell(null)
            setEditingValue('')
          }
        }}
        title="编辑课程"
      >
        {editingCell ? (
          <div className="text-[12px] font-medium text-[var(--on-surface-muted)]">{editingCell.day} · {editingCell.period}</div>
        ) : null}
        <div className="py-1">
          <Input
            ref={inputRef}
            placeholder="例如：语文 / 数学 / 自习"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSaveEdit()
              }
            }}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingCell(null)
              setEditingValue('')
            }}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            onClick={() => handleSaveEdit()}
            className="flex-1"
          >
            保存
          </Button>
        </div>
      </FormSheet>
    </div>
  )
}
