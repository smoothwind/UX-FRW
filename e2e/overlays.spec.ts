import { expect, test } from '@playwright/test'

test.describe('浮层与反馈', () => {
  test('UxPopover：点击开合、Esc 关闭、外部点击关闭', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="components"]').click()

    const trigger = page.getByRole('button', { name: '打开浮层' })
    const panel = page.getByRole('dialog', { name: '过滤器' })

    await expect(panel).toBeHidden()

    await trigger.click()
    await expect(panel).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()

    await trigger.click()
    await expect(panel).toBeVisible()
    await page.locator('.pg-title').click()
    await expect(panel).toBeHidden()
  })

  test('UxDialog：焦点陷阱 + Esc 关闭归还焦点', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="components"]').click()

    const opener = page.getByRole('button', { name: '打开对话框' })
    await opener.click()

    const dialog = page.getByRole('dialog', { name: '示例对话框' })
    await expect(dialog).toBeVisible()

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      const trapped = await page.evaluate(
        () => document.activeElement?.closest('[role="dialog"]') !== null,
      )
      expect(trapped).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  })

  test('UxToast：通知渲染为 role=status 且层级叠加', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="components"]').click()

    const host = page.locator('.ux-toast-host')
    await expect(host).toHaveAttribute('aria-live', 'polite')
    await expect(page.locator('.ux-toast')).toHaveCount(0)

    await page.getByRole('button', { name: 'success', exact: true }).click()
    await expect(page.locator('.ux-toast[role="status"]')).toContainText('操作成功')

    await page.getByRole('button', { name: 'danger', exact: true }).click()
    await expect(page.locator('.ux-toast')).toHaveCount(2)
    await expect(page.locator('.ux-toast--danger')).toContainText('操作失败')
  })
})
