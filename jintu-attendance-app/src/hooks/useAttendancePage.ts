import { useCallback, useState } from 'react'
import type { AttendanceStatus, AttendanceStatusMap, Student } from '@/types'
import { showToast } from '@/lib/toast'
import { useAttendanceAnnouncements } from '@/hooks/useAttendanceAnnouncements'
import { useAttendanceFiltersAndVirtualList } from '@/hooks/useAttendanceFiltersAndVirtualList'
import { useAttendanceLifecycle } from '@/hooks/useAttendanceLifecycle'

export const ATTENDANCE_STATUS_META: Record<AttendanceStatus, {
  label: string
  activeClassName: string
  rowClassName: string
}> = {
  0: {
    label: '未到',
    activeClassName: '!border-[var(--on-surface-muted)] !bg-[var(--on-surface-muted)] !text-white',
    rowClassName: 'border-[var(--outline)]/85 bg-[var(--surface)]',
  },
  1: {
    label: '已到',
    activeClassName: '!border-[var(--success)] !bg-[var(--success)] !text-white',
    rowClassName: 'border-[var(--success)]/25 bg-[var(--success-container)]/32',
  },
  2: {
    label: '请假',
    activeClassName: '!border-[var(--leave)] !bg-[var(--leave)] !text-white',
    rowClassName: 'border-[var(--leave)]/22 bg-[var(--leave-container)]/30',
  },
  3: {
    label: '晚到',
    activeClassName: '!border-[var(--primary)] !bg-[var(--primary)] !text-white',
    rowClassName: 'border-[var(--late)]/22 bg-[var(--late-container)]/28',
  },
}

const STATUS_BUTTON_ORDER: AttendanceStatus[] = [1, 2, 3, 0]
export const ATTENDANCE_STATUS_OPTIONS = STATUS_BUTTON_ORDER.map((status) => ({
  status,
  label: ATTENDANCE_STATUS_META[status].label,
  activeClassName: ATTENDANCE_STATUS_META[status].activeClassName,
}))

interface UseAttendancePageParams {
  classId?: string
  period: number
  students: Student[]
  clearDraft: () => Promise<void>
  refresh: (silent?: boolean) => Promise<void>
  setAllAttendanceStatus: (statusMap: AttendanceStatusMap) => void
}

export function useAttendancePage({
  classId,
  period,
  students,
  clearDraft,
  refresh,
  setAllAttendanceStatus,
}: UseAttendancePageParams) {
  const [busyAction, setBusyAction] = useState<'all-present' | 'all-absent' | 'report' | null>(null)
  const [clearDraftDialogOpen, setClearDraftDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const filters = useAttendanceFiltersAndVirtualList(students)
  const announcements = useAttendanceAnnouncements()
  const lifecycle = useAttendanceLifecycle({ classId, period, refresh })

  const clearCurrentDraftState = useCallback(() => {
    return students.reduce<AttendanceStatusMap>((acc, student) => {
      acc[student.id] = 0
      return acc
    }, {})
  }, [students])

  const handleClearDraft = useCallback(async () => {
    const next = clearCurrentDraftState()
    await clearDraft()
    setAllAttendanceStatus(next)
    setClearDraftDialogOpen(false)
    lifecycle.setSlotReminderOpen(false)
    await refresh(true)
    showToast('已清空当前时段草稿', { variant: 'success', duration: 1800 })
  }, [clearCurrentDraftState, clearDraft, lifecycle, refresh, setAllAttendanceStatus])

  const runPageAction = useCallback(async (
    action: 'all-present' | 'all-absent' | 'report',
    handler: () => Promise<void>
  ) => {
    if (busyAction) return
    setBusyAction(action)
    try {
      await handler()
    } catch {
      const message = action === 'all-present'
        ? '设置全部已到失败，请重试'
        : action === 'all-absent'
          ? '设置全部未到失败，请重试'
          : '生成报告失败，请重试'
      showToast(message, { variant: 'error' })
    } finally {
      setBusyAction(null)
    }
  }, [busyAction])

  return {
    statusFilter: filters.statusFilter,
    setStatusFilter: filters.setStatusFilter,
    busyAction,
    clearDraftDialogOpen,
    setClearDraftDialogOpen,
    slotReminderOpen: lifecycle.slotReminderOpen,
    setSlotReminderOpen: lifecycle.setSlotReminderOpen,
    slotReminderLabel: lifecycle.slotReminderLabel,
    announcementExpanded: announcements.announcementExpanded,
    setAnnouncementExpanded: announcements.setAnnouncementExpanded,
    addAnnouncementOpen: announcements.addAnnouncementOpen,
    setAddAnnouncementOpen: announcements.setAddAnnouncementOpen,
    addAnnouncementCancelConfirmOpen: announcements.addAnnouncementCancelConfirmOpen,
    setAddAnnouncementCancelConfirmOpen: announcements.setAddAnnouncementCancelConfirmOpen,
    announcementRows: announcements.announcementRows,
    announcementExpiry: announcements.announcementExpiry,
    setAnnouncementExpiry: announcements.setAnnouncementExpiry,
    announcementSubmitting: announcements.announcementSubmitting,
    setAnnouncementSubmitting: announcements.setAnnouncementSubmitting,
    reportDialogOpen,
    setReportDialogOpen,
    listViewportRef: filters.listViewportRef,
    filterItems: filters.filterItems,
    visibleStudents: filters.visibleStudents,
    startIndex: filters.startIndex,
    topSpacerHeight: filters.topSpacerHeight,
    bottomSpacerHeight: filters.bottomSpacerHeight,
    handleClearDraft,
    setScrollTop: filters.setScrollTop,
    addAnnouncementRow: announcements.addAnnouncementRow,
    removeAnnouncementRow: announcements.removeAnnouncementRow,
    setAnnouncementRow: announcements.setAnnouncementRow,
    closeAddAnnouncementDialog: announcements.closeAddAnnouncementDialog,
    hasAnnouncementDraft: announcements.hasAnnouncementDraft,
    handleAddAnnouncementDialogClose: announcements.handleAddAnnouncementDialogClose,
    runPageAction,
  }
}
