import { expect, test } from '@playwright/test'

test.describe('表单控件组（原生底座）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="components"]').click()
  })

  test('UxCheckbox：label 点击切换 + Space 键盘切换', async ({ page }) => {
    const field = page.locator('[data-ux="checkbox"]').first()
    const input = field.locator('input[type="checkbox"]')
    await expect(input).not.toBeChecked()

    await field.locator('label').click()
    await expect(input).toBeChecked()

    // 键盘切换为原生行为，无 JS 状态机
    await input.focus()
    await page.keyboard.press('Space')
    await expect(input).not.toBeChecked()
  })

  test('UxSwitch：role=switch + Space 原生切换（初始 true，两次按键回归）', async ({ page }) => {
    const field = page.locator('[data-ux="switch"]').first()
    const input = field.locator('input[role="switch"]')
    await expect(input).toHaveAttribute('role', 'switch')

    // 演示区初始值为 true；期望状态必须走 { checked } 选项（裸布尔会被当 options 吞掉）
    const before = await input.isChecked()
    await input.focus()
    await page.keyboard.press('Space')
    await expect(input).toBeChecked({ checked: !before })
    await page.keyboard.press('Space')
    await expect(input).toBeChecked({ checked: before })
  })

  test('UxSelect：原生 select 选择选项并回写，chevron 装饰不劫持指针', async ({ page }) => {
    const select = page.locator('[data-ux="select"] select').first()
    await select.selectOption('oracle')
    await expect(select).toHaveValue('oracle')
    await expect(page.locator('[data-ux="select"] .ux-select__chevron').first()).toBeVisible()
  })

  test('UxSlider：方向键步进（原生键盘）并同步当前值显示', async ({ page }) => {
    const slider = page.locator('[data-ux="slider"] input[type="range"]').first()
    await slider.focus()
    const before = Number(await slider.inputValue())

    await page.keyboard.press('ArrowRight')
    await expect(slider).toHaveValue(String(before + 1))
    await expect(page.locator('[data-ux="slider"] output').first()).toHaveText(String(before + 1))
  })
})
