import { test, expect } from '@playwright/test'
import path from 'path'
import { seedLocalStorage } from './utils/storage'
import { installFixedDate } from './utils/date'
import { gotoHash, openGlobalMenu } from './utils/nav'
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

  await openGlobalMenu(page)
  await page.getByRole('menuitem', { name: '添加科目' }).click()
  await page.getByPlaceholder('科目名').fill('物理')
  await page.getByRole('button', { name: '添加' }).click()
  await expect(page.getByText('物理')).toBeVisible()

  const row = page.locator('tr', { hasText: '张三' })
  await row.getByRole('button', { name: '—' }).first().click()
  await page.getByRole('textbox').fill('75')
  await page.getByRole('textbox').press('Enter')
  await expect(row.getByRole('button', { name: '75' })).toBeVisible()

  await openGlobalMenu(page)
  await page.getByRole('menuitem', { name: '导入成绩单' }).click()
  await page.setInputFiles('input[type="file"]', templatePath)
  await expect(page.getByText('已导入')).toBeVisible()

  await openGlobalMenu(page)
  await page.getByRole('menuitem', { name: '导出成绩单' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '确定导出' }).click()
  const download = await downloadPromise
  await expect(download.suggestedFilename()).toBe(`${classEntity.name}-第一期.xlsx`)
})
