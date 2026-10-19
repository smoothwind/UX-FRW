import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useDockLayout, type DockLayoutOptions } from './useDockLayout'

let seq = 0

function makeOptions(over: Partial<DockLayoutOptions> = {}): DockLayoutOptions {
  seq++
  return {
    key: `dock-test-${seq}`,
    panels: {
      explorer: { zone: 'left' },
      output: { zone: 'bottom' },
      search: { zone: null },
      inspector: { zone: 'right' },
    },
    ...over,
  }
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDockLayout 初始化', () => {
  it('seed 缺省 zone 视为 left，active 取首个可见面板', () => {
    const dock = useDockLayout(makeOptions())
    expect(dock.panelInZone('left')).toBe('explorer')
    expect(dock.panelInZone('right')).toBe('inspector')
    expect(dock.isVisible('search')).toBe(false)
    expect(dock.active.value).toBe('explorer')
  })

  it('损坏的持久化数据回退默认 seed', () => {
    const options = makeOptions()
    localStorage.setItem(options.key, '{broken json!!')
    const dock = useDockLayout(options)
    expect(dock.panelInZone('left')).toBe('explorer')
    expect(dock.panelInZone('bottom')).toBe('output')
  })
})

describe('useDockLayout activate / hide / toggle', () => {
  it('activate 同区占用者让位隐藏', () => {
    const dock = useDockLayout(
      makeOptions({ panels: { a: { zone: 'left' }, b: { zone: null } } }),
    )
    dock.activate('b')
    expect(dock.panelInZone('left')).toBe('b')
    expect(dock.isVisible('a')).toBe(false)
    expect(dock.isActive('b')).toBe(true)
  })

  it('activate 清除悬浮态与最小化', () => {
    const dock = useDockLayout(
      makeOptions({ panels: { a: { zone: null, float: { x: 10, y: 10, w: 400, h: 300 } } } }),
    )
    dock.minimize('a')
    dock.activate('a')
    expect(dock.isFloating('a')).toBe(false)
    expect(dock.isMinimized('a')).toBe(false)
    expect(dock.geomOf('a')).toBeNull()
  })

  it('toggle：显示且活动 → 隐藏；再次 toggle → 激活', () => {
    const dock = useDockLayout(makeOptions({ panels: { a: { zone: 'left' } } }))
    dock.toggle('a')
    expect(dock.isVisible('a')).toBe(false)
    expect(dock.active.value).toBeNull()
    dock.toggle('a')
    expect(dock.panelInZone('left')).toBe('a')
  })

  it('toggle：悬浮未最小化 → 仅置焦不回收', () => {
    const dock = useDockLayout(
      makeOptions({ panels: { a: { zone: null, float: { x: 10, y: 10, w: 400, h: 300 } } } }),
    )
    const zBefore = dock.zOf('a')
    dock.toggle('a')
    expect(dock.isFloating('a')).toBe(true)
    expect(dock.zOf('a')).toBeGreaterThan(zBefore)
  })

  it('hide 隐藏后 active 回落到同区现存面板', () => {
    const dock = useDockLayout(
      makeOptions({ panels: { a: { zone: 'left' }, b: { zone: 'left' } } }),
    )
    expect(dock.active.value).toBe('a')
    dock.hide('a')
    expect(dock.panelInZone('left')).toBe('b')
    expect(dock.active.value).toBe('b')
  })
})

describe('useDockLayout dock 交换语义', () => {
  it('停靠→停靠：占用者回来源区', () => {
    const dock = useDockLayout(
      makeOptions({ panels: { a: { zone: 'left' }, b: { zone: 'right' } } }),
    )
    dock.dock('a', 'right')
    expect(dock.panelInZone('right')).toBe('a')
    expect(dock.panelInZone('left')).toBe('b')
    expect(dock.isActive('a')).toBe(true)
  })

  it('悬浮→停靠：占用者转悬浮并获得新几何', () => {
    const dock = useDockLayout(
      makeOptions({
        panels: {
          a: { zone: null, float: { x: 10, y: 10, w: 400, h: 300 } },
          b: { zone: 'right' },
        },
      }),
    )
    dock.dock('a', 'right')
    expect(dock.panelInZone('right')).toBe('a')
    expect(dock.isFloating('b')).toBe(true)
    expect(dock.geomOf('b')).toEqual({ x: 120, y: 90, w: 480, h: 360 })
  })

  it('同区 dock 无操作', () => {
    const dock = useDockLayout(makeOptions({ panels: { a: { zone: 'left' } } }))
    dock.dock('a', 'left')
    expect(dock.panelInZone('left')).toBe('a')
  })
})

describe('useDockLayout 悬浮层', () => {
  it('float 记录 lastZone 并级联偏移几何', () => {
    const dock = useDockLayout(makeOptions({ panels: { a: { zone: 'left' }, b: { zone: null } } }))
    dock.float('a')
    expect(dock.isFloating('a')).toBe(true)
    expect(dock.geomOf('a')).toEqual({ x: 120, y: 90, w: 480, h: 360 })
    dock.float('b')
    expect(dock.geomOf('b')).toEqual({ x: 148, y: 118, w: 480, h: 360 })
    dock.dockBack('a')
    dock.float('a')
    expect(dock.panelInZone('left')).toBeNull()
    expect(dock.isFloating('a')).toBe(true)
  })

  it('focusFloat 置焦递增 z 序', () => {
    const dock = useDockLayout(
      makeOptions({
        panels: {
          a: { zone: null, float: { x: 0, y: 0, w: 400, h: 300 } },
          b: { zone: null, float: { x: 0, y: 0, w: 400, h: 300 } },
        },
      }),
    )
    const zA0 = dock.zOf('a')
    dock.focusFloat('a')
    dock.focusFloat('b')
    expect(dock.zOf('b')).toBeGreaterThan(dock.zOf('a'))
    dock.focusFloat('a')
    expect(dock.zOf('a')).toBeGreaterThan(dock.zOf('b'))
    expect(zA0).toBe(100)
  })

  it('dockBack 回最近停靠区', () => {
    const dock = useDockLayout(
      makeOptions({
        panels: { a: { zone: 'bottom' } },
      }),
    )
    dock.float('a')
    expect(dock.isFloating('a')).toBe(true)
    dock.dockBack('a')
    expect(dock.panelInZone('bottom')).toBe('a')
  })

  it('minimize / restore：最小化收层叠，恢复置焦', () => {
    const dock = useDockLayout(
      makeOptions({ panels: { a: { zone: null, float: { x: 0, y: 0, w: 400, h: 300 } } } }),
    )
    dock.minimize('a')
    expect(dock.isMinimized('a')).toBe(true)
    expect(dock.active.value).toBeNull()
    dock.restore('a')
    expect(dock.isMinimized('a')).toBe(false)
    expect(dock.isActive('a')).toBe(true)
    dock.minimize('a')
    dock.activate('a')
    expect(dock.isMinimized('a')).toBe(false)
  })

  it('setGeom 钳制到窗口与最小尺寸', () => {
    const dock = useDockLayout(
      makeOptions({ panels: { a: { zone: null, float: { x: 0, y: 0, w: 400, h: 300 } } } }),
    )
    dock.setGeom('a', { w: 9999, h: -50, x: -999, y: 99999 })
    const g = dock.geomOf('a')!
    expect(g.w).toBe(1200)
    expect(g.h).toBe(180)
    expect(g.x).toBe(-40)
    expect(g.y).toBe(window.innerHeight - 60)
  })

  it('未悬浮面板 setGeom 无效', () => {
    const dock = useDockLayout(makeOptions({ panels: { a: { zone: 'left' } } }))
    dock.setGeom('a', { x: 50 })
    expect(dock.geomOf('a')).toBeNull()
  })
})

describe('useDockLayout 尺寸与拖拽', () => {
  it('resizeZone 钳制到 limits', () => {
    const dock = useDockLayout(
      makeOptions({ limits: { left: [200, 560] } }),
    )
    dock.resizeZone('left', 50)
    expect(dock.sizes.left).toBe(200)
    dock.resizeZone('left', 9999)
    expect(dock.sizes.left).toBe(560)
    dock.resizeZone('left', 333.7)
    expect(dock.sizes.left).toBe(334)
  })

  it('beginDrag / endDrag 控制 dragging', () => {
    const dock = useDockLayout(makeOptions())
    dock.beginDrag('explorer')
    expect(dock.dragging.value).toBe('explorer')
    dock.endDrag()
    expect(dock.dragging.value).toBeNull()
    dock.beginDrag('ghost')
    expect(dock.dragging.value).toBeNull()
  })
})

describe('useDockLayout 持久化', () => {
  it('变更防抖写盘，新实例按 key 恢复', async () => {
    vi.useFakeTimers()
    const options = makeOptions({
      panels: { a: { zone: 'left' }, b: { zone: 'right' } },
      sizes: { left: 300 },
    })
    const dock = useDockLayout(options)
    dock.dock('a', 'bottom')
    dock.resizeZone('left', 420)
    await nextTick()
    vi.advanceTimersByTime(200)

    const raw = JSON.parse(localStorage.getItem(options.key)!) as {
      panels: Record<string, { zone: string | null }>
      sizes: Record<string, number>
    }
    expect(raw.panels.a.zone).toBe('bottom')
    expect(raw.panels.b.zone).toBe('right')
    expect(raw.sizes.left).toBe(420)

    const dock2 = useDockLayout(options)
    expect(dock2.panelInZone('bottom')).toBe('a')
    expect(dock2.panelInZone('right')).toBe('b')
    expect(dock2.sizes.left).toBe(420)
  })

  it('reset 恢复 seed 并清除存储', () => {
    vi.useFakeTimers()
    const options = makeOptions({ panels: { a: { zone: 'left' } } })
    const dock = useDockLayout(options)
    dock.float('a')
    dock.resizeZone('left', 500)
    vi.advanceTimersByTime(200)

    dock.reset()
    expect(dock.panelInZone('left')).toBe('a')
    expect(dock.sizes.left).toBe(260)
    expect(localStorage.getItem(options.key)).toBeNull()

    vi.advanceTimersByTime(200)
    expect(localStorage.getItem(options.key)).toBeNull()
  })

  it('非法持久化 zone 值视为隐藏', () => {
    const options = makeOptions({ panels: { a: { zone: 'left' } } })
    localStorage.setItem(
      options.key,
      JSON.stringify({ panels: { a: { zone: 'top-left' } } }),
    )
    const dock = useDockLayout(options)
    expect(dock.isVisible('a')).toBe(false)
  })
})
