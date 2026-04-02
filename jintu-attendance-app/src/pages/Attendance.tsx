import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { School } from 'lucide-react'
import AttendanceBottomBar from '@/components/attendance/AttendanceBottomBar'
import AttendanceDialogs from '@/components/attendance/AttendanceDialogs'
import AttendanceStudentList from '@/components/attendance/AttendanceStudentList'
import CollapsibleNoticeBar from '@/components/attendance/CollapsibleNoticeBar'
import { useClass } from '@/hooks/useClass'
import { useAttendance } from '@/hooks/useAttendance'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useAttendancePage } from '@/hooks/useAttendancePage'
import type { AttendanceStatus, AttendanceStatusMap } from '@/types'
import { buildReportText } from '@/lib/reportText'
import { showToast } from '@/lib/toast'
import { EmptyStateCard, LoadingStateCard } from '@/components/ui/mobile-ui'

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
  } = useClass(classId)
  const { saveStatus, saveAllStatus, clearDraft, getCurrentPeriodId } = useAttendance(classId)
  const { list: announcements, addMany: addAnnouncements, remove: removeAnnouncement } = useAnnouncements(classId)
  const period = getCurrentPeriodId()
  const reportText = buildReportText(classEntity?.name ?? '', students, period)

  const {
    setStatusFilter,
    busyAction,
    clearDraftDialogOpen,
    setClearDraftDialogOpen,
    slotReminderOpen,
    setSlotReminderOpen,
    slotReminderLabel,
    announcementExpanded,
    setAnnouncementExpanded,
    addAnnouncementOpen,
    setAddAnnouncementOpen,
    addAnnouncementCancelConfirmOpen,
    setAddAnnouncementCancelConfirmOpen,
    announcementRows,
    announcementExpiry,
    setAnnouncementExpiry,
    announcementSubmitting,
    setAnnouncementSubmitting,
    reportDialogOpen,
    setReportDialogOpen,
    listViewportRef,
    filterItems,
    visibleStudents,
    startIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    handleClearDraft,
    setScrollTop,
    addAnnouncementRow,
    removeAnnouncementRow,
    setAnnouncementRow,
    closeAddAnnouncementDialog,
    handleAddAnnouncementDialogClose,
    runPageAction,
  } = useAttendancePage({
    classId,
    period,
    students,
    clearDraft,
    refresh,
    setAllAttendanceStatus,
  })

  const handleStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    requestAnimationFrame(() => setStudentAttendanceStatus(studentId, status))
    void saveStatus(studentId, status).catch(() => {
      void refresh()
      showToast('保存失败，已恢复', { variant: 'error', duration: 2000 })
    })
  }, [refresh, saveStatus, setStudentAttendanceStatus])

  const handleMarkAllPresent = useCallback(async () => {
    const unarrived = students.filter((student) => student.attendanceStatus === 0)
    if (unarrived.length === 0) return
    const next: AttendanceStatusMap = {}
    for (const student of students) {
      next[student.id] = unarrived.some((item) => item.id === student.id) ? 1 : student.attendanceStatus
    }
    await saveAllStatus(next)
    setAllAttendanceStatus(next)
    showToast('已将未到学生标记为实到', { variant: 'success', duration: 1800 })
  }, [saveAllStatus, setAllAttendanceStatus, students])

  const handleMarkAllAbsent = useCallback(async () => {
    if (students.length === 0) return
    const next: AttendanceStatusMap = {}
    for (const student of students) {
      next[student.id] = 0
    }
    await saveAllStatus(next)
    setAllAttendanceStatus(next)
    showToast('已全部标记为未到', { variant: 'success', duration: 1800 })
  }, [saveAllStatus, setAllAttendanceStatus, students])

  const handlePublishAnnouncement = async () => {
    const contents = announcementRows.map((item) => item.trim()).filter(Boolean)
    if (!contents.length || announcementSubmitting) return
    setAnnouncementSubmitting(true)
    try {
      await addAnnouncements(contents, announcementExpiry)
      closeAddAnnouncementDialog()
      showToast('已发布公告', { variant: 'success', duration: 1800 })
    } finally {
      setAnnouncementSubmitting(false)
    }
  }

  const handleGenerateReport = () => void runPageAction('report', async () => {
    setReportDialogOpen(true)
  })

  if (loading || !classEntity) {
    return (
      loading
        ? <LoadingStateCard title="正在打开点名页" />
        : <EmptyStateCard icon={School} title="班级不存在" iconTone="primary" />
    )
  }

  return (
    <>
      <AttendanceDialogs
        slotReminderOpen={slotReminderOpen}
        setSlotReminderOpen={setSlotReminderOpen}
        slotReminderLabel={slotReminderLabel}
        clearDraftDialogOpen={clearDraftDialogOpen}
        setClearDraftDialogOpen={setClearDraftDialogOpen}
        onClearDraft={handleClearDraft}
        addAnnouncementOpen={addAnnouncementOpen}
        handleAddAnnouncementDialogClose={handleAddAnnouncementDialogClose}
        addAnnouncementCancelConfirmOpen={addAnnouncementCancelConfirmOpen}
        setAddAnnouncementCancelConfirmOpen={setAddAnnouncementCancelConfirmOpen}
        closeAddAnnouncementDialog={closeAddAnnouncementDialog}
        announcementRows={announcementRows}
        setAnnouncementRow={setAnnouncementRow}
        removeAnnouncementRow={removeAnnouncementRow}
        addAnnouncementRow={addAnnouncementRow}
        announcementExpiry={announcementExpiry}
        setAnnouncementExpiry={setAnnouncementExpiry}
        announcementSubmitting={announcementSubmitting}
        publishAnnouncementDisabled={!announcementRows.some((item) => item.trim())}
        onPublishAnnouncement={handlePublishAnnouncement}
        reportDialogOpen={reportDialogOpen}
        setReportDialogOpen={setReportDialogOpen}
        reportText={reportText}
        period={period}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 pb-[calc(108px+var(--safe-bottom))]">
        <CollapsibleNoticeBar
          announcements={announcements}
          expanded={announcementExpanded}
          onToggle={() => setAnnouncementExpanded((value) => !value)}
          onDelete={removeAnnouncement}
        />

        <AttendanceStudentList
          classId={classId}
          students={students}
          setStatusFilter={setStatusFilter}
          filterItems={filterItems}
          listViewportRef={listViewportRef}
          setScrollTop={setScrollTop}
          topSpacerHeight={topSpacerHeight}
          bottomSpacerHeight={bottomSpacerHeight}
          visibleStudents={visibleStudents}
          startIndex={startIndex}
          onSelect={handleStatus}
          onEmptyAction={() => navigate(`/students/${classId}`)}
        />
      </div>

      {students.length > 0 ? (
        <AttendanceBottomBar
          onAllPresent={() => void runPageAction('all-present', handleMarkAllPresent)}
          onAllAbsent={() => void runPageAction('all-absent', handleMarkAllAbsent)}
          onAnnouncement={() => setAddAnnouncementOpen(true)}
          onReport={handleGenerateReport}
          allPresentDisabled={students.length === 0}
          allAbsentDisabled={students.length === 0}
          announcementDisabled={false}
          reportDisabled={students.length === 0}
          busyAction={busyAction}
        />
      ) : null}
    </>
  )
}
