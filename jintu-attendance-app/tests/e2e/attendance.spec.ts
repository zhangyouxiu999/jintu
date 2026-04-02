import { test, expect } from '@playwright/test'
import { seedLocalStorage } from './utils/storage'
import { installFixedDate } from './utils/date'
import { gotoHash } from './utils/nav'
import { FIXED_ISO, classEntity, students } from './utils/fixtures'

function buildLargeStudentSeed(count: number) {
  const largeClass = {
    ...classEntity,
    id: 'class-large',
    name: '大班',
    studentOrder: Array.from({ length: count }, (_, index) => `stu-large-${index + 1}`),
  }
  const largeStudents = Array.from({ length: count }, (_, index) => ({
    id: `stu-large-${index + 1}`,
    name: `学生${String(index + 1).padStart(3, '0')}`,
    classId: largeClass.id,
    sortIndex: index + 1,
    createdAt: '2026-03-10T08:00:00.000Z',
    updatedAt: '2026-03-10T08:00:00.000Z',
  }))
  return { largeClass, largeStudents }
}

test('attendance status update and report content stay consistent', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students,
    currentClassId: classEntity.id,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, `/attendance/${classEntity.id}`)
  await expect(page.getByText('张三')).toBeVisible()

  const zhangRow = page.getByTestId('attendance-row-stu-1')
  await zhangRow.getByRole('button', { name: '已到' }).click()
  await expect(page.getByRole('button', { name: '筛选：实到' })).toContainText('1')

  await page.getByRole('button', { name: '生成报告' }).click()
  await expect(page.locator('pre')).toContainText('实到: 1人')
  await expect(page.locator('pre')).toContainText('未到: 李四 王五')
  await page.getByRole('dialog').getByRole('button', { name: '关闭' }).first().click()
})

test('add announcement and view', async ({ page }) => {
  await seedLocalStorage(page, {
    auth: true,
    classes: [classEntity],
    students,
    currentClassId: classEntity.id,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, `/attendance/${classEntity.id}`)

  await page.getByRole('button', { name: '发布公告' }).click()
  await page.getByPlaceholder('公告 1').fill('测试公告')
  await page.getByRole('dialog').getByRole('button', { name: '发布', exact: true }).click()

  await page.getByRole('button', { name: '展开公告' }).click()
  await expect(page.locator('span').filter({ hasText: /^测试公告$/ })).toBeVisible()
})

test('filtering remains usable with a large class list', async ({ page }) => {
  const { largeClass, largeStudents } = buildLargeStudentSeed(240)

  await seedLocalStorage(page, {
    auth: true,
    classes: [largeClass],
    students: largeStudents,
    currentClassId: largeClass.id,
  })
  await installFixedDate(page, FIXED_ISO)

  await gotoHash(page, `/attendance/${largeClass.id}`)
  await expect(page.getByText('学生001')).toBeVisible()

  await page.getByTestId('attendance-row-stu-large-1').getByRole('button', { name: '已到' }).click()
  await page.getByTestId('attendance-row-stu-large-2').getByRole('button', { name: '请假' }).click()
  await page.getByTestId('attendance-row-stu-large-3').getByRole('button', { name: '晚到' }).click()

  await page.getByRole('button', { name: '筛选：实到' }).click()
  await expect(page.getByTestId('attendance-row-stu-large-1')).toBeVisible()
  await expect(page.getByTestId('attendance-row-stu-large-2')).toHaveCount(0)

  await page.getByRole('button', { name: '筛选：请假' }).click()
  await expect(page.getByTestId('attendance-row-stu-large-2')).toBeVisible()
  await expect(page.getByTestId('attendance-row-stu-large-1')).toHaveCount(0)

  await page.getByRole('button', { name: '筛选：应到' }).click()
  await expect(page.getByTestId('attendance-row-stu-large-1')).toBeVisible()
})
