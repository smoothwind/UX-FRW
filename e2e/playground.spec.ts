import { expect, test, type Page } from '@playwright/test'

const PREFS_KEY = 'uxkit.playground.prefs'

function readPref(page: Page, key: string): Promise<unknown> {
  return page.evaluate(
    ([storageKey, field]) => {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { data?: Record<string, unknown> }
      return parsed.data?.[field] ?? null
    },
    [PREFS_KEY, key] as const,
  )
}

test.describe('playground 外壳', () => {
  test('启动即渲染导航与默认分区，且无控制台错误', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('favicon')) {
        errors.push(message.text())
      }
    })
    page.on('pageerror', (error) => errors.push(String(error)))

    await page.goto('/')

    await expect(page.locator('[data-ux="pg-nav"]')).toBeVisible()
    await expect(page.locator('[data-ux="pg-body"]')).toHaveAttribute('data-ux-section', 'tokens')
    expect(errors).toEqual([])
  })

  test('五个分区按 data-ux-tab 切换', async ({ page }) => {
    await page.goto('/')
    const body = page.locator('[data-ux="pg-body"]')

    await page.locator('[data-ux-tab="components"]').click()
    await expect(body).toHaveAttribute('data-ux-section', 'components')
    await expect(page.getByRole('heading', { name: /UxDropdown/ })).toBeVisible()

    await page.locator('[data-ux-tab="shell"]').click()
    await expect(body).toHaveAttribute('data-ux-section', 'shell')
    await expect(page.locator('[data-ux="titlebar"]')).toBeVisible()

    await page.locator('[data-ux-tab="patterns"]').click()
    await expect(body).toHaveAttribute('data-ux-section', 'patterns')
    await expect(page.locator('[data-ux="data-table"]')).toBeVisible()

    await page.locator('[data-ux-tab="tokens"]').click()
    await expect(body).toHaveAttribute('data-ux-section', 'tokens')
    await expect(page.locator('[data-ux="data-table"]')).toHaveCount(0)
  })

  test('主题切换同步 html[data-color-mode] 并持久化', async ({ page }) => {
    await page.goto('/')

    await page.locator('[data-ux-theme="dark"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark')
    await expect.poll(() => readPref(page, 'theme')).toBe('dark')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark')

    await page.locator('[data-ux-theme="light"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'light')
    await expect.poll(() => readPref(page, 'theme')).toBe('light')
  })

  test('语言切换即时生效并持久化', async ({ page }) => {
    await page.goto('/')

    await page.locator('[data-ux-locale="en"]').click()
    await expect(page.locator('[data-ux-locale="en"]')).toHaveClass(/is-active/)
    await expect.poll(() => readPref(page, 'locale')).toBe('en')

    await page.reload()
    await expect(page.locator('[data-ux-locale="en"]')).toHaveClass(/is-active/)

    await page.locator('[data-ux-locale="zh-CN"]').click()
    await expect(page.locator('[data-ux-locale="zh-CN"]')).toHaveClass(/is-active/)
  })
})
