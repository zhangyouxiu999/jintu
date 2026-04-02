import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { storage } from '@/store/storage'
import * as attendanceStore from '@/store/attendance'
import * as studentsStore from '@/store/students'
import * as gradesStore from '@/store/grades'
import * as scheduleStore from '@/store/schedule'
import { Plus, School, MoreHorizontal, Edit2, Trash2, Download } from 'lucide-react'
import { useClassList } from '@/hooks/useClassList'
import type { ClassEntity } from '@/types'
import { FormSheet, ListSection, OverflowSheet, PageActionRow, PrimaryButton, SecondaryButton, SimpleListRow } from '@/components/ui/app-ui'
import { Button } from '@/components/ui/button'
import { EmptyStateCard } from '@/components/ui/mobile-ui'
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
  const [deleteConfirmClass, setDeleteConfirmClass] = useState<ClassEntity | null>(null)
  const [actionSheetClass, setActionSheetClass] = useState<ClassEntity | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const savedAppTitle = storage.loadAppTitle()?.trim() || getAppName()

  useEffect(() => {
    const saved = storage.loadAppTitle()
    if (saved != null && saved.trim()) setAppTitle(saved.trim())
  }, [])

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus()
  }, [editingTitle])

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

  const handleEdit = (classEntity: ClassEntity) => {
    setEditingClass(classEntity)
    setName(classEntity.name)
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

  const handleExportClass = useCallback(async (classEntity: ClassEntity) => {
    const [snapshots, students] = await Promise.all([
      attendanceStore.listConfirmedByClass(classEntity.id),
      studentsStore.getByClassId(classEntity.id),
    ])
    const studentNames: Record<string, string> = {}
    for (const student of students) studentNames[student.id] = student.name

    const scheduleData = scheduleStore.getSchedule(classEntity.id)
    const periods = gradesStore.getPeriods(classEntity.id)
    const orderMap = new Map(classEntity.studentOrder.map((id, index) => [id, index]))
    const sortedStudents = [...students].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))

    const fileName = `${classEntity.name}.xlsx`
    try {
      const { buildClassExportWorkbook } = await import('@/lib/exportClassExcel')
      const buf = await buildClassExportWorkbook({
        cls: classEntity,
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
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <AlertDialog open={!!deleteConfirmClass} onOpenChange={(open) => !open && setDeleteConfirmClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除该班级？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmClass ? `删除「${deleteConfirmClass.name}」后，其学生与考勤记录将一并清除，且无法恢复。` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex gap-2">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>确定删除</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {editingTitle ? (
        <div className="space-y-2">
          <Input
            ref={titleInputRef}
            className="h-11 border-[var(--outline)] bg-[var(--surface)] text-[15px] text-[var(--on-surface)]"
            value={appTitle}
            onChange={(e) => setAppTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveAppTitle(appTitle)
            }}
          />
          <div className="flex gap-2">
            <SecondaryButton
              type="button"
              variant="outline"
              className="h-10 flex-1"
              onClick={() => {
                setAppTitle(savedAppTitle)
                setEditingTitle(false)
              }}
            >
              取消
            </SecondaryButton>
            <PrimaryButton type="button" className="h-10 flex-1" onClick={() => saveAppTitle(appTitle)}>
              保存标题
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <>
          {list.length > 0 || isStandaloneClassList ? (
            <PageActionRow>
              {list.length > 0 ? (
              <PrimaryButton type="button" className="px-4" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.8} />
                  新增班级
                </PrimaryButton>
              ) : null}
              {isStandaloneClassList ? (
                <SecondaryButton type="button" variant="outline" className="px-4" onClick={() => setEditingTitle(true)}>
                  修改标题
                </SecondaryButton>
              ) : null}
            </PageActionRow>
          ) : null}
        </>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center py-12" aria-busy="true" />
        ) : list.length === 0 ? (
          <EmptyStateCard
            icon={School}
            title="暂无班级"
            actionLabel="新增班级"
            actionIcon={Plus}
            onAction={() => setDialogOpen(true)}
            iconTone="primary"
            iconSize="xl"
            className="px-6"
            titleClassName="text-[22px] font-bold"
            descriptionClassName="text-[14px]"
          />
        ) : (
          <ListSection className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-[var(--outline-variant)]/80">
              {list.map((classEntity) => (
                <div key={classEntity.id} className="flex min-h-[68px] items-center gap-3 px-4 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(`/attendance/${classEntity.id}`)}
                    className="flex h-auto min-w-0 flex-1 items-center gap-3 rounded-[14px] py-3 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--primary-container)] text-[16px] font-semibold text-[var(--primary)]">
                      {classEntity.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-[var(--on-surface)]">
                        {classEntity.name}
                      </span>
                      <span className="mt-1 block text-[12px] text-[var(--on-surface-muted)]">
                        {classEntity.studentOrder.length} 位学生
                      </span>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    className="h-10 w-10 shrink-0 rounded-[14px] border-[var(--outline)] bg-[var(--surface-2)] text-[var(--on-surface-muted)] shadow-none"
                    aria-label="更多"
                    onClick={() => setActionSheetClass(classEntity)}
                  >
                    <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  </Button>
                </div>
              ))}
            </div>
          </ListSection>
        )}
      </div>

      <OverflowSheet open={!!actionSheetClass} onOpenChange={(open) => !open && setActionSheetClass(null)} title={actionSheetClass?.name ?? '当前班级'}>
        <ListSection>
          <SimpleListRow
            title="修改班级名称"
            leading={<Edit2 className="h-4 w-4 text-[var(--on-surface-muted)]" strokeWidth={1.8} />}
            onClick={() => {
              if (!actionSheetClass) return
              handleEdit(actionSheetClass)
              setActionSheetClass(null)
            }}
          />
          <div className="mx-4 h-px bg-[var(--outline-variant)]" />
          <SimpleListRow
            title="导出全部表单"
            leading={<Download className="h-4 w-4 text-[var(--on-surface-muted)]" strokeWidth={1.8} />}
            onClick={async () => {
              if (!actionSheetClass) return
              const target = actionSheetClass
              setActionSheetClass(null)
              await handleExportClass(target)
            }}
          />
          <div className="mx-4 h-px bg-[var(--outline-variant)]" />
          <SimpleListRow
            title="删除班级"
            leading={<Trash2 className="h-4 w-4 text-[var(--error)]" strokeWidth={1.8} />}
            titleClassName="text-[var(--error)]"
            onClick={() => {
              if (!actionSheetClass) return
              setDeleteConfirmClass(actionSheetClass)
              setActionSheetClass(null)
            }}
          />
        </ListSection>
      </OverflowSheet>

      <FormSheet open={dialogOpen} onOpenChange={setDialogOpen} title="新增班级">
        <div className="py-1">
          <Input
            placeholder="班级名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
            className="bg-[var(--surface)]"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">取消</Button>
          <Button onClick={handleAdd} disabled={!name.trim() || submitting} className="flex-1">{submitting ? '…' : '确定'}</Button>
        </div>
      </FormSheet>

      <FormSheet open={!!editingClass} onOpenChange={(open) => { if (!open) { setEditingClass(null); setName('') } }} title="编辑班级">
        <div className="py-1">
          <Input
            placeholder="班级名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
            autoFocus
            className="bg-[var(--surface)]"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => { setEditingClass(null); setName('') }} className="flex-1">取消</Button>
          <Button onClick={handleSaveEdit} disabled={!name.trim() || submitting} className="flex-1">{submitting ? '…' : '保存'}</Button>
        </div>
      </FormSheet>
    </div>
  )
}
