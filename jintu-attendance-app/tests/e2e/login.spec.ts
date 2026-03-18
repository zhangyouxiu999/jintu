import { test, expect } from '@playwright/test'
import { seedLocalStorage } from './utils/storage'
import { installFixedDate } from './utils/date'
import { gotoHash } from './utils/nav'
import { FIXED_ISO } from './utils/fixtures'

test('login flow with error then success', async ({ page }) => {
  await seedLocalStorage(page, { auth: false })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, '/login')

  await page.getByPlaceholder('请输入账号').fill('admin')
  await page.getByPlaceholder('请输入密码').fill('wrong')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByRole('alert')).toContainText('账号或密码错误')

  await page.getByPlaceholder('请输入密码').fill('admin')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByText('还没有可展示的点名班级')).toBeVisible()
})
