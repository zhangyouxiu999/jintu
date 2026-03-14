import { useState, useEffect, useCallback } from 'react'
import type { AnnouncementEntity, AnnouncementExpirationType } from '@/types'
import * as announcementsStore from '@/store/announcements'

export function useAnnouncements(classId: string | undefined) {
  const [list, setList] = useState<AnnouncementEntity[]>([])

  const refresh = useCallback(async () => {
    if (!classId) {
      setList([])
      return
    }
    const data = await announcementsStore.getByClassId(classId)
    setList(data)
  }, [classId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = useCallback(
    async (
      content: string,
      expirationType: AnnouncementExpirationType,
      startsAt?: string,
      expiresAt?: string
    ) => {
      if (!classId) return
      let s: string | undefined
      let e: string | undefined
      if (expirationType === 'today') {
        const now = new Date()
        s = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
      } else if (expirationType === 'custom') {
        s = startsAt
        e = expiresAt
      }
      await announcementsStore.create(classId, content, expirationType, s, e)
      await refresh()
    },
    [classId, refresh]
  )

  const addMany = useCallback(
    async (
      contents: string[],
      expirationType: AnnouncementExpirationType,
      startsAt?: string,
      expiresAt?: string
    ) => {
      if (!classId) return
      const nonEmpty = contents.map((c) => c.trim()).filter(Boolean)
      if (nonEmpty.length === 0) return
      let s: string | undefined
      let e: string | undefined
      if (expirationType === 'today') {
        const now = new Date()
        s = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
      } else if (expirationType === 'custom') {
        s = startsAt
        e = expiresAt
      }
      await announcementsStore.createMany(classId, nonEmpty, expirationType, s, e)
      await refresh()
    },
    [classId, refresh]
  )

  const remove = useCallback(
    async (id: string) => {
      await announcementsStore.remove(id)
      await refresh()
    },
    [refresh]
  )

  return { list, refresh, add, addMany, remove }
}
