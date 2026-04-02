import { test, expect } from '@playwright/test'
import path from 'path'
import { seedLocalStorage } from './utils/storage'
import { installFixedDate } from './utils/date'
import { gotoHash } from './utils/nav'
import {
  FIXED_ISO,
  classEntity,
  students,
  gradesByClass,
  currentPeriodIdByClass,
} from './utils/fixtures'

const templatePath = path.resolve(process.cwd(), 'public/templates/成绩单导入模板.xlsx')

test('add subject, edit score, import and export grades', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students,
    gradesByClass,
    currentClassId: classEntity.id,
    currentPeriodIdByClass,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, `/grades/${classEntity.id}`)

  await page.getByRole('button', { name: '科目', exact: true }).click()
  await page.getByPlaceholder('科目名').fill('物理')
  await page.getByRole('button', { name: '添加' }).click()
  await expect(page.getByRole('button', { name: '物理', exact: true })).toBeVisible()

  const row = page.getByTestId('grade-row-stu-1')
  await row.click()
  await page.getByRole('textbox').fill('75')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(row).toContainText('75')

  await page.getByRole('button', { name: '打开成绩工具' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '导入成绩单' }).click()
  await page.setInputFiles('input[type="file"]', templatePath)

  await page.getByRole('button', { name: '打开成绩工具' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '导出成绩单' }).click()
  await page.getByLabel(/导出全部/).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '确定导出' }).click()
  const download = await downloadPromise
  await expect(download.suggestedFilename()).toBe(`${classEntity.name}-成绩单.xlsx`)
})
