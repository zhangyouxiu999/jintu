import { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useLocation } from 'react-router-dom'
import { ChevronDown, FileDown, FileUp, Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react'
import { useClass } from '@/hooks/useClass'
import { useGradesImport } from '@/hooks/useGradesImport'
import type { GradesForClass, GradesPeriod } from '@/types'
import { storage } from '@/store/storage'
import { useAppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { buildGradesOnlyWorkbook } from '@/lib/exportClassExcel'
import { shareOrDownloadFile } from '@/lib/shareOrDownload'
import { showToast } from '@/lib/toast'

const defaultSubjects = ['语文', '数学', '英语']

function sumScores(scores: Record<string, string>): string {
  const nums = Object.values(scores)
    .map((v) => parseFloat(String(v).trim()))
    .filter((n) => !Number.isNaN(n))
  if (nums.length === 0) return ''
  return String(nums.reduce((a, b) => a + b, 0))
}

function newPeriodId() {
  return `period-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function Grades() {
  const { classId } = useParams<{ classId: string }>()
  const location = useLocation()
  const { classEntity, students, loading } = useClass(classId)
  const [periods, setPeriods] = useState<GradesPeriod[]>([])
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ studentId: string; subject: string } | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [addSubjectOpen, setAddSubjectOpen] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [addPeriodOpen, setAddPeriodOpen] = useState(false)
  const [newPeriodName, setNewPeriodName] = useState('')
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'total'>('order')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [subjectMenuSubject, setSubjectMenuSubject] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [renameSubject, setRenameSubject] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteSubjectConfirm, setDeleteSubjectConfirm] = useState<string | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current')
  const [exportPeriodId, setExportPeriodId] = useState<string | null>(null)
  const [exportSubmitting, setExportSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const subjectAnchorRef = useRef<HTMLTableCellElement | null>(null)
  const subjectMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setEditing(null)
  }, [currentPeriodId])

  useEffect(() => {
    if (!classId) return
    const all = storage.loadGrades()
    const list = all?.[classId]
    const statePeriodId = (location.state as { periodId?: string } | null)?.periodId
    if (list?.length) {
      setPeriods(list)
      const validStateId = statePeriodId && list.some((p) => p.id === statePeriodId)
      const savedId = storage.loadCurrentPeriodId(classId)
      const validSavedId = savedId && list.some((p) => p.id === savedId)
      setCurrentPeriodId((id) => {
        if (validStateId) return statePeriodId!
        if (validSavedId) return savedId!
        return (id && list.some((p) => p.id === id)) ? id : list[0].id
      })
    } else {
      const first: GradesPeriod = { id: newPeriodId(), name: '第一期', subjects: [...defaultSubjects], scores: {} }
      setPeriods([first])
      setCurrentPeriodId(first.id)
      const nextAll = { ...(all ?? {}), [classId]: [first] }
      storage.saveGrades(nextAll)
    }
  }, [classId, location.state])

  useEffect(() => {
    if (classId && currentPeriodId) storage.saveCurrentPeriodId(classId, currentPeriodId)
  }, [classId, currentPeriodId])

  const currentPeriod = periods.find((p) => p.id === currentPeriodId)
  const grades: GradesForClass = useMemo(
    () =>
      currentPeriod
        ? { subjects: currentPeriod.subjects, scores: currentPeriod.scores }
        : { subjects: [...defaultSubjects], scores: {} },
    [currentPeriod]
  )

  const periodsRef = useRef<GradesPeriod[]>([])
  useEffect(() => {
    periodsRef.current = periods
  }, [periods])

  const persist = useCallback(
    (updatedPeriod: GradesForClass, newPeriodName?: string) => {
      if (!classId || !currentPeriodId) return
      const prev = periodsRef.current
      const next = prev.map((p) =>
        p.id === currentPeriodId
          ? {
              ...p,
              ...(newPeriodName !== undefined && { name: newPeriodName }),
              subjects: updatedPeriod.subjects,
              scores: updatedPeriod.scores,
            }
          : p
      )
      setPeriods(next)
      const all = storage.loadGrades() ?? {}
      storage.saveGrades({ ...all, [classId]: next })
    },
    [classId, currentPeriodId]
  )

  const { importExcelSubmitting, importExcelFileRef, handleImportExcel } = useGradesImport({
    classId,
    currentPeriodId,
    students,
    persist,
  })

  const { setPageActions } = useAppLayout()

  useEffect(() => {
    if (!classId || loading) return
    setPageActions({
      importAction: {
        id: 'grades-import',
        label: '导入成绩单',
        icon: FileUp,
        disabled: importExcelSubmitting,
        onSelect: () => importExcelFileRef.current?.click(),
      },
      exportAction: {
        id: 'grades-export',
        label: '导出成绩单',
        icon: FileDown,
        disabled: exportSubmitting,
        onSelect: () => { setExportScope('current'); setExportPeriodId(currentPeriodId); setExportDialogOpen(true) },
      },
      extraActions: [
        { id: 'grades-add-subject', label: '添加科目', icon: Plus, onSelect: () => setAddSubjectOpen(true) },
        { id: 'grades-add-period', label: '添加成绩单', icon: Plus, onSelect: () => { setNewPeriodName(`第${periods.length + 1}期`); setAddPeriodOpen(true) } },
        {
          id: 'grades-switch-period',
          label: '切换期',
          icon: ChevronDown,
          children: periods.map((p) => ({
            id: p.id,
            label: p.name,
            onSelect: () => setCurrentPeriodId(p.id),
            disabled: currentPeriodId === p.id,
          })),
        },
      ],
    })
    return () => setPageActions({})
  }, [classId, loading, importExcelSubmitting, exportSubmitting, periods, currentPeriodId, setPageActions])

  const getScore = useCallback(
    (studentId: string, subject: string) => grades.scores[studentId]?.[subject] ?? '',
    [grades.scores]
  )

  const sortedStudents = useMemo(() => {
    const list = [...students]
    if (sortBy === 'order') return list
    if (sortBy === 'name') {
      list.sort((a, b) => (sortDir === 'asc' ? 1 : -1) * (a.name.localeCompare(b.name, 'zh-CN') || 0))
      return list
    }
    list.sort((a, b) => {
      const ta = sumScores(grades.subjects.reduce((acc, sub) => ({ ...acc, [sub]: getScore(a.id, sub) }), {}))
      const tb = sumScores(grades.subjects.reduce((acc, sub) => ({ ...acc, [sub]: getScore(b.id, sub) }), {}))
      const na = parseFloat(ta) || 0
      const nb = parseFloat(tb) || 0
      if (na !== nb) return sortDir === 'asc' ? na - nb : nb - na
      return a.name.localeCompare(b.name, 'zh-CN')
    })
    return list
  }, [students, sortBy, sortDir, grades.subjects, getScore])

  const handleExportGrades = useCallback(async () => {
    if (!classEntity || periods.length === 0) {
      showToast('暂无成绩单可导出', { variant: 'error' })
      return
    }
    const periodIdToExport = exportPeriodId ?? currentPeriodId ?? periods[0]?.id
    const singlePeriod = periodIdToExport ? periods.find((p) => p.id === periodIdToExport) : periods[0]
    const periodsToExport = exportScope === 'current' && singlePeriod
      ? [singlePeriod]
      : periods
    if (periodsToExport.length === 0) {
      showToast('请先选择要导出的期', { variant: 'error' })
      return
    }
    setExportSubmitting(true)
    try {
      const sortedList = sortedStudents.map((s) => ({ id: s.id, name: s.name }))
      const buf = await buildGradesOnlyWorkbook(classEntity.name, periodsToExport, sortedList)
      const fileName =
        exportScope === 'current' && singlePeriod
          ? `${classEntity.name}-${singlePeriod.name}.xlsx`
          : `${classEntity.name}-成绩单.xlsx`
      await shareOrDownloadFile(buf, fileName, { dialogTitle: '导出成绩单' })
      showToast('已导出', { variant: 'success', duration: 1800 })
      setExportDialogOpen(false)
    } catch {
      showToast('导出失败，请重试', { variant: 'error' })
    } finally {
      setExportSubmitting(false)
    }
  }, [classEntity, periods, currentPeriodId, exportPeriodId, exportScope, sortedStudents])

  const setScore = (studentId: string, subject: string, value: string) => {
    const next = { ...grades }
    if (!next.scores[studentId]) next.scores[studentId] = {}
    const trimmed = value.trim()
    if (trimmed) next.scores[studentId][subject] = trimmed
    else delete next.scores[studentId][subject]
    if (Object.keys(next.scores[studentId]).length === 0) delete next.scores[studentId]
    persist(next)
  }

  const handleAddSubject = () => {
    const name = newSubjectName.trim()
    if (!name || grades.subjects.includes(name)) return
    const next = { ...grades, subjects: [...grades.subjects, name] }
    persist(next)
    setNewSubjectName('')
    setAddSubjectOpen(false)
  }

  const closeSubjectMenu = () => setSubjectMenuSubject(null)

  const doRemoveSubject = (subject: string) => {
    if (editing?.subject === subject) setEditing(null)
    const next = {
      subjects: grades.subjects.filter((s) => s !== subject),
      scores: { ...grades.scores },
    }
    Object.keys(next.scores).forEach((id) => {
      delete next.scores[id][subject]
      if (Object.keys(next.scores[id]).length === 0) delete next.scores[id]
    })
    persist(next)
  }

  const handleConfirmRemoveSubject = () => {
    if (deleteSubjectConfirm) {
      doRemoveSubject(deleteSubjectConfirm)
      setDeleteSubjectConfirm(null)
    }
  }

  const handleAddPeriod = () => {
    const name = newPeriodName.trim() || `第${periods.length + 1}期`
    const newPeriod: GradesPeriod = { id: newPeriodId(), name, subjects: [...defaultSubjects], scores: {} }
    const next = [...periods, newPeriod]
    setPeriods(next)
    setCurrentPeriodId(newPeriod.id)
    if (classId) {
      const all = storage.loadGrades() ?? {}
      storage.saveGrades({ ...all, [classId]: next })
    }
    setNewPeriodName('')
    setAddPeriodOpen(false)
  }

  const renameSubjectAction = (oldName: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName) return
    if (grades.subjects.includes(trimmed)) return
    if (editing?.subject === oldName) setEditing(null)
    const next = {
      subjects: grades.subjects.map((s) => (s === oldName ? trimmed : s)),
      scores: { ...grades.scores },
    }
    Object.keys(next.scores).forEach((id) => {
      if (next.scores[id][oldName] !== undefined) {
        next.scores[id][trimmed] = next.scores[id][oldName]
        delete next.scores[id][oldName]
      }
    })
    persist(next)
    setRenameSubject(null)
    setRenameValue('')
  }

  const LONG_PRESS_MS = 500

  const handleSubjectPointerDown = (subject: string, e: React.TouchEvent | React.MouseEvent) => {
    subjectAnchorRef.current = e.currentTarget as HTMLTableCellElement
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      setSubjectMenuSubject(subject)
    }, LONG_PRESS_MS)
  }

  const handleSubjectPointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleSubjectContextMenu = (e: React.MouseEvent, subject: string) => {
    e.preventDefault()
    subjectAnchorRef.current = e.currentTarget as HTMLTableCellElement
    setSubjectMenuSubject(subject)
  }

  useLayoutEffect(() => {
    if (!subjectMenuSubject || !subjectAnchorRef.current) {
      setMenuPosition(null)
      return
    }
    const rect = subjectAnchorRef.current.getBoundingClientRect()
    setMenuPosition({ top: rect.bottom + 4, left: rect.left })
  }, [subjectMenuSubject])

  useEffect(() => {
    if (!subjectMenuSubject) return
    const handleOutside = (e: MouseEvent) => {
      if (subjectMenuRef.current?.contains(e.target as Node)) return
      setSubjectMenuSubject(null)
    }
    // 延迟注册，避免触摸端长按松手后的合成 click 立刻关闭菜单（通常 200–350ms 内触发）
    const delayMs = 400
    const t = setTimeout(() => document.addEventListener('click', handleOutside, false), delayMs)
    return () => {
      clearTimeout(t)
      document.removeEventListener('click', handleOutside, false)
    }
  }, [subjectMenuSubject])

  const startEdit = (studentId: string, subject: string) => {
    setEditingValue(getScore(studentId, subject))
    setEditing({ studentId, subject })
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const saveEdit = () => {
    if (!editing) return
    setScore(editing.studentId, editing.subject, editingValue)
    setEditing(null)
  }

  if (loading || !classEntity) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <main className="flex min-h-[200px] items-center justify-center px-[var(--page-x)] py-4">
          <p className="text-[15px] text-[var(--on-surface-muted)]">{loading ? '' : '班级不存在'}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Dialog open={exportDialogOpen} onOpenChange={(open) => { setExportDialogOpen(open); if (!open) { setExportScope('current'); setExportPeriodId(null) } }}>
        <DialogContent className="gap-0 max-w-[min(90vw,340px)]">
          <DialogHeader className="text-center pb-2">
            <DialogTitle className="text-[17px] font-bold leading-tight text-[var(--on-surface)]">
              导出成绩单
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="export-one"
                name="exportScope"
                checked={exportScope === 'current'}
                onChange={() => setExportScope('current')}
                className="h-3.5 w-3.5 shrink-0 accent-[var(--primary)]"
              />
              <label htmlFor="export-one" className="text-[13px] font-normal text-[var(--on-surface)] cursor-pointer shrink-0">
                导出
              </label>
              {exportScope === 'current' && periods.length > 0 && (() => {
                const selectedId = exportPeriodId ?? currentPeriodId ?? periods[0]?.id ?? ''
                const selectedPeriod = periods.find((p) => p.id === selectedId)
                const triggerLabel = selectedPeriod
                  ? `${selectedPeriod.name}${selectedPeriod.id === currentPeriodId ? '（当前期）' : ''}`
                  : '选择期'
                return (
                  <Select
                    value={selectedId || undefined}
                    onValueChange={(v) => setExportPeriodId(v || null)}
                  >
                    <SelectTrigger className="min-w-0 flex-1 h-7 px-2.5 text-[13px] font-normal [&_svg]:h-3 [&_svg]:w-3" aria-label="选择期">
                      <SelectValue placeholder="选择期">{triggerLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((p) => (
                        <SelectItem key={p.id} value={p.id} textValue={p.name}>
                          {p.name}{p.id === currentPeriodId ? '（当前期）' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              })()}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="export-all"
                name="exportScope"
                checked={exportScope === 'all'}
                onChange={() => setExportScope('all')}
                className="h-3.5 w-3.5 accent-[var(--primary)]"
              />
              <label htmlFor="export-all" className="text-[13px] font-normal text-[var(--on-surface)] cursor-pointer">
                导出全部（共{periods.length}期）
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(false)} className="!h-8 !min-h-0 rounded-[var(--radius-sm)] px-2.5 !text-[11px] font-normal">
              取消
            </Button>
            <Button size="sm" onClick={handleExportGrades} disabled={exportSubmitting} className="!h-8 !min-h-0 rounded-[var(--radius-sm)] px-2.5 !text-[11px] font-normal">
              {exportSubmitting ? '导出中…' : '确定导出'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSubjectConfirm} onOpenChange={(open) => !open && setDeleteSubjectConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle className="text-dialog-title text-[var(--on-surface)] block text-center">确定删除该科目？</AlertDialogTitle>
            <AlertDialogDescription className="text-caption text-[var(--on-surface-muted)]">
              {deleteSubjectConfirm ? `删除科目「${deleteSubjectConfirm}」后，该列成绩将一并清除，且无法恢复。` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmRemoveSubject}>确定删除</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <main className="pb-[calc(var(--space-24)+var(--safe-bottom))]">
        <input
          ref={importExcelFileRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={handleImportExcel}
        />
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--outline)] bg-[var(--surface)] shadow-elevation-card [-webkit-overflow-scrolling:touch]">
          <table
            className="w-full min-w-[var(--grades-table-min-width)] border-collapse text-[13px]"
            style={{ '--grades-table-min-width': `${40 + 80 + grades.subjects.length * 72 + 72}px` } as CSSProperties}
          >
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-10 min-w-[2.5rem] border-b border-r border-[var(--outline-variant)] bg-[var(--surface-2)] py-2 text-center text-[13px] font-medium text-[var(--on-surface-muted)]">
                  序号
                </th>
                <th className="sticky left-10 z-10 w-20 min-w-[5rem] border-b border-r border-[var(--outline-variant)] bg-[var(--surface-2)] py-2 text-center text-[13px] font-medium text-[var(--on-surface)]">
                  <div className="flex items-center justify-center gap-1">
                    姓名
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded p-0.5 text-[var(--on-surface-muted)] h-8 w-8"
                          aria-label="排序"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="min-w-[8rem]">
                        <DropdownMenuItem onSelect={() => { setSortBy('order'); setSortDir('asc') }}>
                          默认顺序
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => { setSortBy('name'); setSortDir('asc') }}>
                          按姓名升序
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => { setSortBy('name'); setSortDir('desc') }}>
                          按姓名降序
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => { setSortBy('total'); setSortDir('desc') }}>
                          按总分从高到低
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => { setSortBy('total'); setSortDir('asc') }}>
                          按总分从低到高
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>
                {grades.subjects.map((sub) => (
                  <th
                    key={sub}
                  className={cn(
                    'w-[72px] min-w-[72px] select-none touch-manipulation border-b border-[var(--outline-variant)] bg-[var(--surface-2)] py-2 text-center text-[13px] font-medium text-[var(--on-surface)]',
                    subjectMenuSubject === sub && 'bg-[var(--surface-hover)]'
                  )}
                    onTouchStart={(e) => handleSubjectPointerDown(sub, e)}
                    onTouchEnd={handleSubjectPointerUp}
                    onTouchCancel={handleSubjectPointerUp}
                    onContextMenu={(e) => handleSubjectContextMenu(e, sub)}
                    onMouseDown={(e) => handleSubjectPointerDown(sub, e)}
                    onMouseUp={handleSubjectPointerUp}
                    onMouseLeave={handleSubjectPointerUp}
                  >
                    <span className="block truncate">{sub}</span>
                  </th>
                ))}
                <th className="w-[72px] min-w-[72px] border-b border-[var(--outline-variant)] bg-[var(--surface-2)] py-2 text-center text-[13px] font-medium text-[var(--on-surface-muted)]">
                  总分
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((s, index) => (
                <tr key={s.id} className="border-b border-[var(--outline-variant)]">
                  <td className="sticky left-0 z-10 w-10 min-w-[2.5rem] border-r border-[var(--outline-variant)] bg-[var(--surface)] py-1.5 text-center text-[13px] text-[var(--on-surface-muted)]">
                    {index + 1}
                  </td>
                  <td className="sticky left-10 z-10 w-20 min-w-[5rem] border-r border-[var(--outline-variant)] bg-[var(--surface)] py-1.5 text-center text-[13px] font-medium text-[var(--on-surface)]">
                    {s.name}
                  </td>
                  {grades.subjects.map((sub) => {
                    const isEditingCell = editing?.studentId === s.id && editing?.subject === sub
                    return (
                      <td key={sub} className="border-b border-[var(--outline-variant)] p-1 text-center align-middle">
                        {isEditingCell ? (
                          <Input
                            ref={inputRef}
                            type="text"
                            inputMode="decimal"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit()
                              if (e.key === 'Escape') setEditing(null)
                            }}
                            className="mx-auto h-8 w-14 rounded border-0 bg-[var(--surface-2)] px-1 text-center text-[13px] outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                          />
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => startEdit(s.id, sub)}
                            className="min-h-[32px] h-auto w-full rounded px-1 text-[13px] text-[var(--on-surface)]"
                          >
                            {getScore(s.id, sub) || '—'}
                          </Button>
                        )}
                      </td>
                    )
                  })}
                  <td className="border-b border-[var(--outline-variant)] py-1.5 text-center text-[13px] font-medium text-[var(--on-surface)]">
                    {sumScores(
                      grades.subjects.reduce(
                        (acc, sub) => ({ ...acc, [sub]: getScore(s.id, sub) }),
                        {}
                      )
                    ) || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Dialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen}>
        <DialogContent>
          <DialogHeader className="text-center sm:text-center pb-2">
            <DialogTitle className="text-dialog-title text-[var(--on-surface)] block text-center">添加科目</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 py-1">
            <Input
              placeholder="科目名"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
              className="flex-1 h-8 min-h-0 text-[14px] rounded-[var(--radius-sm)] border-[var(--outline)]"
            />
            <Button size="sm" onClick={handleAddSubject} disabled={!newSubjectName.trim()} className="h-8 min-h-0 rounded-[var(--radius-sm)] px-2.5 text-[11px] bg-[var(--primary)] text-white">
              添加
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addPeriodOpen} onOpenChange={setAddPeriodOpen}>
        <DialogContent>
          <DialogHeader className="text-center sm:text-center pb-2">
            <DialogTitle className="text-dialog-title text-[var(--on-surface)] block text-center">添加成绩单</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 py-1">
            <Input
              placeholder="如：期中、期末"
              value={newPeriodName}
              onChange={(e) => setNewPeriodName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPeriod()}
              className="flex-1 h-8 min-h-0 text-[14px] rounded-[var(--radius-sm)] border-[var(--outline)]"
            />
            <Button size="sm" onClick={handleAddPeriod} className="h-8 min-h-0 rounded-[var(--radius-sm)] px-2.5 text-[11px] bg-[var(--primary)] text-white">
              添加
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 长按科目：下拉式删除或修改 */}
      {subjectMenuSubject &&
        menuPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={subjectMenuRef}
            className="fixed z-50 min-w-[8rem] overflow-hidden rounded-[var(--radius-md)] border border-[var(--outline)] bg-[var(--surface)] py-1 shadow-elevation-2"
            style={{ top: menuPosition.top, left: menuPosition.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              className="flex w-full cursor-pointer items-center gap-2 rounded-none px-3 py-2 text-left text-[13px] font-medium text-[var(--on-surface)] h-auto"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const sub = subjectMenuSubject
                if (sub) {
                  setRenameSubject(sub)
                  setRenameValue(sub)
                  closeSubjectMenu()
                  setTimeout(() => document.getElementById('grades-rename-input')?.focus(), 50)
                }
              }}
            >
              <Pencil className="h-4 w-4 shrink-0" />
              修改科目名
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={grades.subjects.length <= 1}
              className="flex w-full cursor-pointer items-center gap-2 rounded-none px-3 py-2 text-left text-[13px] font-medium text-[var(--error)] h-auto disabled:opacity-50 disabled:pointer-events-none"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (subjectMenuSubject) {
                  setDeleteSubjectConfirm(subjectMenuSubject)
                  closeSubjectMenu()
                }
              }}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              删除科目
            </Button>
          </div>,
          document.body
        )}

      {/* 修改科目名 */}
      <Dialog
        open={!!renameSubject}
        onOpenChange={(open) => {
          if (!open) setRenameSubject(null)
          setRenameValue('')
        }}
      >
        <DialogContent>
          <DialogHeader className="text-center sm:text-center pb-2">
            <DialogTitle className="text-dialog-title text-[var(--on-surface)] block text-center">修改科目名</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">输入新名称，不可与已有科目重复</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 py-1">
            <Input
              id="grades-rename-input"
              placeholder="新科目名"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameSubject) renameSubjectAction(renameSubject, renameValue)
                if (e.key === 'Escape') setRenameSubject(null)
              }}
              className="flex-1 h-8 min-h-0 text-[14px] rounded-[var(--radius-sm)] border-[var(--outline)]"
            />
            <Button
              size="sm"
              onClick={() => renameSubject && renameSubjectAction(renameSubject, renameValue)}
              disabled={!renameValue.trim() || renameValue.trim() === renameSubject || grades.subjects.includes(renameValue.trim())}
              className="h-8 min-h-0 rounded-[var(--radius-sm)] px-2.5 text-[11px] bg-[var(--primary)] text-white"
            >
              确定
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
