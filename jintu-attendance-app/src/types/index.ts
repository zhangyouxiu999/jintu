export type ISODateString = string
export type EntityId = string

export type PeriodId = 0 | 1 | 2 | 3
export type AttendanceStatus = 0 | 1 | 2 | 3
export type AnnouncementExpirationType = 'today' | 'permanent' | 'custom'

export type AttendanceStatusMap = Record<EntityId, AttendanceStatus>
export type GradesScoreMap = Record<EntityId, Record<string, string>>
export type ScheduleCellMap = Record<string, string>
export type ScheduleDataByClass = Record<EntityId, ScheduleCellMap>

/** 班级（轻量：仅名称） */
export interface ClassEntity {
  id: EntityId
  name: string
  studentOrder: EntityId[]
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** 学生（添加时仅需 name，其余系统生成） */
export interface StudentEntity {
  id: EntityId
  name: string
  classId: EntityId
  sortIndex: number
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** 点名页展示用学生 */
export interface Student {
  id: EntityId
  name: string
  attendanceStatus: AttendanceStatus
}

interface AttendanceRecordBase {
  id: EntityId
  classId: EntityId
  date: ISODateString
  period: PeriodId
  statusMap: AttendanceStatusMap
  updatedAt: ISODateString
}

/** 当前时段草稿 */
export type AttendanceDraft = AttendanceRecordBase

/** 已确认历史记录 */
export interface ConfirmedAttendanceRecord extends AttendanceRecordBase {
  confirmedAt: ISODateString
}

/** 公告 */
export interface AnnouncementEntity {
  id: EntityId
  classId: EntityId
  content: string
  expirationType: AnnouncementExpirationType
  startsAt?: ISODateString
  expiresAt?: ISODateString
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** 单期成绩单 */
export interface GradesForClass {
  subjects: string[]
  scores: GradesScoreMap
}

/** 成绩单分期 */
export interface GradesPeriod extends GradesForClass {
  id: EntityId
  name: string
}

/** 按班级维度存储的成绩单 */
export type GradesDataByClass = Record<EntityId, GradesPeriod[]>
