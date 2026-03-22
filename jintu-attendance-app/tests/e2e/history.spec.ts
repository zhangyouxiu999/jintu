import { test, expect } from '@playwright/test'
import { seedLocalStorage } from './utils/storage'
import { installFixedDate } from './utils/date'
import { gotoHash } from './utils/nav'
import {
  FIXED_ISO,
  classEntity,
  students,
  attendanceSnapshots,
} from './utils/fixtures'

test('history list, detail view, export', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students,
    attendance: attendanceSnapshots,
    currentClassId: classEntity.id,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, `/history/${classEntity.id}`)
  await expect(page.getByText('2026-03-18')).toBeVisible()

  await page.getByRole('button', { name: '2026-03-18' }).click()
  await page.getByRole('button', { name: '上午' }).click()
  await expect(page.getByText('考勤报告')).toBeVisible()
  await expect(page.locator('pre')).toContainText('一班')

  await page.getByRole('dialog').locator('button', { hasText: '关闭' }).first().click()

  await page.getByRole('button', { name: '导出' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '确认导出' }).click()
  const download = await downloadPromise
  await expect(download.suggestedFilename()).toBe('一班历史考勤.xlsx')
})
