import { useCallback, useState } from 'react'
import type { AnnouncementExpirationType } from '@/types'

export function useAttendanceAnnouncements() {
  const [announcementExpanded, setAnnouncementExpanded] = useState(false)
  const [addAnnouncementOpen, setAddAnnouncementOpen] = useState(false)
  const [addAnnouncementCancelConfirmOpen, setAddAnnouncementCancelConfirmOpen] = useState(false)
  const [announcementRows, setAnnouncementRows] = useState<string[]>([''])
  const [announcementExpiry, setAnnouncementExpiry] = useState<AnnouncementExpirationType>('today')
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false)

  const addAnnouncementRow = () => setAnnouncementRows((prev) => [...prev, ''])
  const removeAnnouncementRow = (index: number) =>
    setAnnouncementRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  const setAnnouncementRow = (index: number, value: string) =>
    setAnnouncementRows((prev) => prev.map((item, currentIndex) => (currentIndex === index ? value : item)))

  const closeAddAnnouncementDialog = useCallback(() => {
    setAnnouncementRows([''])
    setAddAnnouncementOpen(false)
  }, [])

  const hasAnnouncementDraft = announcementRows.some((item) => item.trim())

  const handleAddAnnouncementDialogClose = (open: boolean) => {
    if (open) {
      setAddAnnouncementOpen(true)
    } else if (hasAnnouncementDraft) {
      setAddAnnouncementCancelConfirmOpen(true)
    } else {
      closeAddAnnouncementDialog()
    }
  }

  return {
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
    addAnnouncementRow,
    removeAnnouncementRow,
    setAnnouncementRow,
    closeAddAnnouncementDialog,
    hasAnnouncementDraft,
    handleAddAnnouncementDialogClose,
  }
}
