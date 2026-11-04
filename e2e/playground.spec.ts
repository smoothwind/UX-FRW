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
    await expect(page.locator('[data-ux="config-list"]')).toBeVisible()

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
    // 先等应用完成启动（App setup 内 setTheme 同步恢复偏好），慢机器上直接断言属性会跑在挂载前
    await expect(page.locator('[data-ux="pg-nav"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark')

    await page.locator('[data-ux-theme="light"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'light')
    await expect.poll(() => readPref(page, 'theme')).toBe('light')
  })

  test('黑暗主题叠加 .dark/.dark-silk 双类，表面为墨黑并持久化', async ({ page }) => {
    await page.goto('/')
    const html = page.locator('html')

    // 切换瞬间开启颜色过渡：与点击同步读取，约 240ms（--ux-dur-slow）后摘除
    const transitionAttr = await page.evaluate(() => {
      ;(document.querySelector('[data-ux-theme="dark-silk"]') as HTMLButtonElement).click()
      return document.documentElement.getAttribute('data-theme-transition')
    })
    expect(transitionAttr).toBe('')

    await expect(html).toHaveAttribute('data-color-mode', 'dark-silk')
    await expect(html).toHaveClass(/dark/)
    await expect(html).toHaveClass(/dark-silk/)
    // 过渡窗口结束，标记自动摘除（自动重试至多 5s）
    await expect(html).not.toHaveAttribute('data-theme-transition', '')
    await expect.poll(() => readPref(page, 'theme')).toBe('dark-silk')

    // 主表面为墨黑 silk-900 基色 + 顶部丝光渐变（非纯色平涂、非 navy 暗色）
    await expect(page.locator('.pg')).toHaveCSS('background-color', 'rgb(11, 12, 14)')
    const bgImage = await page.evaluate(
      () => getComputedStyle(document.querySelector('.pg') as Element).backgroundImage,
    )
    expect(bgImage).toContain('linear-gradient')

    await page.reload()
    await expect(page.locator('[data-ux="pg-nav"]')).toBeVisible({ timeout: 15_000 })
    await expect(html).toHaveAttribute('data-color-mode', 'dark-silk')
    await expect(html).toHaveClass(/dark-silk/)

    await page.locator('[data-ux-theme="dark"]').click()
    await expect(html).toHaveAttribute('data-color-mode', 'dark')
    // 切回 navy 暗色后 silk 类与 sheen 特效必须一并摘除
    await expect(html).not.toHaveClass(/dark-silk/)
    await expect(html).not.toHaveAttribute('data-ux-fx', /.+/)
  })

  test('丝光特效独立于主题：浅色主题挂 data-ux-fx 同样获得渐变表面', async ({ page }) => {
    await page.goto('/')
    const html = page.locator('html')

    // 浅色主题本身无渐变
    await expect(html).toHaveAttribute('data-color-mode', 'light')
    const lightBg = await page.evaluate(
      () => getComputedStyle(document.querySelector('.pg') as Element).backgroundImage,
    )
    expect(lightBg).not.toContain('linear-gradient')

    // 手动挂载 sheen 特效（特效通道与主题通道解耦，未来任意主题可复用）
    await page.evaluate(() => document.documentElement.setAttribute('data-ux-fx', 'sheen'))
    const lightSheen = await page.evaluate(
      () => getComputedStyle(document.querySelector('.pg') as Element).backgroundImage,
    )
    expect(lightSheen).toContain('linear-gradient')

    // 摘除后回落纯色
    await page.evaluate(() => document.documentElement.removeAttribute('data-ux-fx'))
    const lightReset = await page.evaluate(
      () => getComputedStyle(document.querySelector('.pg') as Element).backgroundImage,
    )
    expect(lightReset).not.toContain('linear-gradient')
  })

  test('丝光强度滑块：--ux-sheen-strength 即时生效并作用于纹理', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-fx-toggle="sheen"]').click()

    // 默认强度 1：面板级高光 0.06
    const base = await page.evaluate(
      () => getComputedStyle(document.querySelector('.fx-chip--sheen') as Element).backgroundImage,
    )
    expect(base).toContain('0.06')

    // 滑块 1.5 → 变量即时生效，纹理高光放大到 0.09（0.06 × 1.5）
    await page.locator('[data-ux-fx-sheen]').fill('1.5')
    const strength = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ux-sheen-strength').trim(),
    )
    expect(strength).toBe('1.5')
    const boosted = await page.evaluate(
      () => getComputedStyle(document.querySelector('.fx-chip--sheen') as Element).backgroundImage,
    )
    expect(boosted).toContain('0.09')
  })

  test('丝光/磨砂滑块互斥：始终只显示一个，跟随最后切换的特效', async ({ page }) => {
    await page.goto('/')

    await page.locator('[data-ux-fx-toggle="sheen"]').click()
    await expect(page.locator('[data-ux-fx-sheen]')).toHaveCount(1)
    await expect(page.locator('[data-ux-fx-opacity]')).toHaveCount(0)
    await expect(page.locator('input[type="range"]')).toHaveCount(1)

    // 再开磨砂：滑块跟随最后切换（磨砂），丝光滑块消失，仍只有一个
    await page.locator('[data-ux-fx-toggle="frost"]').click()
    await expect(page.locator('input[type="range"]')).toHaveCount(1)
    await expect(page.locator('[data-ux-fx-opacity]')).toHaveCount(1)
    await expect(page.locator('[data-ux-fx-sheen]')).toHaveCount(0)

    // 关掉磨砂：回到丝光滑块
    await page.locator('[data-ux-fx-toggle="frost"]').click()
    await expect(page.locator('[data-ux-fx-sheen]')).toHaveCount(1)
    await expect(page.locator('[data-ux-fx-opacity]')).toHaveCount(0)
  })

  test('金属质感特效：表面叠加镜面高光与拉丝纹理', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-theme="dark-silk"]').click()
    await page.locator('[data-ux-fx-toggle="metal"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-ux-fx', /metal/)

    const img = await page.evaluate(
      () => getComputedStyle(document.querySelector('.pg') as Element).backgroundImage,
    )
    expect(img).toContain('linear-gradient')
    expect(img).toContain('repeating-linear-gradient')

    // 与磨砂可叠加：金属表面 + 浮层磨砂（backdrop blur 仍在）
    await page.locator('[data-ux-fx-toggle="frost"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-ux-fx', /metal frost/)
    await page.keyboard.press('Control+k')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    const blur = await dialog.evaluate((el) => getComputedStyle(el).backdropFilter)
    expect(blur).toContain('blur')
  })

  test('磨砂玻璃特效：浮层半透明 + backdrop blur，不透明度可调', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-theme="dark-silk"]').click()
    await page.locator('[data-ux-fx-toggle="frost"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-ux-fx', /frost/)

    // 命令面板是浮层，磨砂下应半透明并带 backdrop blur
    await page.keyboard.press('Control+k')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    const readDialog = (): Promise<{ filter: string; alpha: number }> =>
      dialog.evaluate((el) => {
        const cs = getComputedStyle(el)
        const s = cs.backdropFilter || ''
        const bg = cs.backgroundColor
        const alpha = Number.parseFloat(bg.slice(0, -1).split(/[,\/]/).pop() ?? '')
        return { filter: s, alpha }
      })

    const glassy = await readDialog()
    expect(glassy.filter).toContain('blur')
    expect(glassy.alpha).toBeGreaterThan(0.5)
    expect(glassy.alpha).toBeLessThan(1)

    // 不透明度滑块 → 变量即时生效；等待主题过渡窗口（240ms）落定后浮层透明度随之降低
    await page.locator('[data-ux-fx-opacity]').fill('0.5')
    const opacity = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ux-frost-opacity').trim(),
    )
    expect(opacity).toBe('0.5')
    await page.waitForTimeout(320)
    const dialed = await readDialog()
    expect(dialed.alpha).toBeCloseTo(0.5, 1)
  })

  test('语言切换即时生效并持久化', async ({ page }) => {
    await page.goto('/')

    await page.locator('[data-ux-locale="en"]').click()
    await expect(page.locator('[data-ux-locale="en"]')).toHaveClass(/is-active/)
    await expect.poll(() => readPref(page, 'locale')).toBe('en')

    await page.reload()
    await expect(page.locator('[data-ux="pg-nav"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-ux-locale="en"]')).toHaveClass(/is-active/)

    await page.locator('[data-ux-locale="zh-CN"]').click()
    await expect(page.locator('[data-ux-locale="zh-CN"]')).toHaveClass(/is-active/)
  })

  test('UxSplash 出场动画：亮点成窗体后自动收场卸载', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="patterns"]').click()
    await page.locator('[data-ux-splash-play]').click()

    const splash = page.locator('[data-ux="splash"]')
    await expect(splash).toBeVisible()
    await expect(splash).toHaveAttribute('data-phase', /dot|expand|settle/)

    // 三段动画（默认 1s）+ 收场淡出后卸载
    await expect(splash).toHaveCount(0, { timeout: 3000 })
  })

  test('UxSplash 等待就绪：settle 后驻留，宿主 finish 后才收场', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ux-tab="patterns"]').click()
    await page.locator('[data-ux-splash-wait]').click()

    const splash = page.locator('[data-ux="splash"]')
    await expect(splash).toBeVisible()
    // 内容落位后进入驻留巡游
    await expect(splash).toHaveAttribute('data-phase', 'settle', { timeout: 2000 })
    // 距开场约 2s：普通模式此时已收场，等待模式仍驻留
    await page.waitForTimeout(1000)
    await expect(splash).toBeVisible()
    // 演示宿主 2.4s 自动 finish → 收场卸载
    await expect(splash).toHaveCount(0, { timeout: 3000 })
  })
})
