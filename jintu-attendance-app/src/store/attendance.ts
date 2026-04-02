import type {
  AttendanceDraft,
  AttendanceStatus,
  AttendanceStatusMap,
  ConfirmedAttendanceRecord,
  PeriodId,
} from '@/types'
import { getCurrentPeriodId } from '@/lib/period'
import { today } from '@/lib/date'
import * as classesStore from './classes'
import { uuid } from './db'
import { storage } from './storage'

const draftMap = new Map<string, AttendanceDraft>()
const confirmedMap = new Map<string, ConfirmedAttendanceRecord>()

function key(classId: string, date: string, period: PeriodId): string {
  return `${classId}|${date}|${period}`
}

function normalizeStatusMap(studentIds: string[], statusMap: AttendanceStatusMap): AttendanceStatusMap {
  const next: AttendanceStatusMap = {}
  for (const studentId of studentIds) {
    next[studentId] = statusMap[studentId] ?? 0
  }
  return next
}

function persistDraft(draft: AttendanceDraft): void {
  storage.saveAttendanceDraft(draft.classId, draft.date, draft.period, draft)
}

function persistConfirmed(record: ConfirmedAttendanceRecord): void {
  storage.saveConfirmedAttendanceRecord(record.classId, record.date, record.period, record)
}

function hasStatusMapChanged(studentIds: string[], statusMap: AttendanceStatusMap): boolean {
  const currentIds = Object.keys(statusMap)
  if (currentIds.length !== studentIds.length) return true
  return studentIds.some((studentId) => statusMap[studentId] == null)
}

export function hydrateFromPersisted(): void {
  draftMap.clear()
  confirmedMap.clear()

  for (const draft of storage.loadAllAttendanceDrafts()) {
    if (draft?.classId && draft?.date && draft?.period != null) {
      draftMap.set(key(draft.classId, draft.date, draft.period), draft)
    }
  }

  for (const record of storage.loadAllConfirmedAttendanceRecords()) {
    if (record?.classId && record?.date && record?.period != null && record?.confirmedAt) {
      confirmedMap.set(key(record.classId, record.date, record.period), record)
    }
  }
}

export { getCurrentPeriodId }

async function getStudentIdsForClass(classId: string): Promise<string[]> {
  const cls = await classesStore.getById(classId)
  return cls?.studentOrder ?? []
}

export async function getDraft(
  classId: string,
  date: string,
  period: PeriodId
): Promise<AttendanceDraft | null> {
  return draftMap.get(key(classId, date, period)) ?? null
}

export async function getConfirmedRecord(
  classId: string,
  date: string,
  period: PeriodId
): Promise<ConfirmedAttendanceRecord | null> {
  return confirmedMap.get(key(classId, date, period)) ?? null
}

async function upsertDraft(draft: AttendanceDraft): Promise<AttendanceDraft> {
  const next = {
    ...draft,
    updatedAt: new Date().toISOString(),
  }
  draftMap.set(key(next.classId, next.date, next.period), next)
  persistDraft(next)
  return next
}

async function ensureDraft(
  classId: string,
  date: string,
  period: PeriodId,
  studentIds: string[]
): Promise<AttendanceDraft> {
  const draftKey = key(classId, date, period)
  const existing = draftMap.get(draftKey)

  if (existing) {
    if (!hasStatusMapChanged(studentIds, existing.statusMap)) return existing
    return upsertDraft({
      ...existing,
      statusMap: normalizeStatusMap(studentIds, existing.statusMap),
    })
  }

  const draft: AttendanceDraft = {
    id: uuid(),
    classId,
    date,
    period,
    statusMap: normalizeStatusMap(studentIds, {}),
    updatedAt: new Date().toISOString(),
  }
  draftMap.set(draftKey, draft)
  persistDraft(draft)
  return draft
}

export async function getCurrentDraft(classId: string): Promise<AttendanceDraft> {
  const studentIds = await getStudentIdsForClass(classId)
  return ensureDraft(classId, today(), getCurrentPeriodId(), studentIds)
}

export async function saveDraftStudentStatus(
  classId: string,
  studentId: string,
  status: AttendanceStatus
): Promise<void> {
  const draft = await getCurrentDraft(classId)
  await upsertDraft({
    ...draft,
    statusMap: {
      ...draft.statusMap,
      [studentId]: status,
    },
  })
}

export async function saveCurrentDraftStatusMap(
  classId: string,
  statusMap: AttendanceStatusMap
): Promise<void> {
  const draft = await getCurrentDraft(classId)
  const studentIds = await getStudentIdsForClass(classId)
  await upsertDraft({
    ...draft,
    statusMap: normalizeStatusMap(studentIds, statusMap),
  })
}

export async function clearCurrentDraft(classId: string): Promise<void> {
  const draft = await getCurrentDraft(classId)
  const studentIds = await getStudentIdsForClass(classId)
  await upsertDraft({
    ...draft,
    statusMap: normalizeStatusMap(studentIds, {}),
  })
}

export async function confirmCurrentDraft(classId: string): Promise<ConfirmedAttendanceRecord> {
  const draft = await getCurrentDraft(classId)
  const now = new Date().toISOString()
  const confirmedKey = key(draft.classId, draft.date, draft.period)
  const existing = confirmedMap.get(confirmedKey)
  const record: ConfirmedAttendanceRecord = {
    id: existing?.id ?? uuid(),
    classId: draft.classId,
    date: draft.date,
    period: draft.period,
    statusMap: { ...draft.statusMap },
    confirmedAt: now,
    updatedAt: now,
  }
  confirmedMap.set(confirmedKey, record)
  persistConfirmed(record)
  return record
}

export async function listConfirmedByClassAndDate(
  classId: string,
  date = today()
): Promise<ConfirmedAttendanceRecord[]> {
  const result: ConfirmedAttendanceRecord[] = []
  for (const record of confirmedMap.values()) {
    if (record.classId === classId && record.date === date) result.push(record)
  }
  return result.sort(
    (a, b) => a.period - b.period || new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime()
  )
}

export async function listConfirmedByClass(classId: string): Promise<ConfirmedAttendanceRecord[]> {
  const result: ConfirmedAttendanceRecord[] = []
  for (const record of confirmedMap.values()) {
    if (record.classId === classId) result.push(record)
  }
  return result.sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      a.period - b.period ||
      new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime()
  )
}

export function clearAll(): void {
  for (const draft of draftMap.values()) {
    storage.removeAttendanceDraft(draft.classId, draft.date, draft.period)
  }
  for (const record of confirmedMap.values()) {
    storage.removeConfirmedAttendanceRecord(record.classId, record.date, record.period)
  }
  draftMap.clear()
  confirmedMap.clear()
}
