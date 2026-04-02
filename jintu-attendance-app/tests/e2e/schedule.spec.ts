import { test, expect } from '@playwright/test'
import path from 'path'
import { seedLocalStorage } from './utils/storage'
import { installFixedDate } from './utils/date'
import { gotoHash } from './utils/nav'
import { FIXED_ISO, classEntity, scheduleByClass } from './utils/fixtures'

const templatePath = path.resolve(process.cwd(), 'public/templates/课程表导入模板.xlsx')

test('import and export schedule', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    scheduleByClass,
    currentClassId: classEntity.id,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, `/schedule/${classEntity.id}`)
  await expect(page.getByRole('button', { name: /周一/ })).toBeVisible()

  await page.getByRole('button', { name: '更多操作' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '导入课表' }).click()
  await page.setInputFiles('input[type="file"]', templatePath)
  await expect(page.getByText('课程表已导入')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '更多操作' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '导出课表' }).click()
  const download = await downloadPromise
  await expect(download.suggestedFilename()).toBe(`${classEntity.name}课程表.xlsx`)
})
