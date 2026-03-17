/** 本地时区日期 YYYY-MM-DD */
export function formatLocalDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 当前日期 YYYY-MM-DD（本地时区），全系统统一用此作为「今天」 */
export function today(): string {
  return formatLocalDate()
}

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const

export interface WeekDayInfo {
  label: string
  isToday: boolean
  date: number
  month: number
}

/** 以周一为一周起点的本周 7 天（周一～周日），与 today() 统一，用于课表等展示 */
export function getCurrentWeekDays(): WeekDayInfo[] {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysSinceMonday)
  monday.setHours(0, 0, 0, 0)

  return WEEKDAY_LABELS.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return {
      label,
      isToday,
      date: d.getDate(),
      month: d.getMonth() + 1,
    }
  })
}
