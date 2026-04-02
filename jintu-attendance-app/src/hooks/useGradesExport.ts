import { useCallback, useState } from 'react'
import type { GradesPeriod, Student } from '@/types'
import { buildGradesOnlyWorkbook } from '@/lib/exportClassExcel'
import { shareOrDownloadFile } from '@/lib/shareOrDownload'
import { showToast } from '@/lib/toast'

interface UseGradesExportParams {
  className?: string
  periods: GradesPeriod[]
  currentPeriodId: string | null
  sortedStudents: Student[]
}

export function useGradesExport({
  className,
  periods,
  currentPeriodId,
  sortedStudents,
}: UseGradesExportParams) {
  const [toolDrawerOpen, setToolDrawerOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current')
  const [exportPeriodId, setExportPeriodId] = useState<string | null>(null)
  const [exportSubmitting, setExportSubmitting] = useState(false)

  const handleExportGrades = useCallback(async () => {
    if (!className || periods.length === 0) {
      showToast('暂无成绩单可导出', { variant: 'error' })
      return
    }

    const periodIdToExport = exportPeriodId ?? currentPeriodId ?? periods[0]?.id
    const singlePeriod = periodIdToExport ? periods.find((period) => period.id === periodIdToExport) : periods[0]
    const periodsToExport = exportScope === 'current' && singlePeriod ? [singlePeriod] : periods

    if (periodsToExport.length === 0) {
      showToast('请先选择要导出的期', { variant: 'error' })
      return
    }

    setExportSubmitting(true)
    try {
      const sortedList = sortedStudents.map((student) => ({ id: student.id, name: student.name }))
      const buffer = await buildGradesOnlyWorkbook(className, periodsToExport, sortedList)
      const fileName = exportScope === 'current' && singlePeriod
        ? `${className}-${singlePeriod.name}.xlsx`
        : `${className}-成绩单.xlsx`
      await shareOrDownloadFile(buffer, fileName, { dialogTitle: '导出成绩单' })
      showToast('已导出', { variant: 'success', duration: 1800 })
      setExportDialogOpen(false)
    } catch {
      showToast('导出失败，请重试', { variant: 'error' })
    } finally {
      setExportSubmitting(false)
    }
  }, [className, currentPeriodId, exportPeriodId, exportScope, periods, sortedStudents])

  return {
    toolDrawerOpen,
    setToolDrawerOpen,
    exportDialogOpen,
    setExportDialogOpen,
    exportScope,
    setExportScope,
    exportPeriodId,
    setExportPeriodId,
    exportSubmitting,
    handleExportGrades,
  }
}
