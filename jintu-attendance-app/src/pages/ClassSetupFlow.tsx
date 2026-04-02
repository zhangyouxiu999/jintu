import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Import, School, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { storage } from '@/store/storage'
import { useClassList } from '@/hooks/useClassList'
import * as classesStore from '@/store/classes'
import * as studentsStore from '@/store/students'
import { showToast } from '@/lib/toast'
import { cn } from '@/lib/utils'

function parseNames(text: string): string[] {
  return [...new Set(text.split(/[\r\n]+/).map((line) => line.trim()).filter(Boolean))]
}

async function extractNamesFromFile(file: File): Promise<string[]> {
  const name = file.name.toLowerCase()
  const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls')

  if (isExcel) {
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
    return parseNames(names.join('\n'))
  }

  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = reject
    reader.readAsText(file, 'UTF-8')
  })
  return parseNames(text)
}

async function addStudentsToClass(classId: string, names: string[]) {
  const normalizedNames = parseNames(names.join('\n'))
  if (normalizedNames.length === 0) return

  const cls = await classesStore.getById(classId)
  const nextStudentOrder = [...(cls?.studentOrder ?? [])]

  for (const studentName of normalizedNames) {
    const id = await studentsStore.addStudent(studentName, classId)
    nextStudentOrder.push(id)
  }

  if (cls) {
    await classesStore.update({
      ...cls,
      studentOrder: nextStudentOrder,
    })
  }
}

export default function ClassSetupFlow() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { list, loading } = useClassList()
  const [className, setClassName] = useState('')
  const [studentText, setStudentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

  const currentClassId = storage.loadCurrentClassId()
  const effectiveClassId = list.find((item) => item.id === currentClassId)?.id ?? list[0]?.id ?? null
  const parsedStudents = useMemo(() => parseNames(studentText), [studentText])

  if (!loading && effectiveClassId) {
    return <ButtonRedirect classId={effectiveClassId} />
  }

  const handleContinue = () => {
    if (!className.trim()) {
      showToast('先给这个班级起个名字吧', { duration: 1800 })
      return
    }
    setStep(2)
  }

  const finalizeSetup = async (includeStudents: boolean) => {
    const trimmedName = className.trim()
    if (!trimmedName || submitting) return

    setSubmitting(true)
    try {
      const classId = await classesStore.create(trimmedName)
      storage.saveCurrentClassId(classId)
      if (includeStudents) {
        await addStudentsToClass(classId, parsedStudents)
      }
      showToast(includeStudents ? `开班完成，已导入 ${parsedStudents.length} 人` : '开班完成，已进入点名页', {
        variant: 'success',
        duration: 2200,
      })
      navigate(`/attendance/${classId}`, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setImporting(true)
    try {
      const importedNames = await extractNamesFromFile(file)
      if (importedNames.length === 0) {
        showToast('没有识别到学生姓名，请检查文件内容', { variant: 'error', duration: 2200 })
        return
      }
      setStudentText((prev) => parseNames(`${prev}\n${importedNames.join('\n')}`).join('\n'))
      showToast(`已读取 ${importedNames.length} 位学生`, { variant: 'success', duration: 1800 })
    } catch (error) {
      console.warn('导入学生失败', error)
      showToast('导入失败，请检查文件格式后重试', { variant: 'error', duration: 2200 })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] px-[var(--page-x)] pt-[calc(var(--safe-top)+24px)] pb-[calc(var(--safe-bottom)+24px)]">
      <div className="mx-auto flex w-full max-w-[var(--app-max-width)] flex-col gap-3">
        <section className="rounded-[24px] border border-[var(--outline)]/75 bg-[var(--surface)] p-5 shadow-[0_10px_24px_rgba(94,79,52,0.04)]">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--primary-container)] text-[var(--primary)]">
              <School className="h-6 w-6" strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[var(--on-surface-muted)]">首次开班流程</p>
              <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-[var(--on-surface)]">创建第一个班级</h1>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 text-[12px] font-semibold sm:grid-cols-2">
            <div className={cn('rounded-[14px] border px-3 py-2.5', step === 1 ? 'border-[var(--primary)] bg-[var(--primary-container)]/70 text-[var(--primary)]' : 'border-[var(--outline)] bg-[var(--surface-2)] text-[var(--on-surface-muted)]')}>
              1. 班级名称
            </div>
            <div className={cn('rounded-[14px] border px-3 py-2.5', step === 2 ? 'border-[var(--primary)] bg-[var(--primary-container)]/70 text-[var(--primary)]' : 'border-[var(--outline)] bg-[var(--surface-2)] text-[var(--on-surface-muted)]')}>
              2. 学生名单
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] bg-[var(--surface-2)] px-3 py-3">
              <p className="text-[12px] font-medium text-[var(--on-surface-muted)]">当前步骤</p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--on-surface)]">{step === 1 ? '填写班级名称' : '补充学生名单'}</p>
            </div>
            <div className="rounded-[16px] bg-[var(--surface-2)] px-3 py-3">
              <p className="text-[12px] font-medium text-[var(--on-surface-muted)]">完成后进入</p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--on-surface)]">点名首页</p>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-[var(--outline)]/75 bg-[var(--surface)] p-5 shadow-[0_10px_24px_rgba(94,79,52,0.04)]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--surface-2)] text-[var(--primary)]">
              <School className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[var(--on-surface-muted)]">第一步</p>
              <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-[var(--on-surface)]">班级名称</h2>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="block text-[12px] font-medium text-[var(--on-surface-muted)]">
              班级名称
            </label>
            <Input
              placeholder="例如：一年级(1)班"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && step === 1) handleContinue()
              }}
              className="h-12 rounded-[16px] border-[var(--outline)]/75 bg-[var(--surface-2)] px-4 text-[16px] font-semibold"
            />
          </div>

          {step === 1 ? (
            <Button className="mt-5 h-[var(--button-lg-height)] w-full rounded-[16px] bg-[var(--primary)] text-[15px] font-semibold text-white" onClick={handleContinue}>
              下一步，准备学生名单
            </Button>
          ) : null}
        </section>

        <section className={cn(
          'rounded-[24px] border border-[var(--outline)]/75 bg-[var(--surface)] p-5 shadow-[0_10px_24px_rgba(94,79,52,0.04)]',
          step !== 2 && 'opacity-60'
        )}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--primary-container)] text-[var(--primary)]">
              <Users className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[var(--on-surface-muted)]">第二步</p>
              <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-[var(--on-surface)]">学生名单</h2>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={step !== 2 || importing}
              className="h-10 rounded-[14px] px-4"
            >
              <Import className="mr-1.5 h-4 w-4" strokeWidth={1.7} />
              {importing ? '读取中…' : '导入名单'}
            </Button>
            <span className="inline-flex items-center rounded-full bg-[var(--surface-2)] px-3 py-1 text-[12px] font-semibold text-[var(--on-surface-muted)]">
              {parsedStudents.length} 人
            </span>
            {step === 2 ? (
              <span className="inline-flex items-center rounded-full bg-[var(--primary-container)] px-3 py-1 text-[12px] font-semibold text-[var(--primary)]">
                可以直接完成开班
              </span>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.xls,.xlsx"
            className="hidden"
            onChange={handleImportFileChange}
          />

          <div className="mt-4 space-y-2">
            <label className="block text-[12px] font-medium text-[var(--on-surface-muted)]">
              学生名单
            </label>
            <Textarea
              value={studentText}
              onChange={(e) => setStudentText(e.target.value)}
              placeholder={'张三\n李四\n王五'}
              disabled={step !== 2}
              className="min-h-[176px] resize-none rounded-[16px] border-[var(--outline)]/75 bg-[var(--surface-2)] px-4 py-3 text-[15px] leading-7 disabled:cursor-not-allowed"
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] bg-[var(--surface-2)] px-3 py-3">
              <p className="text-[12px] font-medium text-[var(--on-surface-muted)]">班级</p>
              <p className="mt-1 truncate text-[15px] font-semibold text-[var(--on-surface)]">{className.trim() || '未命名'}</p>
            </div>
            <div className="rounded-[16px] bg-[var(--surface-2)] px-3 py-3">
              <p className="text-[12px] font-medium text-[var(--on-surface-muted)]">学生</p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--on-surface)]">{parsedStudents.length} 人</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <Button
              className="h-[var(--button-lg-height)] w-full rounded-[16px] bg-[var(--primary)] text-[15px] font-semibold text-white"
              disabled={step !== 2 || submitting}
              onClick={() => finalizeSetup(parsedStudents.length > 0)}
            >
              {submitting ? '正在开班…' : parsedStudents.length > 0 ? '完成开班，进入点名' : '先开班，稍后补名单'}
            </Button>
            <Button
              variant="outline"
              className="h-10 w-full rounded-[16px] border-[var(--outline)] bg-[var(--surface)] text-[14px] font-semibold"
              disabled={step !== 2 || submitting}
              onClick={() => setStep(1)}
            >
              返回修改班级名称
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

function ButtonRedirect({ classId }: { classId: string }) {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(`/attendance/${classId}`, { replace: true })
  }, [classId, navigate])

  return null
}
