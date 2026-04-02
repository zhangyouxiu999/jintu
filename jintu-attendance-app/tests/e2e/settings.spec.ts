import { expect, test } from '@playwright/test'
import { installFixedDate } from './utils/date'
import { FIXED_ISO, classEntity, students } from './utils/fixtures'
import { gotoHash, openClassPanel } from './utils/nav'
import { seedLocalStorage } from './utils/storage'

test('class panel navigation and legacy route redirects', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students,
    currentClassId: classEntity.id,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, `/attendance/${classEntity.id}`)
  await openClassPanel(page)
  await expect(page.getByText('当前班级扩展')).toBeVisible()
  await expect(page.getByRole('button', { name: /学生.*进入/ })).toBeVisible()
  await page.keyboard.press('Escape')

  await gotoHash(page, '/settings')
  await expect(page).toHaveURL(/#\/more/)

  await gotoHash(page, '/history')
  await expect(page).toHaveURL(new RegExp(`#\\/history\\/${classEntity.id}`))
})

test('invalid class route shows explicit empty state instead of silent redirect', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students,
    currentClassId: classEntity.id,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, '/history/missing-class')
  await expect(page.getByRole('main').getByText('班级不存在')).toBeVisible()
  await expect(page).toHaveURL(/#\/history\/missing-class/)
})

test('more page toggle and logout', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students,
    currentClassId: classEntity.id,
    autoResetAttendance: false,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, '/more')
  await expect(page.getByRole('main').getByText('模板下载')).toBeVisible()

  const switchControl = page.getByRole('switch', { name: '新时段提醒' })
  await switchControl.click()
  await expect(page.getByText('已开启新时段提醒')).toBeVisible()

  await page.getByRole('button', { name: '退出登录' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: /^退出$/ }).click()
  await expect(page).toHaveURL(/#\/login/)
})
