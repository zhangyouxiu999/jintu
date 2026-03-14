import { useCallback, useRef, useState } from 'react'
import { showToast } from '@/lib/toast'

interface UseStudentImportOptions {
  classId: string | undefined
  addStudents: (names: string[]) => Promise<string[]>
  refresh: (silent?: boolean) => Promise<void>
}

export function useStudentImport({
  classId,
  addStudents,
  refresh,
}: UseStudentImportOptions) {
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importSubmitting, setImportSubmitting] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement>(null)

  const parseImportNames = useCallback((text: string): string[] => {
    return [...new Set(text.split(/[\r\n]+/).map((line) => line.trim()).filter(Boolean))]
  }, [])

  const resetImport = useCallback(() => {
    setImportOpen(false)
    setImportText('')
  }, [])

  const handleImportStudents = useCallback(async () => {
    const names = parseImportNames(importText)
    if (names.length === 0 || importSubmitting || !classId) return

    setImportSubmitting(true)
    try {
      await addStudents(names)
      await refresh(true)
      resetImport()
      showToast(`已导入 ${names.length} 人`, { variant: 'success', duration: 2000 })
    } finally {
      setImportSubmitting(false)
    }
  }, [addStudents, classId, importSubmitting, importText, parseImportNames, refresh, resetImport])

  const handleImportFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const name = file.name.toLowerCase()
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls')

    if (isExcel) {
      try {
        const XLSX = await import('xlsx')
        const data = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as ArrayBuffer)
          reader.onerror = reject
          reader.readAsArrayBuffer(file)
        })

        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 })

        let nameColumnIndex = 0
        for (let rowIndex = 0; rowIndex < Math.min(rows.length, 10); rowIndex++) {
          const row = rows[rowIndex]
          if (!Array.isArray(row)) continue
          const columnIndex = row.findIndex((cell) => String(cell ?? '').trim() === '姓名')
          if (columnIndex >= 0) {
            nameColumnIndex = columnIndex
            break
          }
        }

        const names: string[] = []
        for (const row of rows) {
          if (!Array.isArray(row) || row.length <= nameColumnIndex) continue
          const cell = row[nameColumnIndex]
          const value = typeof cell === 'string' ? cell.trim() : String(cell ?? '').trim()
          if (!value || value === '姓名') continue
          if (nameColumnIndex === 0 && /^\d+$/.test(value)) continue
          names.push(value)
        }

        setImportText((prev) => (prev ? `${prev}\n${names.join('\n')}` : names.join('\n')))
      } catch (error) {
        console.warn('Excel 解析失败', error)
        showToast('Excel 解析失败，请检查文件格式', { variant: 'error', duration: 2500 })
      }
    } else {
      const reader = new FileReader()
      reader.onload = () => {
        const text = typeof reader.result === 'string' ? reader.result : ''
        setImportText((prev) => (prev ? `${prev}\n${text}` : text))
      }
      reader.readAsText(file, 'UTF-8')
    }

    e.target.value = ''
  }, [])

  return {
    importOpen,
    setImportOpen,
    importText,
    setImportText,
    importSubmitting,
    importFileInputRef,
    parseImportNames,
    handleImportStudents,
    handleImportFileChange,
    resetImport,
  }
}
