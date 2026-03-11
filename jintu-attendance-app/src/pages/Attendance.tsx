import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { storage } from '@/store/storage'
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
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { arrayMove } from '@dnd-kit/sortable'
import {
  UserPlus,
  FileText,
  History as HistoryIcon,
  ClipboardCheck,
  CheckCircle,
  RefreshCw,
  Pencil,
  MoreHorizontal,
  ChevronDown,
  Upload,
} from 'lucide-react'
import { useClass } from '@/hooks/useClass'
import { useClassList } from '@/hooks/useClassList'
import { useAttendance } from '@/hooks/useAttendance'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { today } from '@/lib/date'
import { PERIOD_NAMES } from '@/lib/period'
import { buildReportText, getReportDateLabel } from '@/lib/reportText'
import { showToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { animateStagger } from '@/lib/gsap'
import AnnouncementPanel from '@/components/AnnouncementPanel'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Attendance() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const {
    classEntity,
    students,
    loading,
    refresh,
    setStudentAttendanceStatus,
    addStudent,
    updateOrder,
    updateStudentName,
    deleteStudent,
    updateClassName,
  } = useClass(classId)
  const { saveStatus, saveAllStatus, confirmReport, getCurrentPeriodId } = useAttendance(classId)
  const { list: announcements, add: addAnnouncement, remove: removeAnnouncement } = useAnnouncements(classId)
  const { list: classList } = useClassList()

  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addedNamesInSession, setAddedNamesInSession] = useState<string[]>([])
  const addNameInputRef = useRef<HTMLInputElement>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importSubmitting, setImportSubmitting] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportConfirming, setReportConfirming] = useState(false)
  const [editStudentId, setEditStudentId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showEditStudent, setShowEditStudent] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null)
  const [inlineClassName, setInlineClassName] = useState('')
  const [editingClassName, setEditingClassName] = useState(false)
  const classNameInputRef = useRef<HTMLInputElement>(null)
  const [showBottomBar, setShowBottomBar] = useState(true)
  const lastPeriodCheckRef = useRef<{ classId: string; period: number } | null>(null)
  const [isAndroid, setIsAndroid] = useState(false)
  const studentListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    import('@capacitor/core').then(({ Capacitor }) => setIsAndroid(Capacitor.getPlatform() === 'android')).catch(() => {})
  }, [])

  useEffect(() => {
    if (loading || students.length === 0) return
    const revert = animateStagger(studentListRef.current, ':scope > div')
    return revert
  }, [loading, students.length])

  useEffect(() => {
    if (classEntity?.name != null) setInlineClassName(classEntity.name)
  }, [classEntity?.name])

  const period = getCurrentPeriodId()

  // 添加学生弹窗打开时聚焦姓名输入框，便于连续添加
  useEffect(() => {
    if (addOpen) {
      const t = setTimeout(() => addNameInputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [addOpen])

  // 不超过 21 人不分列；20–30 人分两列；30 人以上分三列
  const total = students.length
  const oneColumn = total < 21
  const twoColumns = total >= 21 && total <= 30
  const threeColumns = total > 30
  const leftCountTwo = twoColumns ? Math.ceil(total / 2) : 0
  const leftCountThree = threeColumns ? Math.ceil(total / 3) : 0
  const centerCountThree = threeColumns ? Math.ceil((total - leftCountThree) / 2) : 0
  const studentsLeft = oneColumn ? students : twoColumns
    ? students.slice(0, leftCountTwo)
    : students.slice(0, leftCountThree)
  const studentsCenter = twoColumns ? students.slice(leftCountTwo) : threeColumns ? students.slice(leftCountThree, leftCountThree + centerCountThree) : []
  const studentsRight = threeColumns ? students.slice(leftCountThree + centerCountThree) : []

  // 时段自动重置提示（仅当 classId 或 period 实际变化时检测，避免添加学生等操作误触）
  useEffect(() => {
    if (!classId || students.length === 0) return
    const prev = lastPeriodCheckRef.current
    const periodChanged = prev === null || prev.classId !== classId || prev.period !== period
    lastPeriodCheckRef.current = { classId, period }
    const dateStr = today()
    const key = `last_period_${classId}_${dateStr}`
    const last = sessionStorage.getItem(key)
    const current = String(period)
    // 晚二时段内不提示「考勤已重置」，其余时段切换时提示
    if (periodChanged && last !== null && last !== current && period !== 3) {
      if (typeof document !== 'undefined') {
        const cleanupRef = { current: undefined as (() => void) | undefined }
        cleanupRef.current = showToast(`已进入${PERIOD_NAMES[period]}时段，考勤已重置`, { duration: 3500 })
        return () => cleanupRef.current?.()
      }
    }
    sessionStorage.setItem(key, current)
  }, [classId, period, students.length])

  const presentCount = students.filter((s) => s.attendanceStatus === 1).length
  const leaveCount = students.filter((s) => s.attendanceStatus === 2).length
  const lateCount = students.filter((s) => s.attendanceStatus === 3).length

  const handleStatus = useCallback(
    (studentId: string, status: number) => {
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

  /** 解析导入文本：按行分割，去空白，去重，过滤空串 */
  const parseImportNames = (text: string): string[] => {
    return [...new Set(text.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean))]
  }

  const handleImportStudents = async () => {
    const names = parseImportNames(importText)
    if (names.length === 0 || importSubmitting || !classId) return
    setImportSubmitting(true)
    try {
      for (const name of names) await addStudent(name)
      await refresh()
      setImportText('')
      setImportOpen(false)
      showToast(`已导入 ${names.length} 人`, { variant: 'success', duration: 2000 })
    } finally {
      setImportSubmitting(false)
    }
  }

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const wb = XLSX.read(data, { type: 'array' })
        const firstSheet = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 })
        let nameColIndex = 0
        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const row = rows[r]
          if (!Array.isArray(row)) continue
          const idx = row.findIndex((cell) => String(cell ?? '').trim() === '姓名')
          if (idx >= 0) {
            nameColIndex = idx
            break
          }
        }
        const names: string[] = []
        for (const row of rows) {
          if (!Array.isArray(row) || row.length <= nameColIndex) continue
          const cell = row[nameColIndex]
          const s = typeof cell === 'string' ? cell.trim() : String(cell ?? '').trim()
          if (!s || s === '姓名') continue
          if (nameColIndex === 0 && /^\d+$/.test(s)) continue
          names.push(s)
        }
        setImportText((prev) => (prev ? `${prev}\n${names.join('\n')}` : names.join('\n')))
      } catch (err) {
        console.warn('Excel 解析失败', err)
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

  const handleBlurClassName = async () => {
    setEditingClassName(false)
    const name = inlineClassName.trim()
    if (!name || name === classEntity?.name) return
    await updateClassName(name)
    showToast('班级名已更新', { variant: 'success', duration: 1800 })
  }

  const handleStartEditClassName = () => {
    setEditingClassName(true)
    setTimeout(() => classNameInputRef.current?.focus(), 0)
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

  /** 与 admin 一致：通过输入序号调整学生排序（1-based 输入） */
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

  const handleMarkAllPresent = async () => {
    const unarrived = students.filter((s) => s.attendanceStatus === 0)
    if (unarrived.length === 0) return
    const next: Record<string, number> = {}
    for (const s of students) next[s.id] = unarrived.some((u) => u.id === s.id) ? 1 : s.attendanceStatus
    await saveAllStatus(next)
    await refresh()
  }

  const handleReset = async () => {
    const next = students.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {} as Record<string, number>)
    await saveAllStatus(next)
    await refresh()
    setResetDialogOpen(false)
  }

  const reportText = classEntity
    ? buildReportText(classEntity.name, students, period)
    : ''

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

  const getGlobalIndex = (studentId: string) => {
    const i = students.findIndex((s) => s.id === studentId)
    return i === -1 ? 0 : i + 1
  }

  if (loading || !classEntity) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <header
          className="glass-bar sticky top-0 z-50 flex h-14 items-center gap-2 border-b border-[var(--outline-variant)] px-[var(--page-x)] py-2 shadow-elevation-1"
          style={{ paddingTop: 'var(--safe-top)', minHeight: 'calc(56px + var(--safe-top))' }}
        >
          <div className="h-10 w-10 shrink-0" aria-hidden />
          <h1 className="min-w-0 flex-1 truncate text-title font-semibold text-[var(--on-surface)]">点名</h1>
        </header>
        <main className="flex min-h-[200px] items-center justify-center px-[var(--page-x)] py-4">
          <p className="text-label text-[var(--on-surface-muted)]">{loading ? '' : '班级不存在'}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* 考勤报告弹窗 */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[66.67vh] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border-0 p-0 shadow-elevation-2">
          <DialogHeader className="shrink-0 border-b border-[var(--outline-variant)] bg-[var(--surface)] px-4 py-4 text-center sm:text-center">
            <DialogTitle className="text-title text-[var(--on-surface)] block text-center">考勤报告</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">{getReportDateLabel(period)}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <pre className="whitespace-pre-wrap font-mono text-label leading-relaxed text-[var(--on-surface)]">{reportText}</pre>
          </div>
          <DialogFooter className="shrink-0 flex justify-end gap-2 border-t border-[var(--outline-variant)] bg-[var(--surface)] px-4 py-3">
            <Button variant="outline" size="sm" onClick={() => setReportOpen(false)} className="rounded-[var(--radius-sm)] h-8 px-3 border-[var(--outline)] text-[var(--on-surface)] text-caption">取消</Button>
            <Button size="sm" onClick={handleConfirmReport} disabled={reportConfirming} className="rounded-[var(--radius-sm)] h-8 px-3 bg-[var(--primary)] !text-white text-tiny [&_svg]:!text-white">
              {reportConfirming ? <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />}
              {reportConfirming ? '保存中…' : '复制并分享'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 顶栏 · 班级名称加粗靠左，切换班级单独 */}
      <header
        className="glass-bar sticky top-0 z-50 flex flex-col border-b border-[var(--outline-variant)] shadow-elevation-1"
        style={{ paddingTop: 'var(--safe-top)', minHeight: 'calc(56px + var(--safe-top))' }}
      >
        <div className="flex min-h-14 items-center justify-between gap-2 border-b border-[var(--outline-variant)] px-[var(--page-x)] py-2">
          <div className="min-w-0 flex-1">
            {editingClassName ? (
              <input
                ref={classNameInputRef}
                type="text"
                value={inlineClassName}
                onChange={(e) => setInlineClassName(e.target.value)}
                onBlur={handleBlurClassName}
                onKeyDown={(e) => { if (e.key === 'Enter') classNameInputRef.current?.blur() }}
                className="w-full truncate border-0 border-b border-[var(--on-surface)] bg-transparent py-2 pr-2 text-left text-body font-bold text-[var(--on-surface)] outline-none placeholder:text-[var(--on-surface-muted)]"
                placeholder="班级名"
              />
            ) : (
              <button
                type="button"
                onClick={handleStartEditClassName}
                className="w-full truncate py-2 pr-2 text-left text-body font-bold text-[var(--on-surface)] outline-none active:opacity-80"
                aria-label="点击修改班级名称"
              >
                {inlineClassName || classEntity?.name || '班级名'}
              </button>
            )}
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--outline-variant)] bg-[var(--surface-2)] py-2 pl-3 pr-3 text-caption text-[var(--on-surface-variant)] active:bg-[var(--surface-hover)]"
              >
                <ChevronDown className="h-4 w-4" />
                切换班级
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[60vh] min-w-[10rem] overflow-auto">
              {classList.map((cls) => (
                <DropdownMenuItem
                  key={cls.id}
                  onSelect={(e) => {
                    e.preventDefault()
                    if (cls.id === classId) return
                    storage.saveCurrentClassId(cls.id)
                    showToast(`已切换到 ${cls.name}`, { variant: 'success', duration: 1800 })
                    navigate(`/attendance/${cls.id}`, { replace: true })
                  }}
                  disabled={cls.id === classId}
                  className={cls.id === classId ? 'bg-[var(--surface-2)]' : ''}
                >
                  {cls.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex shrink-0 items-center gap-2">
            {showEditStudent && (
              <Button variant="outline" size="sm" className="h-5 min-h-0 rounded-sm border-[var(--outline)] px-1 text-[10px] font-medium text-[var(--on-surface-muted)] active:scale-95" onClick={() => { setShowEditStudent(false); showToast('已保存', { variant: 'success', duration: 1800 }) }}>修改保存</Button>
            )}
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
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setAddOpen(true) }}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  添加学生
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setImportOpen(true) }}>
                  <Upload className="mr-2 h-4 w-4" />
                  导入学生
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowEditStudent(true) }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  修改学生
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); if (classId) navigate(`/history/${classId}`) }}>
                  <HistoryIcon className="mr-2 h-4 w-4" />
                  历史考勤
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* 公告：放在顶栏内，不随滚动；展开为浮层不占位 */}
        <AnnouncementPanel
          list={announcements}
          onAdd={(content, type) => addAnnouncement(content, type)}
          onDelete={removeAnnouncement}
        />
      </header>

      {/* 主体：单列列表 */}
      <main
        className="px-[var(--page-x)] pt-4"
        style={{ paddingBottom: 'calc(220px + 56px + env(safe-area-inset-bottom, 0px))' }}
      >
        {students.length === 0 ? (
          <div className="card-soft py-12 text-center">
            <p className="text-label text-[var(--on-surface-variant)]">暂无学生</p>
            <p className="mt-1 text-tiny text-[var(--on-surface-muted)]">点击下方按钮添加学生</p>
            <Button
              className="mt-6 h-9 rounded-[var(--radius-md)] bg-[var(--primary)] px-3 text-caption font-semibold text-[var(--on-primary)] shadow-elevation-1 active:scale-[0.98]"
              onClick={() => setAddOpen(true)}
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              添加学生
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
            <SortableContext items={students.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="card-soft overflow-hidden">
                {/* 表头：修改学生时隐藏考勤状态列 */}
                <div className={cn('grid gap-x-4 gap-y-2 border-b border-[var(--outline-variant)] pl-3 pr-10 py-2.5 font-medium uppercase tracking-wider text-[var(--on-surface-muted)]', showEditStudent ? 'grid-cols-[45px_minmax(2.5rem,1fr)]' : 'grid-cols-[45px_minmax(2.5rem,1fr)_auto]')}>
                  <div className="text-center text-tiny">{students.length > 1 ? '#' : ''}</div>
                  <div className="pl-6 text-label whitespace-nowrap">姓名</div>
                  {!showEditStudent && <div className="text-center text-label">考勤状态</div>}
                </div>
                {/* 所有可排序行在同一容器内，保证拖拽与碰撞检测生效 */}
                <div ref={studentListRef} className="divide-y divide-[var(--outline-variant)]">
                  {!oneColumn && (
                    <div className="flex items-center gap-2 px-2 py-1.5 text-label font-semibold text-[var(--on-surface)]">
                      <div className="h-4 w-1 shrink-0 rounded-full bg-[var(--outline)]" />
                      <span>第一列</span>
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
                      <div className="flex items-center gap-2 px-2 py-1.5 text-label font-semibold text-[var(--on-surface)]">
                        <div className="h-4 w-1 shrink-0 rounded-full bg-[var(--outline)]" />
                        <span>第二列</span>
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
                      <div className="flex items-center gap-2 px-2 py-1.5 text-label font-semibold text-[var(--on-surface)]">
                        <div className="h-4 w-1 shrink-0 rounded-full bg-[var(--outline)]" />
                        <span>第二列</span>
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
                      <div className="flex items-center gap-2 px-2 py-1.5 text-label font-semibold text-[var(--on-surface)]">
                        <div className="h-4 w-1 shrink-0 rounded-full bg-[var(--outline)]" />
                        <span>第三列</span>
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
      </main>

      {/* 底栏：用 Portal 挂到 body；返回时先隐藏再导航，避免随页面滑出才消失 */}
      {showBottomBar && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-x-0 z-40 px-[var(--page-x)] pt-3 pb-3"
            style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="glass-bar rounded-[var(--radius-xl)] border shadow-elevation-2">
              <div className="px-4 py-3">
                {/* 应到 / 实到 / 请假 / 晚到：2x2 网格 */}
                <div className="mb-3 grid grid-cols-4 gap-2 rounded-[var(--radius-lg)] bg-[var(--surface-2)] py-2.5 px-2">
                  <div className="stat-pill flex flex-col items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--outline-variant)] py-2">
                    <span className="text-tiny text-[var(--on-surface-muted)]">应到</span>
                    <span className="text-label tabular-nums font-semibold text-[var(--on-surface)]">{students.length}</span>
                  </div>
                  <div className="stat-pill flex flex-col items-center justify-center rounded-[var(--radius-md)] bg-[var(--success-container)]/60 py-2">
                    <span className="text-tiny text-[var(--success)]">实到</span>
                    <span className="text-label tabular-nums font-semibold text-[var(--success)]">{presentCount}</span>
                  </div>
                  <div className="stat-pill flex flex-col items-center justify-center rounded-[var(--radius-md)] bg-[var(--leave-container)]/60 py-2">
                    <span className="text-tiny text-[var(--leave)]">请假</span>
                    <span className="text-label tabular-nums font-semibold text-[var(--leave)]">{leaveCount}</span>
                  </div>
                  <div className="stat-pill flex flex-col items-center justify-center rounded-[var(--radius-md)] bg-[var(--late-container)]/60 py-2">
                    <span className="text-tiny text-[var(--late)]">晚到</span>
                    <span className="text-label tabular-nums font-semibold text-[var(--late)]">{lateCount}</span>
                  </div>
                </div>
                {/* 生成报告：独占一行 */}
                <Button className="mb-2 h-10 w-full rounded-[var(--radius-md)] bg-[var(--primary)] text-label font-semibold text-[var(--on-primary)] shadow-elevation-1 active:scale-[0.98]" onClick={() => setReportOpen(true)}>
                  <FileText className="mr-1.5 h-4 w-4 shrink-0" /> 生成报告
                </Button>
                {/* 全员到齐 / 重置考勤 */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="h-10 min-w-0 flex-1 rounded-[var(--radius-md)] border-[var(--outline)] text-caption font-medium text-[var(--success)]" onClick={handleMarkAllPresent}>
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5 shrink-0" /> 全员到齐
                  </Button>
                  <Button variant="outline" className="h-10 min-w-0 flex-1 rounded-[var(--radius-md)] border-[var(--outline)] text-caption font-medium text-[var(--on-surface-variant)]" onClick={() => setResetDialogOpen(true)}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 shrink-0" /> 重置
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 添加学生弹窗 */}
      <Dialog open={addOpen} onOpenChange={handleCloseAddDialog}>
        <DialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[66.67vh] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-6 shadow-elevation-2">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-title text-[var(--on-surface)] block text-center">添加学生</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">填写姓名，可连续添加多个</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="flex gap-2">
              <Input ref={addNameInputRef} placeholder="姓名" value={addName} onChange={(e) => setAddName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStudent())} autoFocus className="h-8 flex-1 rounded-[var(--radius-sm)] border-[var(--outline)] bg-[var(--surface)] py-0 text-caption" />
              <Button type="button" size="sm" onClick={handleAddStudent} onMouseDown={(e) => e.preventDefault()} disabled={!addName.trim() || addSubmitting} className="h-8 shrink-0 rounded-[var(--radius-sm)] bg-[var(--primary)] px-3 !text-white text-caption">{addSubmitting ? '…' : '添加'}</Button>
            </div>
          </div>
          {addedNamesInSession.length > 0 && (
            <div className="min-h-0 flex-1 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--outline-variant)] bg-[var(--surface-2)] px-3 py-2">
              <p className="mb-1.5 text-caption text-[var(--on-surface-muted)]">本批已添加（{addedNamesInSession.length} 人）</p>
              <ul className="space-y-1">
                {addedNamesInSession.map((name, i) => (
                  <li key={`${i}-${name}`} className="flex items-center gap-2 text-caption text-[var(--on-surface)]">
                    <span className="w-5 shrink-0 tabular-nums text-[var(--on-surface-muted)]">{i + 1}.</span>
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => handleCloseAddDialog(false)} className="rounded-[var(--radius-sm)] h-8 px-3 border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] text-caption">完成</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 导入学生弹窗：内容可滚动，避免 Android 键盘挡住底部按钮 */}
      <Dialog open={importOpen} onOpenChange={(open) => { if (!open) { setImportOpen(false); setImportText('') } }}>
        <DialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[min(70vh,75dvh)] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-6 shadow-elevation-2">
          <DialogHeader className="shrink-0 text-center sm:text-center">
            <DialogTitle className="text-title text-[var(--on-surface)] block text-center">导入学生</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">每行一个姓名，可粘贴或选择 txt/csv/Excel 文件（Excel 取第一列）</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 py-2 flex flex-col gap-2">
            <textarea
              placeholder={'张三\n李四\n王五'}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="min-h-[100px] w-full max-h-[40vh] resize-y rounded-[var(--radius-sm)] border border-[var(--outline)] bg-[var(--surface-2)] px-3 py-2 text-caption text-[var(--on-surface)] placeholder:text-[var(--on-surface-muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              rows={4}
            />
            <input
              ref={importFileInputRef}
              type="file"
              accept=".txt,.csv,.xlsx,.xls,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleImportFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full shrink-0 rounded-[var(--radius-sm)] border-[var(--outline)] text-caption"
              onClick={() => importFileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-3.5 w-3.5" />
              选择文件
            </Button>
          </div>
          <div className="mt-2 shrink-0 flex justify-end gap-2 pb-[env(safe-area-inset-bottom)]">
            <Button type="button" variant="outline" size="sm" onClick={() => { setImportOpen(false); setImportText('') }} className="rounded-[var(--radius-sm)] h-8 px-3 border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] text-caption">取消</Button>
            <Button size="sm" onClick={handleImportStudents} disabled={!importText.trim() || importSubmitting} className="rounded-[var(--radius-sm)] h-8 px-3 bg-[var(--primary)] !text-white text-caption">
              {importSubmitting ? '导入中…' : `导入（${parseImportNames(importText).length} 人）`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑学生弹窗 */}
      <Dialog open={!!editStudentId} onOpenChange={(open) => { if (!open) { setEditStudentId(null); setEditName('') } }}>
        <DialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[66.67vh] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-6 shadow-elevation-2">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-title text-[var(--on-surface)] block text-center">编辑学生</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">修改姓名</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input placeholder="姓名" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEditStudent()} autoFocus className="h-[var(--touch-target)] rounded-[var(--radius-sm)] border-[var(--outline)] bg-[var(--surface)] text-body" />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditStudentId(null); setEditName('') }} className="rounded-[var(--radius-sm)] h-8 px-3 border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] text-caption">取消</Button>
            <Button size="sm" onClick={handleSaveEditStudent} disabled={!editName.trim()} className="rounded-[var(--radius-sm)] h-8 px-3 bg-[var(--primary)] !text-white text-tiny">保存</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 重置考勤确认 */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[66.67vh] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-6 shadow-elevation-2">
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle className="text-title text-[var(--on-surface)] block text-center">确定重置考勤？</AlertDialogTitle>
            <AlertDialogDescription className="text-caption text-[var(--on-surface-muted)]">所有学生状态将重设为「未到」。</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogCancel className="!h-8 min-h-0 rounded-[var(--radius-sm)] !border-[var(--outline)] !bg-[var(--surface)] px-3 py-0 text-caption !text-[var(--on-surface)]">取消</AlertDialogCancel>
            <AlertDialogAction className="!h-8 min-h-0 rounded-[var(--radius-sm)] border-0 !bg-[var(--primary)] px-3 py-0 !text-white text-caption" onClick={handleReset}>确定重置</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除学生确认 */}
      <AlertDialog open={!!deleteStudentId} onOpenChange={(open) => !open && setDeleteStudentId(null)}>
        <AlertDialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[66.67vh] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-6 shadow-elevation-2">
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle className="text-title text-[var(--on-surface)] block text-center">确定删除该学生？</AlertDialogTitle>
            <AlertDialogDescription className="text-caption text-[var(--on-surface-muted)]">删除后不可恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogCancel className="!h-8 min-h-0 rounded-[var(--radius-sm)] !border-[var(--outline)] !bg-[var(--surface)] px-3 py-0 text-caption !text-[var(--on-surface)]">取消</AlertDialogCancel>
            <AlertDialogAction className="!h-8 min-h-0 rounded-[var(--radius-sm)] border-0 !bg-[var(--primary)] px-3 py-0 !text-white text-caption" onClick={handleConfirmDeleteStudent}>删除</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
