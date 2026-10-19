import { expect, test } from '@playwright/test'

test.describe('键盘可达性', () => {
  test('Ctrl+K 打开命令面板：Roving 高亮 + Esc 关闭', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+k')

    const palette = page.locator('.ux-cmdk')
    await expect(palette).toBeVisible()

    const input = page.getByRole('combobox')
    await expect(input).toBeFocused()
    await expect(page.getByRole('option').first()).toBeVisible()

    const highlight = await input.getAttribute('aria-activedescendant')
    expect(highlight).toBeTruthy()

    await page.keyboard.press('ArrowDown')
    await expect(input).not.toHaveAttribute('aria-activedescendant', highlight ?? '')

    await page.keyboard.press('Escape')
    await expect(palette).toBeHidden()
  })

  test('UxDropdown：↓ 打开菜单并聚焦，Esc 关闭并归还焦点', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="components"]').click()

    const trigger = page.getByRole('button', { name: '操作菜单' })
    await trigger.focus()
    await page.keyboard.press('ArrowDown')

    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await expect(menu).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  })

  test('UxTabs：→ 移动并激活相邻页签', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="shell"]').click()

    const list = page.locator('[data-ux="tabs"]').first()
    await expect(list).toBeVisible()

    const active = list.locator('[role="tab"][aria-selected="true"]')
    await expect(active).toHaveAttribute('data-ux-tab-id', 'doc-readme')

    await active.focus()
    await page.keyboard.press('ArrowRight')
    await expect(list.locator('[role="tab"][aria-selected="true"]')).toHaveAttribute(
      'data-ux-tab-id',
      'doc-query',
    )

    await page.keyboard.press('ArrowLeft')
    await expect(list.locator('[role="tab"][aria-selected="true"]')).toHaveAttribute(
      'data-ux-tab-id',
      'doc-readme',
    )
  })
})
