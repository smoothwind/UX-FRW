import { expect, test } from '@playwright/test'

test.describe('TourGuide（首次访问自动导览）', () => {
  test('自动启动 → 键盘推进 → Esc 退出并记忆', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('uxkit.playground.tour'))
    await page.reload()

    await page.locator('[data-ux-tab="patterns"]').click()

    const tour = page.locator('[data-ux="tour"]')
    const card = page.locator('[data-ux-part="tour-card"]')
    await expect(tour).toBeVisible()
    await expect(card.locator('.ux-tour__step')).toHaveText('1 / 4')

    await page.keyboard.press('ArrowRight')
    await expect(card.locator('.ux-tour__step')).toHaveText('2 / 4')
    await expect(page.locator('[data-ux-part="tour-spot"]')).toBeVisible()

    await page.keyboard.press('ArrowLeft')
    await expect(card.locator('.ux-tour__step')).toHaveText('1 / 4')

    await page.keyboard.press('Escape')
    await expect(tour).toBeHidden()
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('uxkit.playground.tour')))
      .toBe('1')

    await page.reload()
    await page.locator('[data-ux-tab="patterns"]').click()
    await expect(page.locator('[data-ux="tour"]')).toBeHidden()
  })

  test('完成后 spotlight 消失且不阻塞后续交互', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('uxkit.playground.tour'))
    await page.reload()
    await page.locator('[data-ux-tab="patterns"]').click()

    await expect(page.locator('[data-ux="tour"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-ux="tour"]')).toBeHidden()

    const header = page.getByRole('columnheader', { name: 'score' })
    await header.click()
    await expect(header).toHaveAttribute('aria-sort', 'ascending')
  })
})
