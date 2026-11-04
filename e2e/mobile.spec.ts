import { expect, test } from '@playwright/test'

/**
 * 移动端入口（playground 窄屏收缩）：
 * iPhone 级视口（390×844）+ 触控；断言视口通道与收缩后导航仍完整可用。
 * 收缩样式见 apps/playground/src/App.vue（收缩边界 = 断点登记 --ux-bp-sm = 600px）。
 */
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

test.describe('移动入口（窄屏收缩 + 视口通道）', () => {
  test('视口通道标记窄屏档 + 竖屏；导航收缩为横向滚动且五分区齐全', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('[data-ux="pg-nav"]')
    await expect(nav).toBeVisible()

    // 视口通道：窄屏档 + 竖屏（coarse 随设备模拟而定，不硬赌）
    await expect(page.locator('html')).toHaveAttribute('data-ux-viewport', /^sm (coarse|fine) portrait$/)

    // 收缩不减可达性：五个分区全部存在，nav 横向滚动
    const tabs = nav.locator('[data-ux-tab]')
    await expect(tabs).toHaveCount(5)
    await expect(nav).toHaveCSS('overflow-x', 'auto')

    // 触屏点最后一个分区切换成功
    await tabs.last().tap()
    await expect(tabs.last()).toHaveClass(/is-active/)
    await expect(page.locator('[data-ux="pg-body"]')).toBeVisible()
  })

  test('副标题窄屏隐藏（收缩不增强）；切分区正文仍渲染且无控制台错误', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')

    await expect(page.locator('.pg-sub')).toBeHidden()

    await page.locator('[data-ux-tab="components"]').tap()
    await expect(page.locator('[data-ux="pg-body"]')).toBeVisible()
    expect(errors).toEqual([])
  })
})
