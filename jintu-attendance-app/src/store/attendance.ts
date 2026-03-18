import type { AttendanceSnapshot, AttendanceStatus, AttendanceStatusMap, PeriodId } from '@/types'
import { getCurrentPeriodId } from '@/lib/period'
import { today } from '@/lib/date'
import * as classesStore from './classes'
import { uuid } from './db'
import { storage } from './storage'

const map = new Map<string, AttendanceSnapshot>()

function key(classId: string, date: string, period: PeriodId): string {
  return `${classId}|${date}|${period}`
}

function persistOne(snapshot: AttendanceSnapshot): void {
  storage.saveAttendanceSnapshot(snapshot.classId, snapshot.date, snapshot.period, snapshot)
}

/** 从本地持久化恢复（启动时调用） */
export function hydrateFromPersisted(data: AttendanceSnapshot[]): void {
  map.clear()
  for (const item of data) {
    if (item?.classId != null && item?.date != null && item?.period != null) {
      map.set(key(item.classId, item.date, item.period), item)
    }
  }
}

export { getCurrentPeriodId }

async function getStudentIdsForClass(classId: string): Promise<string[]> {
  const cls = await classesStore.getById(classId)
  return cls?.studentOrder ?? []
}

export async function get(
  classId: string,
  date: string,
  period: PeriodId
): Promise<AttendanceSnapshot | null> {
  return map.get(key(classId, date, period)) ?? null
}

export async function upsert(snapshot: AttendanceSnapshot): Promise<void> {
  const k = key(snapshot.classId, snapshot.date, snapshot.period)
  const next = { ...snapshot, updatedAt: new Date().toISOString() }
  map.set(k, next)
  persistOne(next)
}

export async function getOrCreate(
  classId: string,
  date: string,
  period: PeriodId,
  studentIds: string[]
): Promise<AttendanceSnapshot> {
  const k = key(classId, date, period)
  let snap = map.get(k)
  if (snap) return snap
  const statusMap: AttendanceStatusMap = {}
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
  persistOne(snap)
  return snap
}

export async function getCurrentSnapshot(classId: string): Promise<AttendanceSnapshot> {
  const date = today()
  const period = getCurrentPeriodId()
  const studentIds = await getStudentIdsForClass(classId)
  return getOrCreate(classId, date, period, studentIds)
}

export async function saveStudentStatus(
  classId: string,
  studentId: string,
  status: AttendanceStatus
): Promise<void> {
  const snapshot = await getCurrentSnapshot(classId)
  await upsert({
    ...snapshot,
    statusMap: {
      ...snapshot.statusMap,
      [studentId]: status,
    },
  })
}

export async function saveCurrentStatusMap(
  classId: string,
  statusMap: AttendanceStatusMap
): Promise<void> {
  const snapshot = await getCurrentSnapshot(classId)
  await upsert({ ...snapshot, statusMap })
}

export async function confirmCurrentReport(classId: string): Promise<void> {
  const snapshot = await getCurrentSnapshot(classId)
  await upsert({ ...snapshot, confirmedAt: new Date().toISOString() })
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
  // v2：逐条清理，避免遗留索引；同时清空内存 map
  for (const v of map.values()) {
    storage.removeAttendanceSnapshot(v.classId, v.date, v.period)
  }
  map.clear()
}
