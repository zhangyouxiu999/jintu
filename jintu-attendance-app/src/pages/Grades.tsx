import { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronDown, FileDown, FileSpreadsheet, FileUp, Plus, Pencil, Trash2, ArrowUpDown, MoreHorizontal, Calendar, History as HistoryIcon, ListChecks } from 'lucide-react'
import { useClass } from '@/hooks/useClass'
import { useClassList } from '@/hooks/useClassList'
import { useGradesImport } from '@/hooks/useGradesImport'
import type { GradesForClass, GradesPeriod } from '@/types'
import { storage } from '@/store/storage'
import { useAppLayout } from '@/components/AppLayout'
import PageHeader, { pageHeaderShellClassName } from '@/components/PageHeader'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { showToast } from '@/lib/toast'
import { cn } from '@/lib/utils'

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
  const navigate = useNavigate()
  const { classEntity, students, loading } = useClass(classId)
  const { list: classList } = useClassList()
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
  const [editingPeriodTitle, setEditingPeriodTitle] = useState(false)
  const [periodTitleValue, setPeriodTitleValue] = useState('')
  const periodTitleInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const subjectAnchorRef = useRef<HTMLTableCellElement | null>(null)
  const subjectMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setEditing(null)
    setEditingPeriodTitle(false)
  }, [currentPeriodId])

  useEffect(() => {
    if (!classId) return
    const all = storage.loadGrades()
    const list = all?.[classId]
    if (list?.length) {
      setPeriods(list)
      setCurrentPeriodId((id) => (id && list.some((p) => p.id === id)) ? id : list[0].id)
    } else {
      const first: GradesPeriod = { id: newPeriodId(), name: '第一期', subjects: [...defaultSubjects], scores: {} }
      setPeriods([first])
      setCurrentPeriodId(first.id)
      const nextAll = { ...(all ?? {}), [classId]: [first] }
      storage.saveGrades(nextAll)
    }
  }, [classId])

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
        label: '导入成绩 Excel',
        icon: FileUp,
        disabled: importExcelSubmitting,
        onSelect: () => importExcelFileRef.current?.click(),
      },
      exportAction: {
        id: 'grades-export',
        label: '导出成绩单',
        icon: FileDown,
        disabled: true,
      },
      extraActions: [
        { id: 'grades-add-subject', label: '添加科目', icon: Plus, onSelect: () => setAddSubjectOpen(true) },
        { id: 'grades-add-period', label: '添加成绩单', icon: Plus, onSelect: () => { setNewPeriodName(`第${periods.length + 1}期`); setAddPeriodOpen(true) } },
      ],
    })
    return () => setPageActions({})
  }, [classId, loading, importExcelSubmitting, periods.length, setPageActions])

  useEffect(() => {
    if (editingPeriodTitle) periodTitleInputRef.current?.focus()
  }, [editingPeriodTitle])

  const savePeriodTitle = useCallback(() => {
    if (!currentPeriod) return
    const name = periodTitleValue.trim() || currentPeriod.name
    persist(grades, name)
    setEditingPeriodTitle(false)
  }, [currentPeriod, periodTitleValue, grades, persist])

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
    const t = setTimeout(() => document.addEventListener('click', handleOutside, false), 0)
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
        <PageHeader title="成绩单" />
        <main className="flex min-h-[200px] items-center justify-center px-[var(--page-x)] py-4">
          <p className="text-label text-[var(--on-surface-muted)]">{loading ? '' : '班级不存在'}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
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

      {/* 顶栏 · 标题与切换期合并为芯片样式（与点名页一致） */}
      <header className={`${pageHeaderShellClassName} flex flex-col`}>
        <div className="flex min-h-14 items-center justify-between gap-2 border-b border-[var(--outline-variant)] px-[var(--page-x)] py-2">
          <div className="w-10 shrink-0" aria-hidden />
          <div className="flex min-w-0 flex-1 justify-start overflow-hidden">
            <div className="flex max-w-full items-center gap-0 rounded-[var(--radius-sm)] border border-[var(--outline-variant)] bg-[var(--surface-2)]">
              {editingPeriodTitle ? (
                <div className="flex min-w-0 flex-1 items-center py-1 pl-2 pr-2">
                  <Input
                    ref={periodTitleInputRef}
                    value={periodTitleValue}
                    onChange={(e) => setPeriodTitleValue(e.target.value)}
                    onBlur={savePeriodTitle}
                    onKeyDown={(e) => { if (e.key === 'Enter') savePeriodTitle() }}
                    className="min-w-0 flex-1 border-0 bg-transparent py-1 text-body font-bold text-[var(--on-surface)] shadow-none focus-visible:ring-0"
                    aria-label="成绩单标题"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="min-w-0 max-w-[45vw] flex-1 truncate py-2 pl-3 pr-2 text-left text-body font-bold text-[var(--on-surface)] active:bg-[var(--surface-hover)]"
                  onClick={() => {
                    setPeriodTitleValue(currentPeriod?.name ?? '')
                    setEditingPeriodTitle(true)
                  }}
                  aria-label="点击修改成绩单标题"
                >
                  {currentPeriod?.name ?? '成绩单'}
                </button>
              )}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex shrink-0 items-center gap-1 border-l border-[var(--outline-variant)] py-2 pl-2 pr-3 text-caption text-[var(--on-surface-variant)] active:bg-[var(--surface-hover)]"
                  >
                    <ChevronDown className="h-4 w-4" />
                    切换期
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[60vh] min-w-[10rem] overflow-auto">
                  {periods.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onSelect={() => setCurrentPeriodId(p.id)}
                      className={currentPeriodId === p.id ? 'bg-[var(--surface-2)]' : ''}
                      disabled={currentPeriodId === p.id}
                    >
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      setNewPeriodName(`第${periods.length + 1}期`)
                      setAddPeriodOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    添加成绩单
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="h-10 w-10 shrink-0 rounded-full text-[var(--on-surface-variant)] active:scale-95"
                aria-label="更多"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  importExcelFileRef.current?.click()
                }}
                disabled={importExcelSubmitting}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {importExcelSubmitting ? '导入中…' : '导入 Excel'}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setAddSubjectOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" />
                添加科目
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); if (classId) navigate(`/schedule/${classId}`) }}>
                <Calendar className="mr-2 h-4 w-4" />
                课程表
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); if (classId) navigate(`/history/${classId}`) }}>
                <HistoryIcon className="mr-2 h-4 w-4" />
                考勤历史
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); if (classId) navigate(`/attendance/${classId}`) }}>
                <ListChecks className="mr-2 h-4 w-4" />
                点名
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {classList.map((cls) => (
                <DropdownMenuItem
                  key={cls.id}
                  onSelect={(e) => {
                    e.preventDefault()
                    if (cls.id === classId) return
                    showToast(`已切换到 ${cls.name}`, { variant: 'success', duration: 1800 })
                    navigate(`/grades/${cls.id}`, { replace: true })
                  }}
                  disabled={cls.id === classId}
                  className={cls.id === classId ? 'bg-[var(--surface-2)]' : ''}
                >
                  {cls.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="px-[var(--page-x)] py-4 pb-[calc(var(--space-24)+var(--safe-bottom))]">
        <input
          ref={importExcelFileRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={handleImportExcel}
        />
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--outline)] bg-[var(--surface)] shadow-elevation-card [-webkit-overflow-scrolling:touch]">
          <table
            className="w-full min-w-[var(--grades-table-min-width)] border-collapse text-caption"
            style={{ '--grades-table-min-width': `${40 + 80 + grades.subjects.length * 72 + 72}px` } as CSSProperties}
          >
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-10 min-w-[2.5rem] border-b border-r border-[var(--outline-variant)] bg-[var(--surface-2)] py-2 text-center text-label font-medium text-[var(--on-surface-muted)]">
                  序号
                </th>
                <th className="sticky left-10 z-10 w-20 min-w-[5rem] border-b border-r border-[var(--outline-variant)] bg-[var(--surface-2)] py-2 text-center text-label font-medium text-[var(--on-surface)]">
                  <div className="flex items-center justify-center gap-1">
                    姓名
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="rounded p-0.5 text-[var(--on-surface-muted)] active:bg-[var(--surface-hover)]"
                          aria-label="排序"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
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
                    'w-[72px] min-w-[72px] select-none touch-manipulation border-b border-[var(--outline-variant)] bg-[var(--surface-2)] py-2 text-center text-label font-medium text-[var(--on-surface)]',
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
                <th className="w-[72px] min-w-[72px] border-b border-[var(--outline-variant)] bg-[var(--surface-2)] py-2 text-center text-label font-medium text-[var(--on-surface-muted)]">
                  总分
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((s, index) => (
                <tr key={s.id} className="border-b border-[var(--outline-variant)]">
                  <td className="sticky left-0 z-10 w-10 min-w-[2.5rem] border-r border-[var(--outline-variant)] bg-[var(--surface)] py-1.5 text-center text-caption text-[var(--on-surface-muted)]">
                    {index + 1}
                  </td>
                  <td className="sticky left-10 z-10 w-20 min-w-[5rem] border-r border-[var(--outline-variant)] bg-[var(--surface)] py-1.5 pl-2 text-label text-[var(--on-surface)]">
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
                            className="mx-auto h-8 w-14 rounded border-0 bg-[var(--surface-2)] px-1 text-center text-label outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(s.id, sub)}
                            className="min-h-[32px] w-full rounded px-1 text-label text-[var(--on-surface)] active:bg-[var(--surface-hover)]"
                          >
                            {getScore(s.id, sub) || '—'}
                          </button>
                        )}
                      </td>
                    )
                  })}
                  <td className="border-b border-[var(--outline-variant)] py-1.5 text-center text-label font-medium text-[var(--on-surface)]">
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
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-dialog-title text-[var(--on-surface)] block text-center">添加科目</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">输入科目名称，如：物理、化学</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 py-2">
            <Input
              placeholder="科目名"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
              className="flex-1 rounded-[var(--radius-sm)] border-[var(--outline)]"
            />
            <Button size="sm" onClick={handleAddSubject} disabled={!newSubjectName.trim()} className="rounded-[var(--radius-sm)] bg-[var(--primary)] text-white">
              添加
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addPeriodOpen} onOpenChange={setAddPeriodOpen}>
        <DialogContent>
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-dialog-title text-[var(--on-surface)] block text-center">添加成绩单</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">为新成绩单起名，如：期中、期末、第一次月考</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 py-2">
            <Input
              placeholder="如：期中、期末"
              value={newPeriodName}
              onChange={(e) => setNewPeriodName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPeriod()}
              className="flex-1 rounded-[var(--radius-sm)] border-[var(--outline)]"
            />
            <Button size="sm" onClick={handleAddPeriod} className="rounded-[var(--radius-sm)] bg-[var(--primary)] text-white">
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
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2 rounded-none px-3 py-2 text-left text-label text-[var(--on-surface)] active:bg-[var(--surface-hover)]"
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
            </button>
            <button
              type="button"
              disabled={grades.subjects.length <= 1}
              className="flex w-full cursor-pointer items-center gap-2 rounded-none px-3 py-2 text-left text-label text-[var(--error)] active:bg-[var(--surface-hover)] disabled:opacity-50 disabled:pointer-events-none"
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
            </button>
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
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-dialog-title text-[var(--on-surface)] block text-center">修改科目名</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">输入新名称，不可与已有科目重复</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 py-2">
            <Input
              id="grades-rename-input"
              placeholder="新科目名"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameSubject) renameSubjectAction(renameSubject, renameValue)
                if (e.key === 'Escape') setRenameSubject(null)
              }}
              className="flex-1 rounded-[var(--radius-sm)] border-[var(--outline)]"
            />
            <Button
              size="sm"
              onClick={() => renameSubject && renameSubjectAction(renameSubject, renameValue)}
              disabled={!renameValue.trim() || renameValue.trim() === renameSubject || grades.subjects.includes(renameValue.trim())}
              className="rounded-[var(--radius-sm)] bg-[var(--primary)] text-white"
            >
              确定
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
