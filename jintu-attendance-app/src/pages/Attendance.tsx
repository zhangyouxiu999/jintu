import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import {
  UserPlus,
  FileText,
  ClipboardCheck,
  CheckCircle,
  RefreshCw,
  Pencil,
  ChevronDown,
  Upload,
  Users,
  Megaphone,
  Send,
  X,
  Plus,
  List,
} from 'lucide-react'
import { useClass } from '@/hooks/useClass'
import { useAttendance } from '@/hooks/useAttendance'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useAttendanceStats } from '@/hooks/useAttendanceStats'
import { useStudentImport } from '@/hooks/useStudentImport'
import type { AttendanceStatus, AttendanceStatusMap } from '@/types'
import { today } from '@/lib/date'
import { PERIOD_NAMES } from '@/lib/period'
import { getReportDateLabel } from '@/lib/reportText'
import { showToast } from '@/lib/toast'
import { shareOrDownloadFile } from '@/lib/shareOrDownload'
import { buildStudentListWorkbook } from '@/lib/exportClassExcel'
import { cn } from '@/lib/utils'
import { animateStagger } from '@/lib/gsap'
import { useAppLayout } from '@/components/AppLayout'
import SortableStudentRow from '@/components/SortableStudentRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

export default function Attendance() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const {
    classEntity,
    students,
    loading,
    refresh,
    setStudentAttendanceStatus,
    setAllAttendanceStatus,
    addStudent,
    addStudents,
    updateOrder,
    updateStudentName,
    deleteStudent,
  } = useClass(classId)
  const { saveStatus, saveAllStatus, confirmReport, getCurrentPeriodId } = useAttendance(classId)
  const { list: announcements, addMany: addAnnouncements, remove: removeAnnouncement } = useAnnouncements(classId)

  const [addAnnouncementOpen, setAddAnnouncementOpen] = useState(false)
  const [addAnnouncementCancelConfirmOpen, setAddAnnouncementCancelConfirmOpen] = useState(false)
  const [announcementExpanded, setAnnouncementExpanded] = useState(false)
  const [announcementRows, setAnnouncementRows] = useState<string[]>([''])
  const [announcementExpiry, setAnnouncementExpiry] = useState<import('@/types').AnnouncementExpirationType>('today')
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addedNamesInSession, setAddedNamesInSession] = useState<string[]>([])
  const addNameInputRef = useRef<HTMLInputElement>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportConfirming, setReportConfirming] = useState(false)
  const [editStudentId, setEditStudentId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showEditStudent, setShowEditStudent] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null)
  const [isAndroid, setIsAndroid] = useState(false)
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | null>(null)
  const studentListRef = useRef<HTMLDivElement>(null)

  const { setPageActions } = useAppLayout()

  useEffect(() => {
    import('@capacitor/core').then(({ Capacitor }) => setIsAndroid(Capacitor.getPlatform() === 'android')).catch(() => {})
  }, [])

  useEffect(() => {
    if (loading || students.length === 0) return
    const revert = animateStagger(studentListRef.current, ':scope > div')
    return revert
  }, [loading, students.length])

  const period = getCurrentPeriodId()

  const filteredStudents =
    statusFilter === null
      ? students
      : students.filter((s) => s.attendanceStatus === statusFilter)

  const {
    oneColumn,
    twoColumns,
    threeColumns,
    studentsLeft,
    studentsCenter,
    studentsRight,
    presentCount,
    leaveCount,
    lateCount,
    reportText,
    getGlobalIndex,
  } = useAttendanceStats({
    className: classEntity?.name ?? '',
    students,
    period,
    listStudents: filteredStudents,
  })

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
    if (addOpen) {
      const t = setTimeout(() => addNameInputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [addOpen])

  const lastPeriodCheckRef = useRef<{ classId: string; period: number } | null>(null)
  useEffect(() => {
    if (!classId || students.length === 0) return
    const prev = lastPeriodCheckRef.current
    const periodChanged = prev === null || prev.classId !== classId || prev.period !== period
    lastPeriodCheckRef.current = { classId, period }
    const dateStr = today()
    const key = `last_period_${classId}_${dateStr}`
    const last = sessionStorage.getItem(key)
    const current = String(period)
    if (periodChanged && last !== null && last !== current && period !== 3) {
      if (typeof document !== 'undefined') {
        const cleanupRef = { current: undefined as (() => void) | undefined }
        cleanupRef.current = showToast(`已进入${PERIOD_NAMES[period]}时段，考勤已重置`, { duration: 3500 })
        return () => cleanupRef.current?.()
      }
    }
    sessionStorage.setItem(key, current)
  }, [classId, period, students.length])

  const handleStatus = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      requestAnimationFrame(() => setStudentAttendanceStatus(studentId, status))
      saveStatus(studentId, status).catch(() => {
        refresh()
        showToast('保存失败，已恢复', { variant: 'error', duration: 2000 })
      })
    },
    [setStudentAttendanceStatus, saveStatus, refresh]
  )

  const handleAddStudent = async () => {
    const name = addName.trim()
    if (!name || addSubmitting || !classId) return
    setAddSubmitting(true)
    try {
      await addStudent(name)
      setAddedNamesInSession((prev) => [...prev, name])
      setAddName('')
      showToast('已添加', { variant: 'success', duration: 1800 })
      requestAnimationFrame(() => { addNameInputRef.current?.focus() })
    } finally {
      setAddSubmitting(false)
    }
  }

  const handleCloseAddDialog = (open: boolean) => {
    if (!open) {
      setAddOpen(false)
      setAddedNamesInSession([])
    }
  }

  const handleEditStudent = (id: string, name: string) => {
    setEditStudentId(id)
    setEditName(name)
  }

  const handleSaveEditStudent = async () => {
    if (!editStudentId || !editName.trim()) return
    await updateStudentName(editStudentId, editName.trim())
    setEditStudentId(null)
    setEditName('')
    showToast('保存成功', { variant: 'success', duration: 1800 })
  }

  const handleDeleteStudent = (id: string) => {
    setDeleteStudentId(id)
  }

  const handleConfirmDeleteStudent = async () => {
    if (!deleteStudentId) return
    await deleteStudent(deleteStudentId)
    setDeleteStudentId(null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !classEntity) return
    const oldIndex = students.findIndex((s) => s.id === active.id)
    const newIndex = students.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = arrayMove(students, oldIndex, newIndex).map((s) => s.id)
    await updateOrder(newOrder)
  }

  const handleIndexChange = async (studentId: string, newIndexStr: string) => {
    const newIndex = parseInt(newIndexStr, 10) - 1
    if (Number.isNaN(newIndex) || newIndex < 0 || newIndex >= students.length) return
    const oldIndex = students.findIndex((s) => s.id === studentId)
    if (oldIndex === -1 || oldIndex === newIndex) return
    const newOrder = arrayMove(students, oldIndex, newIndex).map((s) => s.id)
    await updateOrder(newOrder)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleMarkAllPresent = useCallback(async () => {
    const unarrived = students.filter((s) => s.attendanceStatus === 0)
    if (unarrived.length === 0) return
    const next: AttendanceStatusMap = {}
    for (const s of students) next[s.id] = unarrived.some((u) => u.id === s.id) ? 1 : s.attendanceStatus
    await saveAllStatus(next)
    setAllAttendanceStatus(next)
  }, [students, saveAllStatus, setAllAttendanceStatus])

  const handleExportStudentList = useCallback(async () => {
    if (!classEntity || students.length === 0) return
    try {
      const buf = await buildStudentListWorkbook(classEntity.name, students)
      const fileName = `${classEntity.name}-学生名单.xlsx`
      await shareOrDownloadFile(buf, fileName, { dialogTitle: '导出学生名单' })
      showToast('已导出', { variant: 'success', duration: 1800 })
    } catch {
      showToast('导出失败，请重试', { variant: 'error' })
    }
  }, [classEntity, students])

  useEffect(() => {
    if (!classId || loading) return
    setPageActions({
      importAction: {
        id: 'attendance-import',
        label: '导入学生名单',
        icon: Upload,
        onSelect: () => setImportOpen(true),
      },
      exportListAction: {
        id: 'attendance-export-list',
        label: '导出学生名单',
        icon: List,
        onSelect: handleExportStudentList,
      },
        extraActions: [
          { id: 'attendance-add', label: '添加学生', icon: UserPlus, onSelect: () => setAddOpen(true) },
          { id: 'attendance-edit', label: showEditStudent ? '完成修改' : '修改学生', icon: Pencil, onSelect: () => setShowEditStudent((v) => !v) },
          { id: 'attendance-announcement', label: '添加公告', icon: Megaphone, onSelect: () => setAddAnnouncementOpen(true) },
          { id: 'attendance-all-present', label: '一键全勤', icon: CheckCircle, onSelect: handleMarkAllPresent },
          { id: 'attendance-reset', label: '重置考勤', icon: RefreshCw, onSelect: () => setResetDialogOpen(true) },
          { id: 'attendance-report', label: '生成考勤报告', icon: FileText, onSelect: () => setReportOpen(true) },
        ],
    })
    return () => setPageActions({})
  }, [classId, loading, setPageActions, handleMarkAllPresent, handleExportStudentList, showEditStudent, navigate])

  const handleReset = async () => {
    const next = students.reduce<AttendanceStatusMap>((acc, s) => ({ ...acc, [s.id]: 0 }), {})
    await saveAllStatus(next)
    setAllAttendanceStatus(next)
    setResetDialogOpen(false)
  }

  const handlePublishAnnouncement = async () => {
    const contents = announcementRows.map((r) => r.trim()).filter(Boolean)
    if (!contents.length || announcementSubmitting) return
    setAnnouncementSubmitting(true)
    try {
      await addAnnouncements(contents, announcementExpiry)
      setAnnouncementRows([''])
      setAddAnnouncementOpen(false)
    } finally {
      setAnnouncementSubmitting(false)
    }
  }

  const addAnnouncementRow = () => setAnnouncementRows((prev) => [...prev, ''])
  const removeAnnouncementRow = (index: number) =>
    setAnnouncementRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  const setAnnouncementRow = (index: number, value: string) =>
    setAnnouncementRows((prev) => prev.map((v, i) => (i === index ? value : v)))

  const hasAnnouncementDraft = announcementRows.some((r) => r.trim())
  const closeAddAnnouncementDialog = () => {
    setAnnouncementRows([''])
    setAddAnnouncementOpen(false)
  }
  const handleAddAnnouncementDialogClose = (open: boolean) => {
    if (open) setAddAnnouncementOpen(true)
    else if (hasAnnouncementDraft) setAddAnnouncementCancelConfirmOpen(true)
    else closeAddAnnouncementDialog()
  }
  const handleAddAnnouncementCancelClick = () => {
    if (hasAnnouncementDraft) setAddAnnouncementCancelConfirmOpen(true)
    else closeAddAnnouncementDialog()
  }
  const confirmAddAnnouncementCancel = () => {
    closeAddAnnouncementDialog()
    setAddAnnouncementCancelConfirmOpen(false)
  }

  const handleConfirmReport = async () => {
    setReportConfirming(true)
    try {
      await confirmReport()
      const { copyToClipboard } = await import('@/lib/clipboard')
      await copyToClipboard(reportText)
      setReportOpen(false)
      showToast('已复制，正在跳转微信…', { variant: 'success', duration: 1800 })
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (Capacitor.isNativePlatform()) {
          window.location.href = 'weixin://'
        }
      } catch {
        // 未安装微信或无法跳转时忽略
      }
    } finally {
      setReportConfirming(false)
    }
  }

  if (loading || !classEntity) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <p className="text-[15px] text-[var(--on-surface-muted)]">{loading ? '' : '班级不存在'}</p>
      </div>
    )
  }

  const absentCount = students.filter((s) => s.attendanceStatus === 0).length

  return (
    <>
      {/* 考勤报告弹窗 */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader className="shrink-0 border-b border-[var(--outline-variant)] bg-[var(--surface)] px-5 py-4 text-center sm:text-center">
            <DialogTitle className="text-dialog-title text-[var(--on-surface)]">考勤报告</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">{getReportDateLabel(period)}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--surface)] px-5 py-4">
            <pre className="whitespace-pre-wrap font-mono text-[14px] leading-relaxed text-[var(--on-surface)]">{reportText}</pre>
          </div>
          <DialogFooter className="shrink-0 flex justify-end gap-2 border-t border-[var(--outline-variant)] bg-[var(--surface)] px-5 py-3">
            <Button variant="outline" size="sm" onClick={() => setReportOpen(false)} className="rounded-[var(--radius-sm)]">取消</Button>
            <Button size="sm" onClick={handleConfirmReport} disabled={reportConfirming} className="rounded-[var(--radius-sm)]">
              {reportConfirming ? <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />}
              {reportConfirming ? '保存中…' : '复制并分享'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加学生弹窗 */}
      <Dialog open={addOpen} onOpenChange={handleCloseAddDialog}>
        <DialogContent>
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-dialog-title text-[var(--on-surface)]">添加学生</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">填写姓名，可连续添加多个</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <div className="flex gap-2">
              <Input ref={addNameInputRef} placeholder="姓名" value={addName} onChange={(e) => setAddName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStudent())} autoFocus className="h-10 flex-1 rounded-[var(--radius-sm)] border-[var(--outline)] bg-[var(--surface-2)] text-[15px]" />
              <Button type="button" size="sm" onClick={handleAddStudent} onMouseDown={(e) => e.preventDefault()} disabled={!addName.trim() || addSubmitting} className="h-10 shrink-0 rounded-[var(--radius-sm)]">{addSubmitting ? '…' : '添加'}</Button>
            </div>
          </div>
          {addedNamesInSession.length > 0 && (
            <div className="min-h-0 flex-1 overflow-y-auto rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3">
              <p className="mb-2 text-caption font-medium text-[var(--on-surface-muted)]">本批已添加（{addedNamesInSession.length} 人）</p>
              <ul className="space-y-1.5">
                {addedNamesInSession.map((name, i) => (
                  <li key={`${i}-${name}`} className="flex items-center gap-2 text-[14px] text-[var(--on-surface)]">
                    <span className="w-5 shrink-0 tabular-nums text-[var(--on-surface-muted)]">{i + 1}.</span>
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button type="button" size="sm" onClick={() => handleCloseAddDialog(false)} className="rounded-[var(--radius-sm)]">完成</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 导入学生弹窗 */}
      <Dialog open={importOpen} onOpenChange={(open) => { if (!open) resetImport() }}>
        <DialogContent className="max-h-[min(70vh,75dvh)]">
          <DialogHeader className="shrink-0 text-center sm:text-center">
            <DialogTitle className="text-dialog-title text-[var(--on-surface)]">导入学生</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">每行一个姓名，可粘贴或选择 txt/csv/Excel 文件（Excel 取第一列）</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 py-3 flex flex-col gap-2">
            <textarea
              placeholder={'张三\n李四\n王五'}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="min-h-[100px] w-full max-h-[40vh] resize-y rounded-[var(--radius-md)] border border-[var(--outline)] bg-[var(--surface-2)] px-4 py-3 text-[14px] text-[var(--on-surface)] placeholder:text-[var(--on-surface-muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              rows={4}
            />
            <input
              ref={importFileInputRef}
              type="file"
              accept=".txt,.csv,.xlsx,.xls,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleImportFileChange}
            />
            <Button type="button" variant="outline" size="sm" className="w-full shrink-0 rounded-[var(--radius-sm)]" onClick={() => importFileInputRef.current?.click()}>
              <Upload className="mr-2 h-3.5 w-3.5" />
              选择文件
            </Button>
          </div>
          <div className="mt-2 shrink-0 flex justify-end gap-2 pb-[env(safe-area-inset-bottom)]">
            <Button type="button" variant="outline" size="sm" onClick={resetImport} className="rounded-[var(--radius-sm)]">取消</Button>
            <Button size="sm" onClick={handleImportStudents} disabled={!importText.trim() || importSubmitting} className="rounded-[var(--radius-sm)]">
              {importSubmitting ? '导入中…' : `导入（${parseImportNames(importText).length} 人）`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑学生弹窗 */}
      <Dialog open={!!editStudentId} onOpenChange={(open) => { if (!open) { setEditStudentId(null); setEditName('') } }}>
        <DialogContent>
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-dialog-title text-[var(--on-surface)]">编辑学生</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">修改姓名</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Input placeholder="姓名" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEditStudent()} autoFocus className="h-11 rounded-[var(--radius-sm)] border-[var(--outline)] bg-[var(--surface-2)] text-[15px]" />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditStudentId(null); setEditName('') }} className="rounded-[var(--radius-sm)]">取消</Button>
            <Button size="sm" onClick={handleSaveEditStudent} disabled={!editName.trim()} className="rounded-[var(--radius-sm)]">保存</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 重置考勤确认 */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle className="text-dialog-title text-[var(--on-surface)] block text-center">确定重置考勤？</AlertDialogTitle>
            <AlertDialogDescription className="text-caption text-[var(--on-surface-muted)]">所有学生状态将重设为「未到」。</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleReset}>确定重置</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除学生确认 */}
      <AlertDialog open={!!deleteStudentId} onOpenChange={(open) => !open && setDeleteStudentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle className="text-dialog-title text-[var(--on-surface)] block text-center">确定删除该学生？</AlertDialogTitle>
            <AlertDialogDescription className="text-caption text-[var(--on-surface-muted)]">删除后不可恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDeleteStudent}>删除</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 添加公告 Dialog */}
      <Dialog open={addAnnouncementOpen} onOpenChange={handleAddAnnouncementDialogClose}>
        <DialogContent className="max-h-[min(56vh,50dvh)]">
          <DialogHeader className="shrink-0 text-center sm:text-center">
            <DialogTitle className="text-dialog-title text-[var(--on-surface)]">添加公告</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">可添加多条，将在点名页顶部显示</DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2 min-h-0 flex-1 overflow-y-auto">
            {announcementRows.map((value, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder={`公告 ${index + 1}`}
                  value={value}
                  onChange={(e) => setAnnouncementRow(index, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAnnouncementRow())}
                  className="h-11 flex-1 rounded-[var(--radius-sm)] border-[var(--outline)] bg-[var(--surface-2)] text-[15px] placeholder:text-[var(--on-surface-muted)] focus-visible:ring-1 focus-visible:ring-[var(--primary)]/30"
                />
                {announcementRows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeAnnouncementRow(index)}
                    aria-label="删除本条"
                    className="h-11 w-11 shrink-0 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--on-surface-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--on-surface)] transition-colors"
                  >
                    <X className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAnnouncementRow}
              className="w-full rounded-[var(--radius-sm)] border-dashed text-caption text-[var(--on-surface-muted)] hover:bg-[var(--surface-2)] hover:border-[var(--outline)]"
            >
              <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
              添加一条
            </Button>
          </div>
          {/* 有效期 */}
          <div className="shrink-0 flex overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-1">
            {(['today', 'permanent'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAnnouncementExpiry(t)}
                className={`flex-1 rounded-[9px] py-2 text-[13px] font-semibold transition-all duration-150 ${
                  announcementExpiry === t
                    ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
                    : 'text-[var(--on-surface-muted)]'
                }`}
              >
                {t === 'today' ? '今日有效' : '永久'}
              </button>
            ))}
          </div>
          <div className="mt-4 flex shrink-0 justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleAddAnnouncementCancelClick} className="rounded-[var(--radius-sm)]">取消</Button>
            <Button
              size="sm"
              disabled={!announcementRows.some((r) => r.trim()) || announcementSubmitting}
              onClick={handlePublishAnnouncement}
              className="rounded-[var(--radius-sm)] disabled:opacity-40"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
              发布
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加公告 - 取消确认 */}
      <AlertDialog open={addAnnouncementCancelConfirmOpen} onOpenChange={setAddAnnouncementCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dialog-title text-[var(--on-surface)] text-center">放弃当前内容？</AlertDialogTitle>
            <AlertDialogDescription className="text-caption text-[var(--on-surface-muted)] text-center">未发布的公告将不会保存</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-5 flex justify-center gap-3">
            <AlertDialogCancel>再想想</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddAnnouncementCancel}>确定放弃</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 统计与控制：一张卡片，头部行 + 公告内容区（展开为浮层，不占文档流） */}
      <div
        className="sticky z-20 mb-2 overflow-visible transition-shadow duration-200"
        style={{ top: 'var(--space-12, 12px)' }}
      >
        {/* 头部行：时段 + 统计 + 公告按钮（收起时用透明 border-b 占位，避免展开/收起时高度变化导致列表位移） */}
        <div
          className={cn(
            'flex items-center gap-2 overflow-hidden bg-[var(--surface)] px-3 py-2.5 shadow-[0_1px_0_rgba(60,60,67,0.06)]',
            announcementExpanded ? 'rounded-t-[16px] border-b border-[var(--outline-variant)]' : 'rounded-[16px] border-b border-transparent'
          )}
        >
          <span className="shrink-0 rounded-full bg-[var(--surface-2)] py-1 px-2.5 text-[12px] font-semibold text-[var(--on-surface-muted)]">
            {PERIOD_NAMES[period]}
          </span>
          {students.length > 0 && (
            <>
              <span className="h-3 w-px shrink-0 bg-[var(--outline-variant)]" aria-hidden />
              <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter(null)}
                  className={cn(
                    'flex shrink-0 items-baseline gap-1 rounded-full px-1.5 py-0.5 transition-colors active:opacity-80',
                    statusFilter === null && 'bg-[var(--surface-2)]'
                  )}
                  aria-pressed={statusFilter === null}
                  aria-label="筛选：全部"
                >
                  <span className="tabular-nums text-[13px] font-semibold text-[var(--on-surface)]">{students.length}</span>
                  <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--on-surface-muted)]">应到</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 1 ? null : 1)}
                  className={cn(
                    'flex shrink-0 items-baseline gap-1 rounded-full px-1.5 py-0.5 transition-colors active:opacity-80',
                    statusFilter === 1 && 'bg-[var(--success-container)]'
                  )}
                  aria-pressed={statusFilter === 1}
                  aria-label="筛选：实到"
                >
                  <span className="tabular-nums text-[13px] font-semibold text-[var(--success)]">{presentCount}</span>
                  <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--success)]/70">实到</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 0 ? null : 0)}
                  className={cn(
                    'flex shrink-0 items-baseline gap-1 rounded-full px-1.5 py-0.5 transition-colors active:opacity-80',
                    statusFilter === 0 && 'bg-[var(--error-container)]'
                  )}
                  aria-pressed={statusFilter === 0}
                  aria-label="筛选：未到"
                >
                  <span className="tabular-nums text-[13px] font-semibold text-[var(--error)]">{absentCount}</span>
                  <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--error)]/70">未到</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 2 ? null : 2)}
                  className={cn(
                    'flex shrink-0 items-baseline gap-1 rounded-full px-1.5 py-0.5 transition-colors active:opacity-80',
                    statusFilter === 2 && 'bg-[var(--leave-container)]'
                  )}
                  aria-pressed={statusFilter === 2}
                  aria-label="筛选：请假"
                >
                  <span className="tabular-nums text-[13px] font-semibold text-[var(--leave)]">{leaveCount}</span>
                  <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--leave)]/70">请假</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 3 ? null : 3)}
                  className={cn(
                    'flex shrink-0 items-baseline gap-1 rounded-full px-1.5 py-0.5 transition-colors active:opacity-80',
                    statusFilter === 3 && 'bg-[var(--late-container)]'
                  )}
                  aria-pressed={statusFilter === 3}
                  aria-label="筛选：晚到"
                >
                  <span className="tabular-nums text-[13px] font-semibold text-[var(--late)]">{lateCount}</span>
                  <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--late)]/70">晚到</span>
                </button>
              </div>
            </>
          )}
          <div className="flex shrink-0 items-center gap-1.5">
            {showEditStudent && (
              <button
                type="button"
                onClick={() => { setShowEditStudent(false); showToast('已保存', { variant: 'success', duration: 1800 }) }}
                className="text-[13px] font-semibold text-[var(--primary)] active:opacity-60"
              >
                完成
              </button>
            )}
            <button
              type="button"
              onClick={() => setAnnouncementExpanded((e) => !e)}
              className={cn(
                'flex items-center gap-1 rounded-full py-1.5 pl-2.5 pr-2 text-[12px] font-semibold active:opacity-70',
                announcementExpanded ? 'bg-[var(--surface-2)] text-[var(--on-surface)]' : 'bg-[var(--surface-2)] text-[var(--on-surface-variant)]'
              )}
              aria-expanded={announcementExpanded}
              aria-label={announcementExpanded ? '收起公告' : '展开公告'}
            >
              <Megaphone className="h-3.5 w-3.5 shrink-0 text-[var(--on-surface-muted)]" strokeWidth={1.5} />
              <span>公告</span>
              <span className="text-[11px] font-medium text-[var(--on-surface-muted)]">
                {announcements.length}
              </span>
              <ChevronDown
                className={cn(
                  'h-3 w-3 shrink-0 text-[var(--on-surface-muted)] transition-transform duration-200',
                  announcementExpanded && 'rotate-180'
                )}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>

        {/* 公告内容区：浮层展示，展开/收起动画，不占文档流 */}
        <div
          className={cn(
            'absolute left-0 right-0 top-full z-10 overflow-hidden rounded-b-[16px] border-x border-b border-[var(--outline-variant)] bg-[var(--surface)] shadow-[0_1px_0_rgba(60,60,67,0.06),0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out',
            announcementExpanded
              ? 'max-h-[300px] opacity-100'
              : 'max-h-0 opacity-0 pointer-events-none'
          )}
        >
          {announcements.length > 0 ? (
            <div className="px-3 py-3">
              <ul className="space-y-1.5 max-h-[240px] overflow-y-auto">
                {announcements.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)]/80 py-1.5 pl-3 pr-2"
                  >
                    <span className="min-w-0 flex-1 break-words text-[14px] leading-snug text-[var(--on-surface)]">
                      {a.content}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium',
                        a.expirationType === 'permanent'
                          ? 'bg-[var(--surface-2)] text-[var(--on-surface-muted)]'
                          : 'bg-[var(--primary-container)] text-[var(--primary)]'
                      )}
                    >
                      {a.expirationType === 'permanent' ? '永久' : '今日'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAnnouncement(a.id)}
                      className="h-8 w-8 shrink-0 rounded-full p-0 text-[var(--on-surface-muted)] active:text-[var(--error)]"
                      aria-label="删除"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="px-3 py-4 text-center text-[13px] text-[var(--on-surface-muted)]">
              暂无公告
            </div>
          )}
        </div>
      </div>

      {/* 学生列表 */}
      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] bg-[var(--surface)] py-16 shadow-[0_1px_0_rgba(60,60,67,0.06)]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--surface-2)] text-[var(--on-surface-muted)]">
            <Users className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <p className="text-[17px] font-semibold tracking-tight text-[var(--on-surface)]">暂无学生</p>
          <p className="mt-1 text-[14px] text-[var(--on-surface-muted)]">请添加学生以开始点名</p>
          <Button
            className="mt-6 h-11 rounded-[var(--radius-md)] px-6 text-[15px] font-semibold active:scale-[0.96] active:opacity-90"
            onClick={() => setAddOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" strokeWidth={1.5} />
            添加学生
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
          <SortableContext items={students.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="overflow-hidden rounded-[24px] bg-[var(--surface)] shadow-[0_1px_0_rgba(60,60,67,0.06)]">
              <div ref={studentListRef} className="divide-y divide-[var(--outline-variant)]">
                {!oneColumn && (
                  <div className="flex items-center gap-2 px-5 py-2">
                    <div className="h-2.5 w-0.5 shrink-0 rounded-full bg-[var(--outline)]" />
                    <span className="text-[11px] font-semibold tracking-wider text-[var(--on-surface-muted)]">第一列</span>
                  </div>
                )}
                {studentsLeft.map((student) => (
                  <SortableStudentRow
                    key={student.id}
                    student={student}
                    index={getGlobalIndex(student.id)}
                    showEdit={showEditStudent}
                    showIndex={students.length > 1}
                    isAndroid={isAndroid}
                    onIndexChange={handleIndexChange}
                    onStatus={handleStatus}
                    onEdit={handleEditStudent}
                    onDelete={handleDeleteStudent}
                  />
                ))}
                {twoColumns && (
                  <>
                    <div className="flex items-center gap-2 px-5 py-2">
                      <div className="h-2.5 w-0.5 shrink-0 rounded-full bg-[var(--outline)]" />
                      <span className="text-[11px] font-semibold tracking-wider text-[var(--on-surface-muted)]">第二列</span>
                    </div>
                    {studentsCenter.map((student) => (
                      <SortableStudentRow
                        key={student.id}
                        student={student}
                        index={getGlobalIndex(student.id)}
                        showEdit={showEditStudent}
                        showIndex={students.length > 1}
                        isAndroid={isAndroid}
                        onIndexChange={handleIndexChange}
                        onStatus={handleStatus}
                        onEdit={handleEditStudent}
                        onDelete={handleDeleteStudent}
                      />
                    ))}
                  </>
                )}
                {threeColumns && (
                  <>
                    <div className="flex items-center gap-2 px-5 py-2">
                      <div className="h-2.5 w-0.5 shrink-0 rounded-full bg-[var(--outline)]" />
                      <span className="text-[11px] font-semibold tracking-wider text-[var(--on-surface-muted)]">第三列</span>
                    </div>
                    {studentsRight.map((student) => (
                      <SortableStudentRow
                        key={student.id}
                        student={student}
                        index={getGlobalIndex(student.id)}
                        showEdit={showEditStudent}
                        showIndex={students.length > 1}
                        isAndroid={isAndroid}
                        onIndexChange={handleIndexChange}
                        onStatus={handleStatus}
                        onEdit={handleEditStudent}
                        onDelete={handleDeleteStudent}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </>
  )
}
