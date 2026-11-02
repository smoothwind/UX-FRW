import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyTheme,
  DARK_CLASS,
  FX_ATTR,
  FX_FROST,
  FX_METAL,
  FX_SHEEN,
  SILK_CLASS,
  THEME_ATTR,
  THEME_TRANSITION_ATTR,
  THEME_TRANSITION_MS,
} from './index'

const root = document.documentElement

describe('applyTheme（主题三通道同步）', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    root.className = ''
    root.removeAttribute(THEME_ATTR)
    root.removeAttribute(FX_ATTR)
    root.removeAttribute(THEME_TRANSITION_ATTR)
    root.style.colorScheme = ''
  })

  it('dark-silk 叠加双类：data-color-mode、.dark/.dark-silk、colorScheme 同步', () => {
    const resolved = applyTheme('dark-silk')
    expect(resolved).toBe('dark')
    expect(root.getAttribute(THEME_ATTR)).toBe('dark-silk')
    expect(root.classList.contains(DARK_CLASS)).toBe(true)
    expect(root.classList.contains(SILK_CLASS)).toBe(true)
    expect(root.style.colorScheme).toBe('dark')
  })

  it('dark-silk 默认携带 sheen 视觉特效，其余主题不带', () => {
    applyTheme('dark-silk')
    expect(root.getAttribute(FX_ATTR)).toBe(FX_SHEEN)
    applyTheme('dark')
    expect(root.hasAttribute(FX_ATTR)).toBe(false)
  })

  it('fx 选项显式覆盖主题默认：叠加/清空/跨主题', () => {
    applyTheme('dark-silk', { fx: [FX_FROST] })
    expect(root.getAttribute(FX_ATTR)).toBe(FX_FROST)
    applyTheme('dark-silk', { fx: [FX_SHEEN, FX_FROST] })
    expect(root.getAttribute(FX_ATTR)).toBe(`${FX_SHEEN} ${FX_FROST}`)
    applyTheme('dark-silk', { fx: [] })
    expect(root.hasAttribute(FX_ATTR)).toBe(false)
    applyTheme('light', { fx: [FX_METAL] })
    expect(root.getAttribute(FX_ATTR)).toBe(FX_METAL)
  })

  it('切回 light 时 silk 类与 colorScheme 一并复位', () => {
    applyTheme('dark-silk')
    applyTheme('light')
    expect(root.getAttribute(THEME_ATTR)).toBe('light')
    expect(root.classList.contains(DARK_CLASS)).toBe(false)
    expect(root.classList.contains(SILK_CLASS)).toBe(false)
    expect(root.style.colorScheme).toBe('light')
  })

  it('system 跟随 prefers-color-scheme 且不带 silk 类', () => {
    vi.stubGlobal(
      'window',
      Object.assign(window, { matchMedia: () => ({ matches: true, addEventListener: () => () => {} }) }),
    )
    const resolved = applyTheme('system')
    expect(resolved).toBe('dark')
    expect(root.getAttribute(THEME_ATTR)).toBe('dark')
    expect(root.classList.contains(SILK_CLASS)).toBe(false)
    vi.unstubAllGlobals()
  })

  it('切换瞬间设置过渡标记，超时后摘除', () => {
    applyTheme('dark-silk')
    expect(root.hasAttribute(THEME_TRANSITION_ATTR)).toBe(true)
    vi.advanceTimersByTime(THEME_TRANSITION_MS)
    expect(root.hasAttribute(THEME_TRANSITION_ATTR)).toBe(false)
  })

  it('过渡窗口内连续切换只保留一个计时器（重置不叠加）', () => {
    applyTheme('dark')
    vi.advanceTimersByTime(THEME_TRANSITION_MS - 10)
    applyTheme('dark-silk')
    vi.advanceTimersByTime(THEME_TRANSITION_MS - 10)
    // 距第二次切换仅 230ms，标记应仍在
    expect(root.hasAttribute(THEME_TRANSITION_ATTR)).toBe(true)
    vi.advanceTimersByTime(10)
    expect(root.hasAttribute(THEME_TRANSITION_ATTR)).toBe(false)
  })
})
