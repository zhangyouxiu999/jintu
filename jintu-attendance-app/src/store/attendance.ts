import type { AttendanceSnapshot } from '@/types'
import { getCurrentPeriodId } from '@/lib/period'
import { today } from '@/lib/date'
import { uuid } from './db'
import { storage } from './storage'

const map = new Map<string, AttendanceSnapshot>()

function key(classId: string, date: string, period: number): string {
  return `${classId}|${date}|${period}`
}

function persist(): void {
  const arr = Array.from(map.values())
  storage.saveAttendance(arr)
}

/** 从本地持久化恢复（启动时调用） */
export function hydrateFromPersisted(data: unknown): void {
  if (!Array.isArray(data)) return
  map.clear()
  for (const item of data as AttendanceSnapshot[]) {
    if (item?.classId != null && item?.date != null && item?.period != null) {
      map.set(key(item.classId, item.date, item.period), item)
    }
  }
}

export { getCurrentPeriodId }

export async function get(
  classId: string,
  date: string,
  period: number
): Promise<AttendanceSnapshot | null> {
  return map.get(key(classId, date, period)) ?? null
}

export async function upsert(snapshot: AttendanceSnapshot): Promise<void> {
  const k = key(snapshot.classId, snapshot.date, snapshot.period)
  map.set(k, { ...snapshot, updatedAt: new Date().toISOString() })
  persist()
}

export async function getOrCreate(
  classId: string,
  date: string,
  period: number,
  studentIds: string[]
): Promise<AttendanceSnapshot> {
  const k = key(classId, date, period)
  let snap = map.get(k)
  if (snap) return snap
  const statusMap: Record<string, number> = {}
  for (const id of studentIds) statusMap[id] = 0
  snap = {
    id: uuid(),
    classId,
    date,
    period,
    statusMap,
    updatedAt: new Date().toISOString(),
  }
  map.set(k, snap)
  persist()
  return snap
}

export async function listByClassAndDate(
  classId: string,
  date?: string
): Promise<AttendanceSnapshot[]> {
  const d = date ?? today()
  const result: AttendanceSnapshot[] = []
  for (const v of map.values()) {
    if (v.classId === classId && v.date === d && v.confirmedAt) result.push(v)
  }
  return result.sort(
    (a, b) => a.period - b.period || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

/** 按班级列出全部已确认考勤（用于历史页），按日期倒序、同日期按时段排序 */
export async function listByClass(classId: string): Promise<AttendanceSnapshot[]> {
  const result: AttendanceSnapshot[] = []
  for (const v of map.values()) {
    if (v.classId === classId && v.confirmedAt) result.push(v)
  }
  return result.sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      a.period - b.period ||
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function clearAll(): void {
  map.clear()
  persist()
}
