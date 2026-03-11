import { useState, useEffect, useCallback } from 'react'
import type { ClassEntity } from '@/types'
import * as classesStore from '@/store/classes'

export function useClassList() {
  const [list, setList] = useState<ClassEntity[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await classesStore.getAll()
    setList(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addClass = useCallback(async (name: string) => {
    const id = await classesStore.create(name)
    await refresh()
    return id
  }, [refresh])

  const deleteClass = useCallback(async (id: string) => {
    await classesStore.remove(id)
    await refresh()
  }, [refresh])

  const updateClass = useCallback(async (id: string, name: string) => {
    const cls = await classesStore.getById(id)
    if (!cls) return
    await classesStore.update({ ...cls, name: name.trim() })
    await refresh()
  }, [refresh])

  return { list, loading, refresh, addClass, deleteClass, updateClass }
}
