export const FIXED_ISO = '2026-03-18T08:00:00.000+08:00'

export const classId = 'class-1'
export const classEntity = {
  id: classId,
  name: '一班',
  studentOrder: ['stu-1', 'stu-2', 'stu-3'],
  createdAt: '2026-03-10T08:00:00.000Z',
  updatedAt: '2026-03-10T08:00:00.000Z',
}

export const students = [
  { id: 'stu-1', name: '张三', classId, sortIndex: 1, createdAt: '2026-03-10T08:00:00.000Z', updatedAt: '2026-03-10T08:00:00.000Z' },
  { id: 'stu-2', name: '李四', classId, sortIndex: 2, createdAt: '2026-03-10T08:00:00.000Z', updatedAt: '2026-03-10T08:00:00.000Z' },
  { id: 'stu-3', name: '王五', classId, sortIndex: 3, createdAt: '2026-03-10T08:00:00.000Z', updatedAt: '2026-03-10T08:00:00.000Z' },
]

export const attendanceDrafts = [
  {
    id: 'draft-1',
    classId,
    date: '2026-03-18',
    period: 0,
    statusMap: { 'stu-1': 0, 'stu-2': 0, 'stu-3': 0 },
    updatedAt: '2026-03-18T08:00:00.000Z',
  },
]

export const confirmedAttendanceRecords = [
  {
    id: 'att-1',
    classId,
    date: '2026-03-18',
    period: 0,
    statusMap: { 'stu-1': 1, 'stu-2': 0, 'stu-3': 2 },
    confirmedAt: '2026-03-18T08:30:00.000Z',
    updatedAt: '2026-03-18T08:30:00.000Z',
  },
  {
    id: 'att-2',
    classId,
    date: '2026-03-17',
    period: 1,
    statusMap: { 'stu-1': 1, 'stu-2': 1, 'stu-3': 1 },
    confirmedAt: '2026-03-17T13:00:00.000Z',
    updatedAt: '2026-03-17T13:00:00.000Z',
  },
]

export const announcements = [
  {
    id: 'ann-1',
    classId,
    content: '今日点名提醒',
    expirationType: 'today',
    createdAt: '2026-03-18T07:50:00.000Z',
    updatedAt: '2026-03-18T07:50:00.000Z',
  },
]

export const scheduleByClass = {
  [classId]: {
    '周一_一': '语文',
    '周二_二': '数学',
    '周三_三': '英语',
  },
}

export const gradesByClass = {
  [classId]: [
    {
      id: 'period-1',
      name: '第一期',
      subjects: ['语文', '数学'],
      scores: {
        'stu-1': { 语文: '98', 数学: '96' },
        'stu-2': { 语文: '85', 数学: '88' },
        'stu-3': { 语文: '90', 数学: '92' },
      },
    },
  ],
}

export const currentPeriodIdByClass = {
  [classId]: 'period-1',
}
