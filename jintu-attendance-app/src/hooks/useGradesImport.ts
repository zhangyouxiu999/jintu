import { useCallback, useRef, useState } from 'react'
import type { GradesForClass, StudentEntity } from '@/types'
import { showToast } from '@/lib/toast'

interface UseGradesImportOptions {
  classId: string | undefined
  currentPeriodId: string | null
  students: Pick<StudentEntity, 'id' | 'name'>[]
  persist: (updatedPeriod: GradesForClass, newPeriodName?: string) => void
}

export function useGradesImport({
  classId,
  currentPeriodId,
  students,
  persist,
}: UseGradesImportOptions) {
  const [importExcelSubmitting, setImportExcelSubmitting] = useState(false)
  const importExcelFileRef = useRef<HTMLInputElement>(null)

  const normalizeName = useCallback((value: string) => value.replace(/\s+/g, ' ').trim(), [])

  const handleImportExcel = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !classId || !currentPeriodId || importExcelSubmitting) {
      e.target.value = ''
      return
    }

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      showToast('请选择 .xlsx 或 .xls 文件', { variant: 'error', duration: 2000 })
      e.target.value = ''
      return
    }

    setImportExcelSubmitting(true)
    let data: ArrayBuffer
    try {
      data = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })
    } catch (error) {
      console.warn('Excel 文件读取失败', error)
      showToast('文件读取失败，请重试', { variant: 'error', duration: 2500 })
      setImportExcelSubmitting(false)
      e.target.value = ''
      return
    }

    e.target.value = ''

    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 }) as (string | number)[][]

      let nameColIndex = -1
      let headerRowIndex = -1
      for (let rowIndex = 0; rowIndex < Math.min(rows.length, 10); rowIndex++) {
        const row = rows[rowIndex]
        if (!Array.isArray(row)) continue
        const index = row.findIndex((cell) => String(cell ?? '').trim() === '姓名')
        if (index >= 0) {
          nameColIndex = index
          headerRowIndex = rowIndex
          break
        }
      }

      if (nameColIndex < 0 || headerRowIndex < 0) {
        showToast('未找到「姓名」列，请确保表头含「姓名」', { variant: 'error', duration: 2500 })
        return
      }

      const headerRow = rows[headerRowIndex]
      const subjectCols: { colIndex: number; subject: string }[] = []
      const skipHeaders = new Set(['姓名', '序号', '备注', '总分'])
      for (let columnIndex = 0; columnIndex < headerRow.length; columnIndex++) {
        if (columnIndex === nameColIndex) continue
        const subject = String(headerRow[columnIndex] ?? '').trim()
        if (subject && !skipHeaders.has(subject)) {
          subjectCols.push({ colIndex: columnIndex, subject })
        }
      }

      if (subjectCols.length === 0) {
        showToast('未找到可导入的科目列', { variant: 'error', duration: 2500 })
        return
      }

      const nameToStudent = new Map(students.map((student) => [normalizeName(student.name), student]))
      const scores: Record<string, Record<string, string>> = {}
      let matched = 0

      for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex]
        if (!Array.isArray(row) || row.length <= nameColIndex) continue
        const studentName = normalizeName(String(row[nameColIndex] ?? ''))
        if (!studentName) continue

        const student = nameToStudent.get(studentName)
        if (!student) continue

        matched += 1
        if (!scores[student.id]) scores[student.id] = {}

        for (const { colIndex, subject } of subjectCols) {
          const value = row[colIndex]
          const text = value == null ? '' : String(value).trim()
          if (text) scores[student.id][subject] = text
        }
      }

      const importedName =
        headerRowIndex > 0 && rows[0] && Array.isArray(rows[0])
          ? String(rows[0][0] ?? '').trim()
          : ''

      persist(
        {
          subjects: subjectCols.map((item) => item.subject),
          scores,
        },
        importedName || undefined
      )

      if (matched > 0) {
        showToast(`已导入 ${matched} 条成绩`, { variant: 'success', duration: 2000 })
      } else {
        showToast('未匹配到学生，请检查 Excel 中「姓名」与班级学生名单是否一致', {
          variant: 'error',
          duration: 3000,
        })
      }
    } catch (error) {
      console.warn('Excel 导入失败', error)
      showToast('Excel 解析失败，请检查文件格式', { variant: 'error', duration: 2500 })
    } finally {
      setImportExcelSubmitting(false)
    }
  }, [classId, currentPeriodId, importExcelSubmitting, normalizeName, persist, students])

  return {
    importExcelSubmitting,
    importExcelFileRef,
    handleImportExcel,
  }
}
