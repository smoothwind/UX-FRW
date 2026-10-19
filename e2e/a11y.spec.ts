import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const BLOCKING_IMPACTS = new Set(['serious', 'critical'])

async function expectNoSeriousViolations(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze()
  const blocking = results.violations.filter((v) => BLOCKING_IMPACTS.has(v.impact ?? ''))
  const detail = blocking.map((v) => `${v.id}(${v.impact}): ${v.nodes.length} 处 → ${v.help}`)
  expect(detail, `${label} 存在 serious/critical 无障碍问题`).toEqual([])
}

test.describe('无障碍（axe-core）', () => {
  test('主页面（tokens 分区）无 serious/critical 问题', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-ux="pg-nav"]')).toBeVisible()
    await expectNoSeriousViolations(page, '主页面')
  })

  test('组件分区无 serious/critical 问题', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="components"]').click()
    await expect(page.locator('[data-ux="pg-body"]')).toHaveAttribute('data-ux-section', 'components')
    await expectNoSeriousViolations(page, '组件分区')
  })

  test('暗色主题组件分区无 serious/critical 问题', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-theme="dark"]').click()
    await page.locator('[data-ux-tab="components"]').click()
    await expect(page.locator('[data-ux="pg-body"]')).toHaveAttribute('data-ux-section', 'components')
    await expectNoSeriousViolations(page, '暗色组件分区')
  })

  test('命令面板打开后无 serious/critical 问题', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+k')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expectNoSeriousViolations(page, '命令面板')
  })
})
