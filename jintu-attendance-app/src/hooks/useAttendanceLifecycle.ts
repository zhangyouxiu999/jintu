import { useEffect, useRef, useState } from 'react'
import { getCurrentResetSlot, getResetSlotLabel } from '@/lib/period'
import { showToast } from '@/lib/toast'
import { today } from '@/lib/date'
import { storage } from '@/store/storage'

interface UseAttendanceLifecycleParams {
  classId?: string
  period: number
  refresh: (silent?: boolean) => Promise<void>
}

export function useAttendanceLifecycle({
  classId,
  period,
  refresh,
}: UseAttendanceLifecycleParams) {
  const [slotReminderOpen, setSlotReminderOpen] = useState(false)
  const [slotReminderLabel, setSlotReminderLabel] = useState('')
  const isMountedRef = useRef(true)
  const appListenerRef = useRef<{ remove: () => Promise<void> } | null>(null)

  useEffect(() => {
    if (!classId) return
    const dateStr = today()
    const key = `last_seen_slot_${classId}_${dateStr}`
    const currentSlot = getCurrentResetSlot()
    if (currentSlot === null) return

    const lastSlot = sessionStorage.getItem(key)
    sessionStorage.setItem(key, currentSlot)

    if (lastSlot == null || lastSlot === currentSlot) return

    const label = getResetSlotLabel(currentSlot)
    if (storage.loadAutoResetAttendance()) {
      setSlotReminderLabel(label)
      setSlotReminderOpen(true)
    } else {
      showToast(`已进入${label}时段`, { duration: 2200 })
    }
  }, [classId, period])

  useEffect(() => {
    isMountedRef.current = true
    if (!classId) return

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh(true)
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    void import('@capacitor/core')
      .then(({ Capacitor }) => {
        if (!Capacitor.isNativePlatform()) return
        return import('@capacitor/app').then(({ App }) =>
          App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
              void refresh(true)
            }
          })
        )
      })
      .then((handle) => {
        if (handle && isMountedRef.current) appListenerRef.current = handle
        else handle?.remove?.()
      })
      .catch(() => {})

    return () => {
      isMountedRef.current = false
      document.removeEventListener('visibilitychange', onVisible)
      appListenerRef.current?.remove()
      appListenerRef.current = null
    }
  }, [classId, refresh])

  return {
    slotReminderOpen,
    setSlotReminderOpen,
    slotReminderLabel,
  }
}
