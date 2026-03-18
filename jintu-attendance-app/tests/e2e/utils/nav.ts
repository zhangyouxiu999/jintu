import { expect, type Page } from '@playwright/test'

export async function gotoHash(page: Page, path: string) {
  await page.goto(`/#${path}`)
}

export async function openGlobalMenu(page: Page) {
  await page.getByRole('button', { name: '打开功能菜单' }).click()
  await expect(page.getByRole('menuitem').first()).toBeVisible()
}

export async function openSettingsDrawer(page: Page) {
  await page.getByRole('button', { name: '打开我的' }).click()
  await expect(page.getByRole('main', { name: '我的' })).toBeVisible()
}
