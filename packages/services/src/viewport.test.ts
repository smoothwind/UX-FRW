import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkViewportHealth, installViewportHealthWatch, type ViewportHealthReport } from './viewport'

function stubViewport(over: {
  innerWidth: number
  outerWidth: number
  clientWidth: number
  devicePixelRatio: number
  innerHeight?: number
}): void {
  const win = window as unknown as Record<string, number>
  win.innerWidth = over.innerWidth
  win.innerHeight = over.innerHeight ?? 800
  win.outerWidth = over.outerWidth
  win.devicePixelRatio = over.devicePixelRatio
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: over.clientWidth,
  })
}

const cleanups: Array<() => void> = []

beforeEach(() => {
  // happy-dom 缺省值：健康的单屏窗口
  stubViewport({ innerWidth: 1280, outerWidth: 1284, clientWidth: 1265, devicePixelRatio: 1 })
})

afterEach(() => {
  while (cleanups.length) cleanups.pop()!()
  vi.restoreAllMocks()
})

describe('checkViewportHealth', () => {
  it('正常视口判定为健康', () => {
    const report = checkViewportHealth()
    expect(report.healthy).toBe(true)
    expect(report.issues).toEqual([])
  })

  it('innerWidth 超过 outerWidth → 判定窗口几何失配', () => {
    stubViewport({ innerWidth: 1707, outerWidth: 1284, clientWidth: 1707, devicePixelRatio: 1.5 })
    const report = checkViewportHealth()
    expect(report.healthy).toBe(false)
    expect(report.issues.some((i) => i.includes('窗口几何与渲染层失配'))).toBe(true)
  })

  it('innerWidth 超过 clientWidth（扣除滚动条容差）→ 判定文档水平溢出', () => {
    stubViewport({ innerWidth: 1280, outerWidth: 1284, clientWidth: 1200, devicePixelRatio: 1 })
    // 差值 80px，远超 20px 滚动条容差
    const report = checkViewportHealth()
    expect(report.healthy).toBe(false)
    expect(report.issues.some((i) => i.includes('水平溢出'))).toBe(true)
  })

  it('滚动条常态差值（≤20px）不误报', () => {
    stubViewport({ innerWidth: 1280, outerWidth: 1284, clientWidth: 1265, devicePixelRatio: 1 })
    const report = checkViewportHealth()
    expect(report.healthy).toBe(true)
    expect(report.issues).toEqual([])
  })

  it('devicePixelRatio 非法 → 报渲染缩放异常', () => {
    stubViewport({ innerWidth: 1280, outerWidth: 1284, clientWidth: 1279, devicePixelRatio: 0 })
    const report = checkViewportHealth()
    expect(report.healthy).toBe(false)
    expect(report.issues.some((i) => i.includes('devicePixelRatio'))).toBe(true)
  })

  it('字段完整回传，便于宿主日志采集', () => {
    stubViewport({ innerWidth: 800, outerWidth: 804, clientWidth: 799, devicePixelRatio: 2 })
    const report: ViewportHealthReport = checkViewportHealth()
    expect(report).toMatchObject({
      healthy: true,
      innerWidth: 800,
      outerWidth: 804,
      clientWidth: 799,
      devicePixelRatio: 2,
      issues: [],
    })
  })
})

describe('installViewportHealthWatch', () => {
  it('安装即首检，新问题签名触发一次上报，恢复健康后重置', async () => {
    stubViewport({ innerWidth: 1707, outerWidth: 1284, clientWidth: 1707, devicePixelRatio: 1.5 })
    const onReport = vi.fn()
    cleanups.push(installViewportHealthWatch({ onReport }))
    // 首检同步执行
    expect(onReport).toHaveBeenCalledTimes(1)
    expect(onReport.mock.calls[0][0].length).toBeGreaterThan(0)

    // 同一签名持续存在 → 不重复上报
    window.dispatchEvent(new Event('resize'))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(onReport).toHaveBeenCalledTimes(1)

    // 恢复健康 → 重置签名，再次出现同一问题会重新上报
    stubViewport({ innerWidth: 1280, outerWidth: 1284, clientWidth: 1279, devicePixelRatio: 1 })
    window.dispatchEvent(new Event('resize'))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(onReport).toHaveBeenCalledTimes(1)

    stubViewport({ innerWidth: 1707, outerWidth: 1284, clientWidth: 1707, devicePixelRatio: 1.5 })
    window.dispatchEvent(new Event('resize'))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(onReport).toHaveBeenCalledTimes(2)
  })

  it('卸载后不再监听 resize', async () => {
    const onReport = vi.fn()
    const dispose = installViewportHealthWatch({ onReport })
    // 安装时首检：视口健康，不上报
    expect(onReport).toHaveBeenCalledTimes(0)
    dispose()
    stubViewport({ innerWidth: 1707, outerWidth: 1284, clientWidth: 1707, devicePixelRatio: 1.5 })
    window.dispatchEvent(new Event('resize'))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(onReport).toHaveBeenCalledTimes(0)
  })
})
