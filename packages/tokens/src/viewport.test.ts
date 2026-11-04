import { afterEach, describe, expect, it } from 'vitest'
import { BP, VIEWPORT_ATTR, applyViewport, resolveViewport, type ViewportTier } from './viewport'

interface MockMQL {
  matches: boolean
  addEventListener: (type: string, cb: () => void) => void
  removeEventListener: (type: string, cb: () => void) => void
  set(matches: boolean): void
}

/** 构造可控 matchMedia：queries 为特征→初始 matches 表 */
function installMatchMedia(initial: Record<string, boolean>): { fire: (q: string, matches: boolean) => void } {
  const registry = new Map<string, MockMQL>()
  const matchMedia = (query: string): MockMQL => {
    const existing = registry.get(query)
    if (existing) return existing
    const listeners: (() => void)[] = []
    const mql: MockMQL = {
      matches: initial[query] ?? false,
      addEventListener: (_t, cb) => listeners.push(cb),
      removeEventListener: (_t, cb) => {
        const i = listeners.indexOf(cb)
        if (i >= 0) listeners.splice(i, 1)
      },
      set(matches: boolean) {
        mql.matches = matches
        for (const cb of listeners) cb()
      },
    }
    registry.set(query, mql)
    return mql
  }
  // 普通函数赋值（vi.fn 的 Mock 泛型与 MediaQueryList 签名不兼容）
  Object.assign(window, { matchMedia })
  return {
    fire: (q, matches) => {
      const mql = registry.get(q)
      if (!mql) throw new Error(`未注册的查询：${q}`)
      mql.set(matches)
    },
  }
}

afterEach(() => {
  document.documentElement.removeAttribute(VIEWPORT_ATTR)
})

describe('BP 断点登记', () => {
  it('与 layout.css --ux-bp-* 双源同值', () => {
    expect(BP).toEqual({ sm: 600, md: 960, lg: 1280 })
  })
})

describe('resolveViewport', () => {
  it('宽屏细指针横屏 → lg / fine / landscape', () => {
    installMatchMedia({ '(pointer: coarse)': false, '(orientation: portrait)': false })
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true })
    expect(resolveViewport()).toEqual({ tier: 'lg', coarse: false, orientation: 'landscape' })
  })

  it('窄屏粗指针竖屏 → sm / coarse / portrait', () => {
    installMatchMedia({ '(pointer: coarse)': true, '(orientation: portrait)': true })
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true })
    const state = resolveViewport()
    expect(state.tier).toBe<ViewportTier>('sm')
    expect(state.coarse).toBe(true)
    expect(state.orientation).toBe('portrait')
  })

  it('sm 档含手机横排（600~959）；md 起点 960', () => {
    installMatchMedia({})
    Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true })
    expect(resolveViewport().tier).toBe('sm')
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
    expect(resolveViewport().tier).toBe('md')
    Object.defineProperty(window, 'innerWidth', { value: 1300, configurable: true })
    expect(resolveViewport().tier).toBe('lg')
  })
})

describe('applyViewport', () => {
  it('立即写根属性：档位 + coarse + orientation', () => {
    installMatchMedia({
      '(min-width: 960px)': false,
      '(min-width: 1280px)': false,
      '(pointer: coarse)': true,
      '(orientation: portrait)': true,
    })
    applyViewport()
    // <960 属 sm 档（含手机横排 600~959）；md 起点 960
    expect(document.documentElement.getAttribute(VIEWPORT_ATTR)).toBe('sm coarse portrait')
  })

  it('断点变化持续更新；取消后停止并摘除属性', () => {
    const { fire } = installMatchMedia({
      '(min-width: 960px)': false,
      '(min-width: 1280px)': false,
      '(pointer: coarse)': false,
      '(orientation: portrait)': false,
    })
    const stop = applyViewport()
    expect(document.documentElement.getAttribute(VIEWPORT_ATTR)).toBe('sm fine landscape')

    fire('(pointer: coarse)', true)
    expect(document.documentElement.getAttribute(VIEWPORT_ATTR)).toBe('sm coarse landscape')

    fire('(min-width: 960px)', true)
    expect(document.documentElement.getAttribute(VIEWPORT_ATTR)).toBe('md coarse landscape')

    fire('(min-width: 1280px)', true)
    fire('(orientation: portrait)', true)
    expect(document.documentElement.getAttribute(VIEWPORT_ATTR)).toBe('lg coarse portrait')

    stop()
    expect(document.documentElement.hasAttribute(VIEWPORT_ATTR)).toBe(false)
    // 取消后再变化不再更新
    fire('(pointer: coarse)', false)
    expect(document.documentElement.hasAttribute(VIEWPORT_ATTR)).toBe(false)
  })
})
