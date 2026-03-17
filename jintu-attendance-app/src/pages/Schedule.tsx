import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { FileDown, FileUp } from 'lucide-react'
import { getCurrentWeekDays } from '@/lib/date'
import WeekScheduleGrid from '@/components/WeekScheduleGrid'
import { useAppLayout } from '@/components/AppLayout'
import { useClassList } from '@/hooks/useClassList'
import { useScheduleData } from '@/hooks/useScheduleData'
import { buildScheduleOnlyWorkbook } from '@/lib/exportClassExcel'
import { shareOrDownloadFile } from '@/lib/shareOrDownload'
import { showToast } from '@/lib/toast'

export default function Schedule() {
  const { classId } = useParams<{ classId: string }>()
  const { list: classList } = useClassList()
  const weekDays = useMemo(() => getCurrentWeekDays(), [])
  const {
    scheduleData,
    editingCell,
    editingValue,
    setEditingValue,
    handleCellClick,
    handleSaveEdit,
    inputRef,
    importFileRef,
    handleImportExcel,
    importSubmitting,
  } = useScheduleData(classId)

  const { setPageActions } = useAppLayout()
  const className = classId ? classList.find((c) => c.id === classId)?.name ?? '' : ''

  useEffect(() => {
    if (!classId) return
    setPageActions({
      importAction: {
        id: 'schedule-import',
        label: '导入课程表',
        icon: FileUp,
        disabled: importSubmitting,
        onSelect: () => importFileRef.current?.click(),
      },
      exportAction: {
        id: 'schedule-export',
        label: '导出课程表',
        icon: FileDown,
        onSelect: async () => {
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
        },
      },
    })
    return () => setPageActions({})
  }, [classId, className, importSubmitting, scheduleData, setPageActions])

  const hasEditableData = Boolean(classId && scheduleData)

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-class-id={classId}
    >
      <input
        ref={importFileRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={handleImportExcel}
      />
      <div className="flex flex-col flex-1 min-h-0 pb-3 overflow-hidden">
        <h2 className="text-title text-[var(--on-surface)] tracking-tight shrink-0 mb-5">
          本班课表
        </h2>
        <WeekScheduleGrid
          weekDays={weekDays}
          scheduleData={hasEditableData ? scheduleData : undefined}
          editingCell={editingCell}
          editingValue={editingValue}
          onEditingValueChange={setEditingValue}
          onCellClick={handleCellClick}
          onSaveEdit={handleSaveEdit}
          inputRef={inputRef}
        />
      </div>
    </div>
  )
}
