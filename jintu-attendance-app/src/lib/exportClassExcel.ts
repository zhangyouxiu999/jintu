/**
 * 导出班级全部表单为带样式的 Excel（与模板风格一致：边框、表头加粗、居中）
 */
import ExcelJS from 'exceljs'
import type { AttendanceSnapshot, ClassEntity, GradesPeriod, ScheduleCellMap, StudentEntity } from '@/types'
import { PERIOD_NAMES } from '@/lib/period'
import { ROW_LABEL_TO_PERIOD, SCHEDULE_ROW_LABELS } from '@/lib/schedule'

const WEEKDAY_NAMES_TEMPLATE = ['周一', '周二', '周三', '周四', '周五', '周六']

const thinBorder = {
  top: { style: 'thin' as const },
  left: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  right: { style: 'thin' as const },
}

/** 与模板一致的列宽：学生名单 15 列 */
const ROLL_COL_WIDTHS = [4.69, 11.21, 5.69, 5.69, 5.69, 5.69, 5.69, 5.69, 5.69, 5.69, 5.69, 5.69, 5.69, 9, 9]
/** 成绩单表头列宽（模板约 14.58） */
const GRADE_COL_WIDTH = 14.58
/** 课程表列宽：第 1 列 19.71，周一～周六 16.69 */
const SCHEDULE_COL_WIDTHS = [19.71, 16.69, 16.69, 16.69, 16.69, 16.69, 16.69]

function styleSheet(ws: ExcelJS.Worksheet, headerRowNumber = 1) {
  ws.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = thinBorder
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
    })
    if (rowNumber === headerRowNumber) {
      row.eachCell((cell) => {
        cell.font = { bold: true }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      })
    }
  })
  ws.columns.forEach((col) => { col.width = 12 })
}

/** 点名表样式与合并：与 学生名单导入模板 完全一致（标题合并 A1:O1，第 2/3 行及数据行合并，列宽、字号 14/12/10） */
function styleRollSheet(ws: ExcelJS.Worksheet, dataRowCount: number) {
  ws.mergeCells(1, 1, 1, 15)
  ws.mergeCells(2, 3, 2, 6)
  ws.mergeCells(2, 7, 2, 10)
  ws.mergeCells(2, 11, 2, 13)
  ws.mergeCells(2, 14, 2, 15)
  ws.mergeCells(3, 14, 3, 15)
  for (let r = 4; r <= 3 + dataRowCount; r++) ws.mergeCells(r, 14, r, 15)
  ROLL_COL_WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w })
  const alignCenter = { vertical: 'middle' as const, horizontal: 'center' as const, wrapText: true }
  ws.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = thinBorder
      cell.alignment = alignCenter
      if (rowNumber === 1) cell.font = { bold: true, size: 14 }
      else if (rowNumber === 2) cell.font = { size: 12 }
      else cell.font = { size: 10 }
    })
  })
}

/** 成绩单样式与合并：与 成绩单导入模板 一致（标题行合并、无边框；表头及数据加边框，字号 18/16） */
function styleGradeSheet(ws: ExcelJS.Worksheet, colCount: number) {
  ws.mergeCells(1, 1, 1, colCount)
  const alignCenter = { vertical: 'middle' as const, horizontal: 'center' as const, wrapText: true }
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, size: 18 }
    cell.alignment = alignCenter
    // 成绩单模板标题行无边框，不设置 cell.border
  })
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    row.eachCell((cell) => {
      cell.border = thinBorder
      cell.alignment = alignCenter
      cell.font = { size: 16 }
    })
  })
  for (let c = 1; c <= colCount; c++) ws.getColumn(c).width = GRADE_COL_WIDTH
}

/** 课程表样式与合并：与 课程表导入模板 一致（标题 A1:G1，午休行 7、晚饭行 12 整行合并，列宽、字号 24/20） */
function styleScheduleSheet(ws: ExcelJS.Worksheet) {
  ws.mergeCells(1, 1, 1, 7)
  ws.mergeCells(7, 1, 7, 7)
  ws.mergeCells(12, 1, 12, 7)
  SCHEDULE_COL_WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w })
  const alignCenter = { vertical: 'middle' as const, horizontal: 'center' as const, wrapText: true }
  ws.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = thinBorder
      cell.alignment = alignCenter
      cell.font = { bold: true, size: rowNumber === 1 ? 24 : 20 }
    })
  })
}

export interface ExportClassData {
  cls: ClassEntity
  students: StudentEntity[]
  snapshots: AttendanceSnapshot[]
  scheduleData: ScheduleCellMap
  periods: GradesPeriod[]
  sortedStudents: StudentEntity[]
  studentNames: Record<string, string>
}

export async function buildClassExportWorkbook(data: ExportClassData): Promise<ArrayBuffer> {
  const { cls, snapshots, scheduleData, periods, sortedStudents, studentNames } = data
  const wb = new ExcelJS.Workbook()

  // Sheet1：点名表（与 学生名单导入模板 一致：15 列、合并单元格、列宽与字号）
  const wsRoll = wb.addWorksheet('点名表', { views: [{ state: 'frozen', ySplit: 3 }] })
  wsRoll.addRow([`${cls.name}班`])
  wsRoll.addRow([null, null, '点名表', null, null, null, '作业表', null, null, null, '背诵表', null, null, '月  ' + '日', null])
  wsRoll.addRow(['序号', '姓名', '上午', '下午', '晚一', '晚二', '语', '数', '英', '信息', '语', '英', '信息', '作业内容：', null])
  sortedStudents.forEach((s, i) => {
    wsRoll.addRow([i + 1, s.name, '', '', '', '', '', '', '', '', '', '', '', '', ''])
  })
  styleRollSheet(wsRoll, sortedStudents.length)

  // Sheet2：考勤记录
  const wsAtt = wb.addWorksheet('考勤记录', { views: [{ state: 'frozen', ySplit: 1 }] })
  const attHeaders = ['日期', '时段', '应到', '实到', '请假', '晚到', '未到', '请假名单', '晚到名单', '未到名单']
  wsAtt.addRow(attHeaders)
  for (const s of snapshots) {
    const ids = Object.keys(s.statusMap)
    const total = ids.length
    const present = ids.filter((id) => s.statusMap[id] === 1).length
    const leaveIds = ids.filter((id) => s.statusMap[id] === 2)
    const lateIds = ids.filter((id) => s.statusMap[id] === 3)
    const absentIds = ids.filter((id) => s.statusMap[id] === 0)
    wsAtt.addRow([
      s.date,
      PERIOD_NAMES[s.period] ?? '',
      total,
      present,
      leaveIds.length,
      lateIds.length,
      absentIds.length,
      leaveIds.map((id) => studentNames[id] ?? id).join(' ') || '—',
      lateIds.map((id) => studentNames[id] ?? id).join(' ') || '—',
      absentIds.map((id) => studentNames[id] ?? id).join(' ') || '—',
    ])
  }
  styleSheet(wsAtt)

  // Sheet3：课程表（与 课程表导入模板 一致：合并标题/午休/晚饭行、列宽、字号 24/20）
  const wsSchedule = wb.addWorksheet('课程表', { views: [{ state: 'frozen', ySplit: 2 }] })
  wsSchedule.addRow([`${cls.name}类课程表`])
  wsSchedule.addRow(['', ...WEEKDAY_NAMES_TEMPLATE])
  for (const label of SCHEDULE_ROW_LABELS) {
    const key = ROW_LABEL_TO_PERIOD[label] ?? label
    const row = [label, ...WEEKDAY_NAMES_TEMPLATE.map((day) => scheduleData[`${day}_${key}`] ?? '')]
    wsSchedule.addRow(row)
  }
  styleScheduleSheet(wsSchedule)

  // Sheet4+：成绩单（与 成绩单导入模板 一致：标题合并无边框 18pt，表头及数据边框 16pt）
  for (const period of periods) {
    const sheetName = `成绩-${period.name}`.slice(0, 31)
    const wsGrade = wb.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 2 }] })
    const gradeColCount = 2 + period.subjects.length + 2
    wsGrade.addRow([`${cls.name}类 第  周周测成绩表`])
    wsGrade.addRow(['序号', '姓名', ...period.subjects, '总分', '备注'])
    sortedStudents.forEach((s, i) => {
      const scoreRow = period.scores[s.id]
      const vals = period.subjects.map((sub) => scoreRow?.[sub] ?? '')
      const nums = vals.map((v) => (typeof v === 'string' ? parseFloat(v.replace(/\s/g, '')) : Number(v))).filter((n) => !Number.isNaN(n))
      const total = nums.length > 0 ? String(nums.reduce((a, b) => a + b, 0)) : ''
      wsGrade.addRow([i + 1, s.name, ...vals, total, ''])
    })
    styleGradeSheet(wsGrade, gradeColCount)
  }

  const buf = await wb.xlsx.writeBuffer()
  return buf as ArrayBuffer
}

/** 仅导出学生名单（序号、姓名），用于「导出学生名单」功能 */
export async function buildStudentListWorkbook(
  _className: string,
  students: Array<{ id: string; name: string }>
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('学生名单', { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.addRow(['序号', '姓名'])
  students.forEach((s, i) => ws.addRow([i + 1, s.name]))
  styleSheet(ws, 1)
  ws.getColumn(1).width = 8
  ws.getColumn(2).width = 14
  const buf = await wb.xlsx.writeBuffer()
  return buf as ArrayBuffer
}
