import { test, expect } from '@playwright/test'
import { seedLocalStorage } from './utils/storage'
import { installFixedDate } from './utils/date'
import { gotoHash } from './utils/nav'
import {
  FIXED_ISO,
  classEntity,
  students,
  attendanceSnapshots,
  scheduleByClass,
  gradesByClass,
  currentPeriodIdByClass,
} from './utils/fixtures'

const templates = {
  className: classEntity.name,
}

test('class list empty state and add class', async ({ page }) => {
  await seedLocalStorage(page, { auth: true, classes: [], students: [] })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, '/classes')
  await expect(page.getByText('暂无班级')).toBeVisible()

  await page.getByRole('button', { name: '新增班级' }).click()
  await page.getByPlaceholder('班级名称').fill('测试班')
  await page.getByRole('button', { name: '确定' }).click()

  await expect(page).toHaveURL(/#\/attendance\//)
})

test('edit and export class', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students,
    attendance: attendanceSnapshots,
    scheduleByClass,
    gradesByClass,
    currentClassId: classEntity.id,
    currentPeriodIdByClass,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, '/classes')
  await expect(page.getByText(templates.className)).toBeVisible()

  await page.getByRole('button', { name: '更多' }).first().click()
  await page.getByRole('menuitem', { name: '修改' }).click()
  await page.getByPlaceholder('班级名称').fill('一班-更新')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('一班-更新')).toBeVisible()

  await page.getByRole('button', { name: '更多' }).first().click()
  await page.getByRole('menuitem', { name: '导出所有' }).click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '确认导出' }).click()
  const download = await downloadPromise

  await expect(download.suggestedFilename()).toBe('一班-更新.xlsx')
})
