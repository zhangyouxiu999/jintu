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
