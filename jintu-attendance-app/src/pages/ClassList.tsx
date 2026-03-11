import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { storage } from '@/store/storage'
import * as attendanceStore from '@/store/attendance'
import * as studentsStore from '@/store/students'
import { Plus, School, MoreHorizontal, Edit2, Trash2, Download, Settings as SettingsIcon, Calendar, Award, History as HistoryIcon, ChevronLeft } from 'lucide-react'
import { useClassList } from '@/hooks/useClassList'
import type { ClassEntity } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { showToast } from '@/lib/toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { animateStagger } from '@/lib/gsap'
import { getAppName } from '@/lib/appConfig'

export default function ClassList() {
  const navigate = useNavigate()
  const location = useLocation()
  const isStandaloneClassList = location.pathname === '/classes'
  const { list, loading, addClass, deleteClass, updateClass } = useClassList()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassEntity | null>(null)
  const [appTitle, setAppTitle] = useState(getAppName())
  const [editingTitle, setEditingTitle] = useState(false)
  const [exportConfirmClass, setExportConfirmClass] = useState<ClassEntity | null>(null)
  const [deleteConfirmClass, setDeleteConfirmClass] = useState<ClassEntity | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = storage.loadAppTitle()
    if (saved != null && saved.trim()) setAppTitle(saved.trim())
  }, [])

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus()
  }, [editingTitle])

  useEffect(() => {
    if (loading || list.length === 0) return
    const revert = animateStagger(listContainerRef.current, ':scope > div')
    return revert
  }, [loading, list.length])

  const saveAppTitle = (value: string) => {
    const trimmed = value.trim() || getAppName()
    setAppTitle(trimmed)
    storage.saveAppTitle(trimmed)
    setEditingTitle(false)
  }

  const handleAdd = async () => {
    const trimmed = name.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      const id = await addClass(trimmed)
      storage.saveCurrentClassId(id)
      setName('')
      setDialogOpen(false)
      navigate(`/attendance/${id}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmClass) return
    await deleteClass(deleteConfirmClass.id)
    setDeleteConfirmClass(null)
  }

  const handleEdit = (cls: ClassEntity) => {
    setEditingClass(cls)
    setName(cls.name)
  }

  const handleSaveEdit = async () => {
    if (!editingClass || !name.trim() || submitting) return
    setSubmitting(true)
    try {
      await updateClass(editingClass.id, name.trim())
      setEditingClass(null)
      setName('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExportClass = useCallback(async (cls: ClassEntity) => {
    const [snapshots, students] = await Promise.all([
      attendanceStore.listByClass(cls.id),
      studentsStore.getByClassId(cls.id),
    ])
    const studentNames: Record<string, string> = {}
    for (const s of students) studentNames[s.id] = s.name

    const scheduleByClass = storage.loadSchedule() ?? {}
    const scheduleData = scheduleByClass[cls.id] ?? {}
    const gradesByClass = storage.loadGrades() ?? {}
    const periods = gradesByClass[cls.id] ?? []
    const orderMap = new Map(cls.studentOrder.map((id, i) => [id, i]))
    const sortedStudents = [...students].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))

    const fileName = `${cls.name}.xlsx`
    try {
      const { buildClassExportWorkbook } = await import('@/lib/exportClassExcel')
      const buf = await buildClassExportWorkbook({
        cls,
        students,
        snapshots,
        scheduleData,
        periods,
        sortedStudents,
        studentNames,
      })
      const { shareOrDownloadFile } = await import('@/lib/shareOrDownload')
      await shareOrDownloadFile(buf, fileName, { dialogTitle: '导出考勤表' })
      showToast('已导出', { variant: 'success', duration: 1800 })
    } catch {
      showToast('导出失败，请重试', { variant: 'error' })
    }
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AlertDialog open={!!deleteConfirmClass} onOpenChange={(open) => !open && setDeleteConfirmClass(null)}>
        <AlertDialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[66.67vh] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-6 shadow-elevation-2">
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle className="text-title text-[var(--on-surface)] block text-center">确定删除该班级？</AlertDialogTitle>
            <AlertDialogDescription className="text-caption text-[var(--on-surface-muted)]">
              {deleteConfirmClass ? `删除「${deleteConfirmClass.name}」后，其学生与考勤记录将一并清除，且无法恢复。` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogCancel className="!h-8 min-h-0 rounded-[var(--radius-sm)] !border-[var(--outline)] !bg-[var(--surface)] px-3 py-0 text-caption !text-[var(--on-surface)]">取消</AlertDialogCancel>
            <AlertDialogAction className="!h-8 min-h-0 rounded-[var(--radius-sm)] border-0 !bg-[var(--primary)] px-3 py-0 !text-white text-caption" onClick={handleConfirmDelete}>确定删除</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <header
        className="glass-bar sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--outline-variant)] px-[var(--page-x)] shadow-elevation-1"
        style={{ paddingTop: 'var(--safe-top)', minHeight: 'calc(56px + var(--safe-top))' }}
      >
        {isStandaloneClassList ? (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="h-10 w-10 shrink-0 rounded-full text-[var(--on-surface-variant)] active:scale-95 active:bg-[var(--surface-hover)]"
            onClick={() => navigate('/settings')}
            aria-label="返回"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-10 shrink-0" aria-hidden />
        )}
        <div className="flex min-w-0 flex-1 justify-center">
          {editingTitle ? (
            <Input
              ref={titleInputRef}
              className="text-title h-9 max-w-[180px] border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)]"
              value={appTitle}
              onChange={(e) => setAppTitle(e.target.value)}
              onBlur={() => saveAppTitle(appTitle)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveAppTitle(appTitle)
              }}
            />
          ) : (
            <h1
              className="text-title flex cursor-pointer flex-col items-center gap-1.5 font-semibold tracking-tight text-[var(--on-surface)] underline-offset-2 transition-opacity hover:opacity-85 hover:underline"
              onClick={() => setEditingTitle(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditingTitle(true) }}
              aria-label={`标题：${appTitle}，点击修改`}
            >
              <span className="rounded-full bg-[var(--primary-container)]/80 px-4 py-1.5 text-[var(--on-primary-container)]">{appTitle}</span>
              <span className="h-0.5 w-10 rounded-full bg-[var(--primary)]/50" aria-hidden />
            </h1>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="h-10 w-10 shrink-0 rounded-full text-[var(--on-surface-variant)] active:scale-95 active:bg-[var(--surface-hover)]"
          onClick={() => navigate('/settings')}
          aria-label="设置"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </header>

      <main className="px-[var(--page-x)] py-[var(--space-24)]">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center py-12" aria-busy="true" />
        ) : list.length === 0 ? (
          <div className="card-soft py-[var(--space-48)] text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--primary-container)] to-[var(--primary)]/20">
              <School className="h-12 w-12 text-[var(--primary)]" />
            </div>
            <p className="text-display text-[var(--on-surface)]">暂无班级</p>
            <p className="mt-2 text-label text-[var(--on-surface-variant)]">
              点击下方按钮新增班级
            </p>
            <Button
              className="mt-6 h-10 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-label font-semibold text-[var(--on-primary)] shadow-elevation-2 active:scale-[0.98]"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              新增班级
            </Button>
          </div>
        ) : (
          <div ref={listContainerRef} className="space-y-3">
            {list.map((cls) => (
              <div
                key={cls.id}
                className="card-soft flex min-h-12 w-full items-center gap-3 px-4 py-3 transition-shadow hover:shadow-elevation-2"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/attendance/${cls.id}`)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99] active:opacity-95"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary-container)] to-[var(--primary)]/15 text-label font-semibold text-[var(--primary)]">
                    {cls.name.charAt(0)}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-label font-medium text-[var(--on-surface)]">
                    {cls.name}
                  </span>
                </button>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="h-9 w-9 shrink-0 rounded-full text-[var(--on-surface-muted)]"
                      aria-label="更多"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[10rem]">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        handleEdit(cls)
                      }}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      修改
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); navigate(`/schedule/${cls.id}`) }}>
                      <Calendar className="mr-2 h-4 w-4" />
                      课程表
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); navigate(`/grades/${cls.id}`) }}>
                      <Award className="mr-2 h-4 w-4" />
                      成绩单
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); navigate(`/history/${cls.id}`) }}>
                      <HistoryIcon className="mr-2 h-4 w-4" />
                      历史考勤
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        setExportConfirmClass(cls)
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      导出所有
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={(e) => {
                        e.preventDefault()
                        setDeleteConfirmClass(cls)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            <Button
              className="mt-5 h-10 w-full rounded-[var(--radius-md)] bg-[var(--primary)] text-label font-semibold text-[var(--on-primary)] shadow-elevation-2 active:scale-[0.98]"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              新增班级
            </Button>
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[66.67vh] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-6 shadow-elevation-2">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-title text-[var(--on-surface)] block text-center">新增班级</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">填写班级名称</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="班级名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
              className="h-[var(--touch-target)] rounded-[var(--radius-sm)] border-[var(--outline)] bg-[var(--surface)] text-body"
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="rounded-[var(--radius-sm)] h-8 px-3 border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] text-caption">取消</Button>
            <Button size="sm" onClick={handleAdd} disabled={!name.trim() || submitting} className="rounded-[var(--radius-sm)] h-8 px-3 bg-[var(--primary)] !text-white text-caption">{submitting ? '…' : '确定'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!exportConfirmClass} onOpenChange={(open) => { if (!open) setExportConfirmClass(null) }}>
        <DialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[66.67vh] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-6 shadow-elevation-2">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-title text-[var(--on-surface)]">确认导出</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">
              {exportConfirmClass && (
                <>将「{exportConfirmClass.name}」班级全部表单（点名表、考勤记录、课程表、成绩单）导出为 Excel 文件。</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportConfirmClass(null)} className="rounded-[var(--radius-sm)] h-8 px-3 border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] text-caption">取消</Button>
            <Button
              size="sm"
              onClick={async () => {
                if (!exportConfirmClass) return
                setExportConfirmClass(null)
                await handleExportClass(exportConfirmClass)
              }}
              className="rounded-[var(--radius-sm)] h-8 px-3 bg-[var(--primary)] !text-white text-caption"
            >
              确认导出
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingClass} onOpenChange={(open) => { if (!open) { setEditingClass(null); setName('') } }}>
        <DialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[66.67vh] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-6 shadow-elevation-2">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-title text-[var(--on-surface)] block text-center">编辑班级</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">修改班级名称</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="班级名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              autoFocus
              className="h-[var(--touch-target)] rounded-[var(--radius-sm)] border-[var(--outline)] bg-[var(--surface)] text-body"
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditingClass(null); setName('') }} className="rounded-[var(--radius-sm)] h-8 px-3 border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] text-caption">取消</Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={!name.trim() || submitting} className="rounded-[var(--radius-sm)] h-8 px-3 bg-[var(--primary)] !text-white text-caption">{submitting ? '…' : '保存'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
