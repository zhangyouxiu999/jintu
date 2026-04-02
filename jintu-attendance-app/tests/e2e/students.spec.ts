import { expect, test } from '@playwright/test'
import { installFixedDate } from './utils/date'
import { FIXED_ISO, classEntity, students } from './utils/fixtures'
import { gotoHash } from './utils/nav'
import { seedLocalStorage } from './utils/storage'

test('manage students from the dedicated student list page', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students,
    currentClassId: classEntity.id,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, `/students/${classEntity.id}`)
  await expect(page.getByTestId('sortable-student-row-stu-1')).toBeVisible()

  await page.getByRole('button', { name: '添加' }).click()
  await page.getByPlaceholder('姓名').fill('赵六')
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByText('赵六')).toBeVisible()

  await page.getByRole('button', { name: '更多操作' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '导入学生' }).click()
  await page.locator('textarea').fill('孙七')
  await page.getByRole('button', { name: /导入（/ }).click()
  await expect(page.getByText('孙七')).toBeVisible()

  const zhangRow = page.getByTestId('sortable-student-row-stu-1')
  await zhangRow.getByRole('button', { name: '编辑' }).click()
  await page.getByPlaceholder('姓名').fill('张三丰')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('张三丰')).toBeVisible()

  const sunRow = page.locator('[data-testid^="sortable-student-row-"]', { hasText: '孙七' }).first()
  await sunRow.getByRole('button', { name: '删除' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '删除' }).click()
  await expect(page.getByText('孙七')).toHaveCount(0)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '更多操作' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '导出学生名单' }).click()
  const download = await downloadPromise
  await expect(download.suggestedFilename()).toContain('学生名单')
})
