import { useCallback, useEffect, useRef, useState } from 'react'
import * as scheduleStore from '@/store/schedule'
import { showToast } from '@/lib/toast'
import { ROW_LABEL_TO_PERIOD, cellKey } from '@/lib/schedule'

interface EditingCell {
  day: string
  period: string
}

export function useScheduleData(classId: string | undefined) {
  const [scheduleData, setScheduleData] = useState<Record<string, string>>({})
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [importSubmitting, setImportSubmitting] = useState(false)
  const importFileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!classId) return
    setScheduleData(scheduleStore.getSchedule(classId))
  }, [classId])

  const persistSchedule = useCallback((next: Record<string, string>) => {
    if (!classId) return
    scheduleStore.saveSchedule(classId, next)
  }, [classId])

  const handleCellClick = useCallback((day: string, period: string) => {
    if (editingCell) {
      const previousKey = cellKey(editingCell.day, editingCell.period)
      const trimmed = editingValue.trim()
      const next = { ...scheduleData }
      if (trimmed) next[previousKey] = trimmed
      else delete next[previousKey]
      setScheduleData(next)
      persistSchedule(next)
    }
    const key = cellKey(day, period)
    setEditingValue(scheduleData[key] ?? '')
    setEditingCell({ day, period })
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [editingCell, editingValue, persistSchedule, scheduleData])

  const handleSaveEdit = useCallback(() => {
    if (!editingCell) return
    const key = cellKey(editingCell.day, editingCell.period)
    const trimmed = editingValue.trim()
    const next = { ...scheduleData }
    if (trimmed) next[key] = trimmed
    else delete next[key]
    setScheduleData(next)
    persistSchedule(next)
    setEditingCell(null)
  }, [editingCell, editingValue, persistSchedule, scheduleData])

  const handleImportExcel = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !classId || importSubmitting) return

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
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
      const workbook = XLSX.read(data, { type: 'array' })
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }) as (string | number | null)[][]

      let headerRowIndex = -1
      for (let rowIndex = 0; rowIndex < Math.min(rows.length, 5); rowIndex++) {
        const row = rows[rowIndex]
        if (!Array.isArray(row)) continue
        const hasMonday = row.some((cell) => String(cell ?? '').trim() === '周一')
        if (hasMonday) {
          headerRowIndex = rowIndex
          break
        }
      }

      if (headerRowIndex < 0) {
        showToast('未找到表头（周一～周日），请检查表格格式', { variant: 'error', duration: 2500 })
        return
      }

      const headerRow = rows[headerRowIndex] as (string | null)[]
      const weekdays: string[] = []
      for (let columnIndex = 1; columnIndex < headerRow.length; columnIndex++) {
        const cell = String(headerRow[columnIndex] ?? '').trim()
        if (cell && cell.startsWith('周')) weekdays.push(cell)
      }

      if (weekdays.length === 0) {
        showToast('未找到星期列', { variant: 'error', duration: 2500 })
        return
      }

      const next: Record<string, string> = {}
      for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex]
        if (!Array.isArray(row) || row.length < 2) continue
        const rowLabel = String(row[0] ?? '').trim()
        const period = ROW_LABEL_TO_PERIOD[rowLabel]
        if (!period || period === '中午休息' || period === '下午休息') continue

        for (let dayIndex = 0; dayIndex < weekdays.length; dayIndex++) {
          const columnIndex = dayIndex + 1
          if (columnIndex >= row.length) break
          const value = row[columnIndex]
          const text = value == null ? '' : String(value).trim()
          if (text) next[cellKey(weekdays[dayIndex], period)] = text
        }
      }

      setScheduleData(next)
      persistSchedule(next)
      showToast('课程表已导入', { variant: 'success', duration: 2000 })
    } catch (error) {
      console.warn('课程表 Excel 导入失败', error)
      showToast('解析失败，请检查文件格式', { variant: 'error', duration: 2500 })
    } finally {
      setImportSubmitting(false)
    }
  }, [classId, importSubmitting, persistSchedule])

  return {
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
  }
}
