import type { ScheduleDataByClass } from '@/types'
import { storage } from './storage'

/**
 * 课程表数据 store（本地）：
 * - v2：按 classId 单独存储
 * - fallback：兼容旧结构（storage.loadSchedule）
 */

export type ScheduleCellMap = NonNullable<ScheduleDataByClass[string]>

export function getSchedule(classId: string): ScheduleCellMap {
  const v2 = storage.loadScheduleForClass(classId)
  if (v2) return v2
  const legacy = (storage.loadSchedule() ?? {})[classId] ?? {}
  if (Object.keys(legacy).length > 0) storage.saveScheduleForClass(classId, legacy)
  return legacy
}

export function saveSchedule(classId: string, data: ScheduleCellMap): void {
  storage.saveScheduleForClass(classId, data)
}

