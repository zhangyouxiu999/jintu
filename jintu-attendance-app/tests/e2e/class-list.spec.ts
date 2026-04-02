import { test, expect } from '@playwright/test'
import { seedLocalStorage } from './utils/storage'
import { installFixedDate } from './utils/date'
import { gotoHash } from './utils/nav'
import {
  FIXED_ISO,
  classEntity,
  students,
  confirmedAttendanceRecords,
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

test('first-time class setup flow creates class and imports students', async ({ page }) => {
  await seedLocalStorage(page, { auth: true, classes: [], students: [] })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, '/class-setup')
  await expect(page.getByText('首次开班流程')).toBeVisible()

  await page.getByPlaceholder('例如：一年级(1)班').fill('晨光一班')
  await page.getByRole('button', { name: '下一步，准备学生名单' }).click()
  await page.getByPlaceholder('张三\n李四\n王五').fill('张三\n李四\n张三')
  await page.getByRole('button', { name: '完成开班，进入点名' }).click()

  await expect(page).toHaveURL(/#\/attendance\//)
  await expect(page.getByText('张三')).toBeVisible()
})

test('edit and export class', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students,
    confirmedAttendanceRecords,
    scheduleByClass,
    gradesByClass,
    currentClassId: classEntity.id,
    currentPeriodIdByClass,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, '/classes')
  await expect(page.getByRole('button', { name: new RegExp(templates.className) })).toBeVisible()

  await page.getByRole('button', { name: '更多' }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: '修改班级名称' }).click()
  await page.getByPlaceholder('班级名称').fill('一班-更新')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('button', { name: /一班-更新/ })).toBeVisible()

  await page.getByRole('button', { name: '更多' }).first().click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('dialog').getByRole('button', { name: '导出全部表单' }).click()
  const download = await downloadPromise

  await expect(download.suggestedFilename()).toBe('一班-更新.xlsx')
})
