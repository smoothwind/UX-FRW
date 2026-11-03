import { expect, test, type Page } from '@playwright/test'

const CLIST_KEY = 'uxkit.playground.clist'

function readOpenGroups(page: Page): Promise<string[] | null> {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { data?: { open?: string[] } }
    return parsed.data?.open ?? null
  }, CLIST_KEY)
}

test.describe('UxConfigList（playground）', () => {
  test('渲染分组列表且默认展开第一组；工具栏/筛选条锚点就位', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="patterns"]').click()

    const list = page.locator('[data-ux="config-list"]')
    await expect(list).toBeVisible()
    await expect(list.locator('[data-ux-part="config-list-toolbar"]')).toBeVisible()
    await expect(list.locator('[data-ux-part="config-list-actions"]')).toBeVisible()

    const heads = list.locator('.ux-clist__group-head')
    await expect(heads).toHaveCount(3)
    await expect(heads.first()).toHaveAttribute('aria-expanded', 'true')
    await expect(heads.nth(1)).toHaveAttribute('aria-expanded', 'false')
  })

  test('展开状态经 createPreferences 持久化', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="patterns"]').click()

    const list = page.locator('[data-ux="config-list"]')
    // 折叠全部（按钮文案随语言，正则双匹配）
    await list.getByRole('button', { name: /折叠全部|Collapse all/ }).click()
    await expect(list.locator('.ux-clist__group-head').first()).toHaveAttribute('aria-expanded', 'false')
    await expect.poll(() => readOpenGroups(page)).toEqual([])
  })

  test('筛选反馈条随 facet 选择出现并可清除', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="patterns"]').click()

    const list = page.locator('[data-ux="config-list"]')
    await expect(list.locator('[data-ux-part="config-list-filterbar"]')).toHaveCount(0)

    await list.locator('[data-ux="filter-chips"] button').first().click()
    const bar = list.locator('[data-ux-part="config-list-filterbar"]')
    await expect(bar).toBeVisible()
    await expect(bar).toContainText('2')

    await bar.getByRole('button').click()
    await expect(list.locator('[data-ux-part="config-list-filterbar"]')).toHaveCount(0)
  })
})
