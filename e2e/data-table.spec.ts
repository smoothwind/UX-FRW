import { expect, test } from '@playwright/test'

test.describe('UxDataTable（10 万行）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="patterns"]').click()
    await expect(page.locator('[data-ux="data-table"]')).toBeVisible()
  })

  test('虚拟滚动：只渲染视口内的行，滚动后窗口前移', async ({ page }) => {
    const table = page.locator('[data-ux="data-table"]')
    const rows = table.locator('[data-ux-part="table-body"] [role="row"]')

    const rendered = await rows.count()
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(80)

    const spacerHeight = await table
      .locator('.ux-dt__spacer')
      .evaluate((el) => el.getBoundingClientRect().height)
    expect(spacerHeight).toBeGreaterThan(1_000_000)

    const firstCell = rows.first().locator('[role="gridcell"]').first()
    const before = await firstCell.innerText()

    await table.evaluate((el) => {
      el.scrollTop = 20_000
    })

    await expect.poll(() => firstCell.innerText()).not.toBe(before)
    expect(await rows.count()).toBeLessThan(80)
  })

  test('点击列头排序并在 aria-sort 上反映方向', async ({ page }) => {
    const table = page.locator('[data-ux="data-table"]')
    const header = table.getByRole('columnheader', { name: 'score' })

    await expect(header).toHaveAttribute('aria-sort', 'none')

    await header.click()
    await expect(header).toHaveAttribute('aria-sort', 'ascending')

    await header.click()
    await expect(header).toHaveAttribute('aria-sort', 'descending')
  })
})
