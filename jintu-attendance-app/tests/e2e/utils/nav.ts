import { expect, type Page } from '@playwright/test'

export async function gotoHash(page: Page, path: string) {
  await page.goto(`/#${path}`)
}

export async function openGlobalMenu(page: Page) {
  const trigger = page.getByRole('button', { name: '打开功能菜单' })
  await trigger.waitFor()
  for (let i = 0; i < 3; i++) {
    await trigger.click()
    const firstItem = page.getByRole('menuitem').first()
    if (await firstItem.isVisible().catch(() => false)) return
    await page.waitForTimeout(200)
  }
  await expect(page.getByRole('menuitem').first()).toBeVisible()
}

export async function openSettingsDrawer(page: Page) {
  await page.getByRole('button', { name: '打开我的' }).click()
  await expect(page.getByRole('main', { name: '我的' })).toBeVisible()
}
