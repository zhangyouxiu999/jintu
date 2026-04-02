import { expect, type Page } from '@playwright/test'

export async function gotoHash(page: Page, path: string) {
  await page.goto(`/#${path}`)
}

export async function openClassPanel(page: Page) {
  await page.getByRole('button', { name: '打开班级面板' }).click()
  await expect(page.getByRole('button', { name: '添加班级' })).toBeVisible()
}
