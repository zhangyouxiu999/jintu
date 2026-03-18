import { test, expect } from '@playwright/test'
import { seedLocalStorage } from './utils/storage'
import { installFixedDate } from './utils/date'
import { gotoHash } from './utils/nav'
import { FIXED_ISO } from './utils/fixtures'

const templates = [
  '学生名单导入模板.xlsx',
  '课程表导入模板.xlsx',
  '成绩单导入模板.xlsx',
]

test('download templates', async ({ page }) => {
  await seedLocalStorage(page, { auth: true })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, '/templates')

  for (const fileName of templates) {
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: `下载 ${fileName}` }).click()
    const download = await downloadPromise
    await expect(download.suggestedFilename()).toBe(fileName)
  }
})
