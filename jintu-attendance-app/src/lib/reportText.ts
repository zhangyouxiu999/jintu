import type { Student } from '@/types'
import { PERIOD_NAMES } from '@/lib/period'

export function getReportDateLabel(period: number): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  return `${month}月${day}日 ${PERIOD_NAMES[period] ?? '上午'}`
}

/** 从日期字符串得到报告用日期时段标签，如 "3月1日 上午" */
export function getReportDateLabelFromDate(dateStr: string, period: number): string {
  const parts = dateStr.split('-').map(Number)
  const month = parts[1] ?? new Date().getMonth() + 1
  const day = parts[2] ?? new Date().getDate()
  return `${month}月${day}日 ${PERIOD_NAMES[period] ?? '上午'}`
}

/**
 * 轻量版考勤报告文案：班级名、日期时段、应到/实到/请假/晚到/未到
 */
export function buildReportText(className: string, students: Student[], period: number): string {
  const dateLabel = getReportDateLabel(period)
  const total = students.length
  const present = students.filter((s) => s.attendanceStatus === 1)
  const leave = students.filter((s) => s.attendanceStatus === 2)
  const late = students.filter((s) => s.attendanceStatus === 3)
  const absent = students.filter((s) => s.attendanceStatus === 0)

  const lines = [
    dateLabel,
    className,
    `应到: ${total}人`,
    `实到: ${present.length}人`,
    `请假: ${leave.length > 0 ? leave.map((s) => s.name).join(' ') : '无'}`,
    `晚到: ${late.length > 0 ? late.map((s) => s.name).join(' ') : '无'}`,
    `未到: ${absent.length > 0 ? absent.map((s) => s.name).join(' ') : '无'}`,
  ]
  return lines.join('\n')
}

/**
 * 从历史快照生成与 buildReportText 相同格式的报告文案（班级名、日期时段、应到/实到/请假/晚到/未到）
 */
export function buildReportTextFromSnapshot(
  className: string,
  dateStr: string,
  period: number,
  statusMap: Record<string, number>,
  studentNames: Record<string, string>
): string {
  const dateLabel = getReportDateLabelFromDate(dateStr, period)
  const ids = Object.keys(statusMap)
  const total = ids.length
  const present = ids.filter((id) => statusMap[id] === 1)
  const leave = ids.filter((id) => statusMap[id] === 2).map((id) => studentNames[id] ?? id)
  const late = ids.filter((id) => statusMap[id] === 3).map((id) => studentNames[id] ?? id)
  const absent = ids.filter((id) => statusMap[id] === 0).map((id) => studentNames[id] ?? id)
  const lines = [
    dateLabel,
    className,
    `应到: ${total}人`,
    `实到: ${present.length}人`,
    `请假: ${leave.length > 0 ? leave.join(' ') : '无'}`,
    `晚到: ${late.length > 0 ? late.join(' ') : '无'}`,
    `未到: ${absent.length > 0 ? absent.join(' ') : '无'}`,
  ]
  return lines.join('\n')
}
