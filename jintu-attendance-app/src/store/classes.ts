import type { ClassEntity } from '@/types'
import { uuid } from './db'
import { storage } from './storage'

const map = new Map<string, ClassEntity>()

function persist(): void {
  const arr = Array.from(map.values())
  storage.saveClasses(arr)
}

export async function getAll(): Promise<ClassEntity[]> {
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

/** 从本地持久化恢复（启动时调用） */
export function hydrateFromPersisted(data: unknown): void {
  if (!Array.isArray(data)) return
  map.clear()
  for (const item of data as ClassEntity[]) {
    if (item?.id != null) map.set(item.id, item)
  }
}

export async function getById(id: string): Promise<ClassEntity | null> {
  return map.get(id) ?? null
}

export async function insert(entity: Omit<ClassEntity, 'createdAt' | 'updatedAt'>): Promise<void> {
  const now = new Date().toISOString()
  map.set(entity.id, {
    ...entity,
    studentOrder: entity.studentOrder ?? [],
    createdAt: now,
    updatedAt: now,
  })
  persist()
}

export async function update(entity: ClassEntity): Promise<void> {
  const existing = map.get(entity.id)
  if (!existing) return
  map.set(entity.id, {
    ...entity,
    updatedAt: new Date().toISOString(),
  })
  persist()
}

export async function remove(id: string): Promise<void> {
  map.delete(id)
  persist()
}

export function clearAll(): void {
  map.clear()
  persist()
}

/** 新增班级：仅需名称，返回新班级 id */
export async function create(name: string): Promise<string> {
  const id = uuid()
  await insert({
    id,
    name: name.trim(),
    studentOrder: [],
  })
  return id
}
