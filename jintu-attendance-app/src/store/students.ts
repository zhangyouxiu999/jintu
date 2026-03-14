import type { StudentEntity } from '@/types'
import { uuid } from './db'
import { storage } from './storage'

const map = new Map<string, StudentEntity>()
const byClass = new Map<string, string[]>()

function persist(): void {
  const arr = Array.from(map.values())
  storage.saveStudents(arr)
}

export async function getByClassId(classId: string): Promise<StudentEntity[]> {
  const ids = byClass.get(classId) ?? []
  return ids
    .map((id) => map.get(id))
    .filter((s): s is StudentEntity => s != null)
    .sort((a, b) => a.sortIndex - b.sortIndex)
}

/** 从本地持久化恢复（启动时调用） */
export function hydrateFromPersisted(data: StudentEntity[]): void {
  map.clear()
  byClass.clear()
  for (const item of data) {
    if (item?.id == null || item?.classId == null) continue
    map.set(item.id, item)
    const list = byClass.get(item.classId) ?? []
    list.push(item.id)
    byClass.set(item.classId, list)
  }
  // 按 sortIndex 稳定排序每个班级的 id 列表
  for (const [cid, ids] of byClass) {
    const entities = ids.map((id) => map.get(id)).filter((s): s is StudentEntity => s != null)
    entities.sort((a, b) => a.sortIndex - b.sortIndex)
    byClass.set(cid, entities.map((s) => s.id))
  }
}

export async function insert(
  entity: Omit<StudentEntity, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const now = new Date().toISOString()
  const full: StudentEntity = {
    ...entity,
    createdAt: now,
    updatedAt: now,
  }
  map.set(entity.id, full)
  const list = byClass.get(entity.classId) ?? []
  list.push(entity.id)
  byClass.set(entity.classId, list)
  persist()
}

/** 仅姓名 + classId，自动生成 id 与 sortIndex */
export async function addStudent(name: string, classId: string): Promise<string> {
  const list = await getByClassId(classId)
  const sortIndex = list.length
  const id = uuid()
  await insert({ id, name: name.trim(), classId, sortIndex })
  return id
}

export async function update(entity: StudentEntity): Promise<void> {
  const existing = map.get(entity.id)
  if (!existing) return
  map.set(entity.id, { ...entity, updatedAt: new Date().toISOString() })
  persist()
}

export async function remove(id: string): Promise<void> {
  const s = map.get(id)
  if (!s) return
  map.delete(id)
  const list = byClass.get(s.classId) ?? []
  byClass.set(
    s.classId,
    list.filter((x) => x !== id)
  )
  persist()
}

export async function replaceListForClass(
  classId: string,
  students: Omit<StudentEntity, 'createdAt' | 'updatedAt'>[]
): Promise<void> {
  const old = await getByClassId(classId)
  for (const s of old) map.delete(s.id)
  const ids: string[] = []
  const now = new Date().toISOString()
  for (let i = 0; i < students.length; i++) {
    const e = { ...students[i], sortIndex: i, createdAt: now, updatedAt: now }
    map.set(e.id, e)
    ids.push(e.id)
  }
  byClass.set(classId, ids)
  persist()
}

export function clearAll(): void {
  map.clear()
  byClass.clear()
  persist()
}
