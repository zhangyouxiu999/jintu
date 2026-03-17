/** 时段名称：0 上午 1 下午 2 晚一 3 晚二 */
export const PERIOD_NAMES = ['上午', '下午', '晚一', '晚二'] as const

/**
 * 根据本地时间返回当前时段：0 上午 1 下午 2 晚一 3 晚二
 */
export function getCurrentPeriodId(): 0 | 1 | 2 | 3 {
  const now = new Date()
  const hour = now.getHours()
  const totalMinutes = hour * 60 + now.getMinutes()

  if (hour >= 5 && hour < 12) return 0
  if (hour >= 12 && hour < 18) return 1
  if (totalMinutes >= 18 * 60 && totalMinutes < 19 * 60 + 30) return 2
  return 3
}

/** 自动重置考勤的固定时间点（每天到达该时刻后视为进入该时段，仅首次进入时触发重置）；0 点之后均算上午 */
export const RESET_TIME_POINTS = [
  { hour: 0, minute: 0, label: '上午' },
  { hour: 12, minute: 0, label: '下午' },
  { hour: 18, minute: 0, label: '晚一' },
] as const

/**
 * 根据当前本地时间，返回今天已过的最后一个重置时间点（用于判断是否在该时段内、是否需触发重置）
 * 返回格式 "HH:mm" 便于存 sessionStorage；若今天尚未到任一时间点则返回 null
 */
export function getCurrentResetSlot(): string | null {
  const now = new Date()
  const totalMinutes = now.getHours() * 60 + now.getMinutes()
  let last: (typeof RESET_TIME_POINTS)[number] | null = null
  for (const slot of RESET_TIME_POINTS) {
    const slotMinutes = slot.hour * 60 + slot.minute
    if (totalMinutes >= slotMinutes) last = slot
  }
  if (!last) return null
  return `${String(last.hour).padStart(2, '0')}:${String(last.minute).padStart(2, '0')}`
}

/** 根据 "HH:mm" 取对应的时段标签，用于 toast */
export function getResetSlotLabel(slot: string): string {
  const found = RESET_TIME_POINTS.find(
    (s) => `${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')}` === slot
  )
  return found ? found.label : slot
}
