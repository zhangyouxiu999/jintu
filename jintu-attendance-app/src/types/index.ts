/** 班级（轻量：仅名称） */
export interface ClassEntity {
  id: string
  name: string
  studentOrder: string[]
  createdAt: string
  updatedAt: string
}

/** 学生（添加时仅需 name，其余系统生成） */
export interface StudentEntity {
  id: string
  name: string
  classId: string
  sortIndex: number
  createdAt: string
  updatedAt: string
}

/** 考勤快照 */
export interface AttendanceSnapshot {
  id: string
  classId: string
  date: string
  period: number
  statusMap: Record<string, number>
  confirmedAt?: string
  updatedAt: string
}

/** 公告 */
export interface AnnouncementEntity {
  id: string
  classId: string
  content: string
  expirationType: 'today' | 'permanent' | 'custom'
  startsAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

/** 点名页展示用 */
export interface Student {
  id: string
  name: string
  attendanceStatus: number // 0 未到 1 已到 2 请假 3 晚到
}
