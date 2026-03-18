import type { GradesPeriod } from '@/types'
import { storage } from './storage'

/**
 * 成绩数据 store（本地）：
 * - v2：按 classId 单独存储 periods
 * - fallback：兼容旧结构（storage.loadGrades）
 */

export function getPeriods(classId: string): GradesPeriod[] {
  const v2 = storage.loadGradesForClass(classId)
  if (v2) return v2
  const legacy = (storage.loadGrades() ?? {})[classId] ?? []
  if (legacy.length > 0) storage.saveGradesForClass(classId, legacy)
  return legacy
}

export function savePeriods(classId: string, periods: GradesPeriod[]): void {
  storage.saveGradesForClass(classId, periods)
}

