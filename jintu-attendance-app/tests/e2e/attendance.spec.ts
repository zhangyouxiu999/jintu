import { test, expect } from '@playwright/test'
import { seedLocalStorage } from './utils/storage'
import { installFixedDate } from './utils/date'
import { gotoHash, openGlobalMenu } from './utils/nav'
import { FIXED_ISO, classEntity, students } from './utils/fixtures'

const studentImportText = '赵六\n孙七'

test('import students, mark attendance, reset, export', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students: [],
    currentClassId: classEntity.id,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, `/attendance/${classEntity.id}`)
  await expect(page.getByRole('button', { name: '添加学生' })).toBeVisible()

  await openGlobalMenu(page)
  await page.getByRole('menuitem', { name: '导入学生名单' }).click()

  await page.locator('textarea').fill(studentImportText)
  await page.getByRole('button', { name: /导入（/ }).click()
  await expect(page.getByText('赵六')).toBeVisible()
  await expect(page.getByText('孙七')).toBeVisible()

  // 标记已到
  const zhaoRow = page.locator('div', { hasText: '赵六' }).first()
  await zhaoRow.getByRole('button', { name: '已到' }).click()
  await expect(page.getByRole('button', { name: '筛选：实到' })).toContainText('1')

  // 一键全勤
  await openGlobalMenu(page)
  await page.getByRole('menuitem', { name: '一键全勤' }).click()
  await expect(page.getByRole('button', { name: '筛选：实到' })).toContainText('2')

  // 重置考勤
  await openGlobalMenu(page)
  await page.getByRole('menuitem', { name: '重置考勤' }).click()
  await page.getByRole('button', { name: '确定重置' }).click()
  await expect(page.getByRole('button', { name: '筛选：实到' })).toContainText('0')

  // 导出学生名单
  await openGlobalMenu(page)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('menuitem', { name: '导出学生名单' }).click()
  const download = await downloadPromise
  await expect(download.suggestedFilename()).toContain('学生名单')
})

test('add announcement and view', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students,
    currentClassId: classEntity.id,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, `/attendance/${classEntity.id}`)

  await openGlobalMenu(page)
  await page.getByRole('menuitem', { name: '添加公告' }).click()
  await page.getByPlaceholder('公告 1').fill('测试公告')
  await page.getByRole('button', { name: '发布' }).click()

  await page.getByRole('button', { name: '展开公告' }).click()
  await expect(page.getByText('测试公告')).toBeVisible()
})
