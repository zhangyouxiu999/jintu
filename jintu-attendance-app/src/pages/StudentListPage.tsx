import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { FileDown, FileUp, UserPlus, Users } from 'lucide-react'
import GlobalActionDrawer from '@/components/GlobalActionDrawer'
import SortableStudentRow from '@/components/SortableStudentRow'
import { FormSheet, InlineMetaRow, ListSection, PageActionRow, PrimaryButton, SecondaryButton } from '@/components/ui/app-ui'
import { Button } from '@/components/ui/button'
import { EmptyStateCard, LoadingStateCard } from '@/components/ui/mobile-ui'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useClass } from '@/hooks/useClass'
import { useStudentImport } from '@/hooks/useStudentImport'
import { buildStudentListWorkbook } from '@/lib/exportClassExcel'
import { shareOrDownloadFile } from '@/lib/shareOrDownload'
import { showToast } from '@/lib/toast'

export default function StudentListPage() {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const {
    classEntity,
    students,
    loading,
    refresh,
    addStudent,
    addStudents,
    updateOrder,
    updateStudentName,
    deleteStudent,
  } = useClass(classId)

  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [editStudentId, setEditStudentId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null)
  const [toolDrawerOpen, setToolDrawerOpen] = useState(false)
  const addInputRef = useRef<HTMLInputElement>(null)

  const {
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
  } = useStudentImport({
    classId,
    addStudents,
    refresh,
  })

  useEffect(() => {
    if (!addOpen) return
    const timer = setTimeout(() => addInputRef.current?.focus(), 40)
    return () => clearTimeout(timer)
  }, [addOpen])

  const handleExportStudents = useCallback(async () => {
    if (!classEntity || students.length === 0) return
    try {
      const buf = await buildStudentListWorkbook(classEntity.name, students)
      await shareOrDownloadFile(buf, `${classEntity.name}-学生名单.xlsx`, { dialogTitle: '导出学生名单' })
      showToast('已导出', { variant: 'success', duration: 1800 })
    } catch {
      showToast('导出失败，请重试', { variant: 'error' })
    }
  }, [classEntity, students])

  const handleAddStudent = async () => {
    const name = addName.trim()
    if (!name || addSubmitting) return
    setAddSubmitting(true)
    try {
      await addStudent(name)
      setAddName('')
      setAddOpen(false)
      showToast('已添加', { variant: 'success', duration: 1800 })
    } finally {
      setAddSubmitting(false)
    }
  }

  const handleSaveEditStudent = async () => {
    if (!editStudentId || !editName.trim()) return
    await updateStudentName(editStudentId, editName.trim())
    setEditStudentId(null)
    setEditName('')
    showToast('保存成功', { variant: 'success', duration: 1800 })
  }

  const handleConfirmDelete = async () => {
    if (!deleteStudentId) return
    await deleteStudent(deleteStudentId)
    setDeleteStudentId(null)
    showToast('已删除', { variant: 'success', duration: 1800 })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = students.findIndex((item) => item.id === active.id)
    const newIndex = students.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const nextOrder = arrayMove(students, oldIndex, newIndex).map((item) => item.id)
    await updateOrder(nextOrder)
  }

  const handleIndexChange = async (studentId: string, newIndexStr: string) => {
    const newIndex = parseInt(newIndexStr, 10) - 1
    if (Number.isNaN(newIndex) || newIndex < 0 || newIndex >= students.length) return
    const oldIndex = students.findIndex((item) => item.id === studentId)
    if (oldIndex === -1 || oldIndex === newIndex) return
    const nextOrder = arrayMove(students, oldIndex, newIndex).map((item) => item.id)
    await updateOrder(nextOrder)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  if (loading || !classEntity) {
    return (
      loading
        ? <LoadingStateCard title="正在整理学生名单" />
        : <EmptyStateCard icon={Users} title="班级不存在" iconTone="primary" />
    )
  }

  return (
    <>
      <FormSheet open={addOpen} onOpenChange={setAddOpen} title="添加学生">
        <div className="py-1">
          <Input
            ref={addInputRef}
            placeholder="姓名"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleAddStudent()
              }
            }}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">
            取消
          </Button>
          <Button onClick={() => void handleAddStudent()} disabled={!addName.trim() || addSubmitting} className="flex-1">
            {addSubmitting ? '添加中…' : '确定'}
          </Button>
        </div>
      </FormSheet>

      <FormSheet open={importOpen} onOpenChange={(open) => { if (!open) resetImport() }} title="导入学生">
          <div className="flex min-h-0 flex-1 flex-col gap-2 py-2">
            <Textarea
              placeholder={'张三\n李四\n王五'}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="min-h-[140px] max-h-[40vh] resize-y bg-[var(--surface-2)]"
              rows={5}
            />
            <input
              ref={importFileInputRef}
              type="file"
              accept=".txt,.csv,.xlsx,.xls,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleImportFileChange}
            />
            <Button type="button" variant="outline" className="w-full" onClick={() => importFileInputRef.current?.click()}>
              <FileUp className="mr-1.5 h-3.5 w-3.5" />
              选择文件
            </Button>
          </div>
          <div className="mt-2 flex shrink-0 gap-2 pb-[env(safe-area-inset-bottom)]">
            <Button type="button" variant="outline" onClick={resetImport} className="flex-1">
              取消
            </Button>
            <Button onClick={() => void handleImportStudents()} disabled={!importText.trim() || importSubmitting} className="flex-1">
              {importSubmitting ? '导入中…' : `导入（${parseImportNames(importText).length} 人）`}
            </Button>
          </div>
      </FormSheet>

      <FormSheet open={!!editStudentId} onOpenChange={(open) => { if (!open) { setEditStudentId(null); setEditName('') } }} title="编辑学生">
          <div className="py-1">
            <Input
              placeholder="姓名"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleSaveEditStudent()
                }
              }}
              autoFocus
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => { setEditStudentId(null); setEditName('') }} className="flex-1">
              取消
            </Button>
            <Button onClick={() => void handleSaveEditStudent()} disabled={!editName.trim()} className="flex-1">
              保存
            </Button>
          </div>
      </FormSheet>

      <AlertDialog open={!!deleteStudentId} onOpenChange={(open) => !open && setDeleteStudentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除该学生？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后不可恢复，且会从当前班级名单中移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 flex gap-2">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmDelete()}>删除</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <GlobalActionDrawer
          open={toolDrawerOpen}
          onOpenChange={setToolDrawerOpen}
          title={`${classEntity.name} · 名单工具`}
          actions={{
            importAction: {
              id: 'import',
              label: '导入学生',
              icon: FileUp,
              onSelect: () => setImportOpen(true),
            },
            exportAction: {
              id: 'export',
              label: '导出学生名单',
              icon: FileDown,
              onSelect: () => void handleExportStudents(),
              disabled: students.length === 0,
            },
          }}
        />

        <PageActionRow>
          <SecondaryButton type="button" variant="outline" className="px-4" onClick={() => navigate(`/attendance/${classId}`)}>
            返回点名
          </SecondaryButton>
          <PrimaryButton type="button" className="px-4" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" strokeWidth={1.8} />
            添加
          </PrimaryButton>
          <SecondaryButton type="button" variant="outline" className="px-4" onClick={() => setToolDrawerOpen(true)}>
            更多操作
          </SecondaryButton>
        </PageActionRow>

        {students.length > 0 ? (
          <InlineMetaRow
            left={<span>已按班级名单顺序排列</span>}
            right={<span>长按拖动可调整顺序</span>}
            className="px-1"
          />
        ) : null}

        {students.length === 0 ? (
          <EmptyStateCard
            icon={Users}
            title="还没有学生"
            description="先添加一位学生，或从文件一次性导入名单，点名页和成绩页都会直接使用这份名单。"
            actionLabel="添加学生"
            actionIcon={UserPlus}
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
            <SortableContext items={students.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <ListSection className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="divide-y divide-[var(--outline-variant)]/80">
                    {students.map((student, index) => (
                      <SortableStudentRow
                        key={student.id}
                        student={student}
                        index={index + 1}
                        showEdit
                        showIndex={students.length > 1}
                        onIndexChange={handleIndexChange}
                        onStatus={() => {}}
                        onEdit={(id, name) => {
                          setEditStudentId(id)
                          setEditName(name)
                        }}
                        onDelete={(id) => setDeleteStudentId(id)}
                      />
                    ))}
                  </div>
                </div>
              </ListSection>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </>
  )
}
