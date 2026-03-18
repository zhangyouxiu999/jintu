import { test, expect } from '@playwright/test'
import { seedLocalStorage } from './utils/storage'
import { installFixedDate } from './utils/date'
import { gotoHash, openSettingsDrawer } from './utils/nav'
import { FIXED_ISO, classEntity, students } from './utils/fixtures'

test('settings drawer toggle and navigation', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students,
    currentClassId: classEntity.id,
    autoResetAttendance: false,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, `/attendance/${classEntity.id}`)
  await openSettingsDrawer(page)

  const switchControl = page.getByRole('switch', { name: '自动重置考勤' })
  await switchControl.click()
  await expect(page.getByText('已开启自动重置考勤')).toBeVisible()

  await page.getByRole('button', { name: '历史考勤' }).click()
  await expect(page).toHaveURL(new RegExp(`#\/history\/${classEntity.id}`))
})
