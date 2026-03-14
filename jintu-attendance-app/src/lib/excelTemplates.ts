/**
 * Excel 模板生成与下载：与点名/课程表/成绩单导入格式一致，便于用户填写后导入。
 */
import type { WorkBook } from 'xlsx'
import { SCHEDULE_ROW_LABELS, SCHEDULE_WEEKDAY_NAMES } from '@/lib/schedule'

/** 生成「课程表」导入模板：第一行为周一～周日，第一列为节次标签。 */
export function buildScheduleTemplate(): (string | number)[][] {
  const header = ['', ...SCHEDULE_WEEKDAY_NAMES]
  const rows: (string | number)[][] = [header]
  for (const label of SCHEDULE_ROW_LABELS) {
    rows.push([label, '', '', '', '', '', '', ''])
  }
  return rows
}

/** 生成「成绩单」导入模板：第一行为姓名 + 科目，后续为空行或示例。 */
export function buildGradesTemplate(): (string | number)[][] {
  return [
    ['姓名', '语文', '数学', '英语'],
    ['张三', '', '', ''],
    ['李四', '', '', ''],
    ['王五', '', '', ''],
  ]
}

/** 生成「点名表」模板：与工作簿4.xlsx 一致，含点名表、作业表、背诵表，序号+姓名+上午/下午/语数职业等列。 */
export function buildAttendanceReportTemplate(): (string | number)[][] {
  const rows: (string | number)[][] = [
    ['大于锦途点名+作业检查表'],
    ['点名表', '', '', '', '作业表', '', '', '背诵表', '', '', '月  日'],
    ['序号', '姓名', '上午', '下午', '语', '数', '职业', '语', '数', '职业', '作业内容：'],
  ]
  for (let i = 1; i <= 30; i++) {
    rows.push([i, '', '', '', '', '', '', '', '', '', ''])
  }
  return rows
}

export interface TemplateMeta {
  id: string
  name: string
  description: string
  fileName: string
  /** 若提供则直接下载该静态文件（保留 Excel 样式）；否则用 build() 生成 */
  staticUrl?: string
  build: () => (string | number)[][]
  sheetName?: string
}

export const EXCEL_TEMPLATES: TemplateMeta[] = [
  {
    id: 'attendance-report',
    name: '学生点名表模板',
    description: '点名+作业检查表：含序号、姓名、上午/下午、语数职业、背诵、作业内容等列，打印或填写使用。',
    fileName: '学生名单导入模板.xlsx',
    staticUrl: 'templates/学生名单导入模板.xlsx',
    build: buildAttendanceReportTemplate,
    sheetName: '学生名单',
  },
  {
    id: 'schedule',
    name: '课程表模版',
    description: '第一行为周一～周日，第一列为节次（第一节课、第二节课…晚二），填写课程名称后可在课程表页导入。',
    fileName: '课程表导入模板.xlsx',
    staticUrl: 'templates/课程表导入模板.xlsx',
    build: buildScheduleTemplate,
    sheetName: '课程表',
  },
  {
    id: 'grades',
    name: '成绩单模板',
    description: '第一行需包含「姓名」列及科目列（如语文、数学、英语），在成绩单页选择班级与期数后导入。',
    fileName: '成绩单导入模板.xlsx',
    staticUrl: 'templates/成绩单导入模板.xlsx',
    build: buildGradesTemplate,
    sheetName: '成绩单',
  },
]

async function writeAndDownload(wb: WorkBook, fileName: string): Promise<void> {
  const XLSX = await import('xlsx')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const arrayBuffer = buf instanceof ArrayBuffer ? buf : new Uint8Array(buf).buffer
  const { shareOrDownloadFile } = await import('@/lib/shareOrDownload')
  await shareOrDownloadFile(arrayBuffer, fileName, { dialogTitle: '保存模板' })
}

/** 下载静态模板文件（保留原有 Excel 样式）。大文件使用统一分块 base64，避免溢出。 */
async function downloadStaticFile(staticUrl: string, fileName: string): Promise<void> {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const url = base.replace(/\/?$/, '/') + staticUrl.replace(/^\//, '')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`下载失败: ${res.status}`)
  const buf = await res.arrayBuffer()
  const { shareOrDownloadFile } = await import('@/lib/shareOrDownload')
  await shareOrDownloadFile(buf, fileName, { dialogTitle: '保存模板' })
}

/** 根据模板 meta 生成 xlsx 并下载或分享；若为静态模板则直接下载原文件以保留样式。 */
export async function downloadTemplate(meta: TemplateMeta): Promise<void> {
  if (meta.staticUrl) {
    await downloadStaticFile(meta.staticUrl, meta.fileName)
    return
  }
  const XLSX = await import('xlsx')
  const rows = meta.build()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, meta.sheetName ?? 'Sheet1')
  await writeAndDownload(wb, meta.fileName)
}
