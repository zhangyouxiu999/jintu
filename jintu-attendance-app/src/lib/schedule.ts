export const SCHEDULE_PERIODS = [
  { name: '一', time: '8:00-8:50', isBreak: false },
  { name: '二', time: '9:00-9:50', isBreak: false },
  { name: '三', time: '10:00-10:50', isBreak: false },
  { name: '四', time: '11:00-11:50', isBreak: false },
  { name: '中午休息', time: '12:00-14:00', isBreak: true },
  { name: '五', time: '2:00-2:50', isBreak: false },
  { name: '六', time: '3:00-3:50', isBreak: false },
  { name: '七', time: '4:00-4:50', isBreak: false },
  { name: '八', time: '5:00-5:50', isBreak: false },
  { name: '下午休息', time: '18:00-19:00', isBreak: true },
  { name: '晚一', time: '7:00-7:50', isBreak: false },
  { name: '晚二', time: '8:00-8:50', isBreak: false },
] as const

export const SCHEDULE_WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const

export const SCHEDULE_ROW_LABELS = [
  '第一节课',
  '第二节课',
  '第三节课',
  '第四节课',
  '午休',
  '第五节课',
  '第六节课',
  '第七节课',
  '第八节课',
  '晚饭',
  '晚一',
  '晚二',
] as const

export const ROW_LABEL_TO_PERIOD: Record<string, string> = {
  第一节课: '一',
  第二节课: '二',
  第三节课: '三',
  第四节课: '四',
  午休: '中午休息',
  第五节课: '五',
  第六节课: '六',
  第七节课: '七',
  第八节课: '八',
  晚饭: '下午休息',
  晚一: '晚一',
  晚二: '晚二',
}

export function cellKey(day: string, period: string): string {
  return `${day}_${period}`
}
