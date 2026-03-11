import type { AnnouncementEntity } from '@/types'
import { uuid } from './db'
import { storage } from './storage'

const map = new Map<string, AnnouncementEntity>()
const byClass = new Map<string, string[]>()

function persist(): void {
  const arr = Array.from(map.values())
  storage.saveAnnouncements(arr)
}

export async function getByClassId(classId: string): Promise<AnnouncementEntity[]> {
  const ids = byClass.get(classId) ?? []
  const now = new Date()
  return ids
    .map((id) => map.get(id))
    .filter((a): a is AnnouncementEntity => {
      if (!a) return false
      if (a.startsAt && new Date(a.startsAt) > now) return false
      if (a.expiresAt && new Date(a.expiresAt) < now) return false
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/** 从本地持久化恢复（启动时调用） */
export function hydrateFromPersisted(data: unknown): void {
  if (!Array.isArray(data)) return
  map.clear()
  byClass.clear()
  for (const item of data as AnnouncementEntity[]) {
    if (item?.id == null || item?.classId == null) continue
    map.set(item.id, item)
    const list = byClass.get(item.classId) ?? []
    list.push(item.id)
    byClass.set(item.classId, list)
  }
}

export async function insert(
  entity: Omit<AnnouncementEntity, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const now = new Date().toISOString()
  const full: AnnouncementEntity = { ...entity, createdAt: now, updatedAt: now }
  map.set(entity.id, full)
  const list = byClass.get(entity.classId) ?? []
  list.push(entity.id)
  byClass.set(entity.classId, list)
  persist()
}

export async function update(entity: AnnouncementEntity): Promise<void> {
  if (!map.has(entity.id)) return
  map.set(entity.id, { ...entity, updatedAt: new Date().toISOString() })
  persist()
}

/** 发布公告：仅需 content、classId、expirationType，可选 startsAt/expiresAt */
export async function create(
  classId: string,
  content: string,
  expirationType: 'today' | 'permanent' | 'custom',
  startsAt?: string,
  expiresAt?: string
): Promise<string> {
  const id = uuid()
  await insert({ id, classId, content: content.trim(), expirationType, startsAt, expiresAt })
  return id
}

export async function remove(id: string): Promise<void> {
  const a = map.get(id)
  if (!a) return
  map.delete(id)
  const list = byClass.get(a.classId) ?? []
  byClass.set(
    a.classId,
    list.filter((x) => x !== id)
  )
  persist()
}

export function clearAll(): void {
  map.clear()
  byClass.clear()
  persist()
}
