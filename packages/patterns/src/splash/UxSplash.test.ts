import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import { setPlatformAdapter } from '@ux/services'
import UxSplash from './UxSplash.vue'

enableAutoUnmount(afterEach)

/** 手控帧时钟：rAF 回调入队，advanceFrames 以虚拟时钟统一派发（组件的 performance.now 同步虚拟化） */
let now = 0
let rafCbs: Map<number, FrameRequestCallback>

function advanceFrames(ms: number): void {
  now += ms
  const cbs = [...rafCbs.values()]
  rafCbs.clear()
  for (const cb of cbs) cb(now)
}

function mountSplash(props: Record<string, unknown> = {}): VueWrapper {
  return mount(UxSplash, { props: { open: true, label: '启动', ...props }, attachTo: document.body })
}

function root(): HTMLElement {
  return document.body.querySelector<HTMLElement>('[data-ux="splash"]') as HTMLElement
}

beforeEach(() => {
  document.body.innerHTML = ''
  now = 0
  rafCbs = new Map()
  let seq = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback): number => {
    seq += 1
    rafCbs.set(seq, cb)
    return seq
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number): void => {
    rafCbs.delete(id)
  })
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})

afterEach(() => {
  setPlatformAdapter(null)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('UxSplash', () => {
  it('三段推进 dot→expand→settle，播完自动收场并派发 done', async () => {
    const w = mountSplash()
    await nextTick()
    await nextTick()

    advanceFrames(0) // 首帧：建立动画原点
    await nextTick()
    expect(root().dataset.phase).toBe('dot')

    advanceFrames(360)
    await nextTick()
    expect(root().dataset.phase).toBe('expand')
    advanceFrames(400)
    await nextTick()
    expect(root().dataset.phase).toBe('settle')

    // t 达 1000ms：排入收场计时（60ms 缓冲）→ leaving → gone + done
    advanceFrames(240)
    await nextTick()
    expect(w.emitted('done')).toBeUndefined()
    vi.advanceTimersByTime(60)
    await nextTick()
    expect(root().dataset.phase).toBe('leaving')
    vi.advanceTimersByTime(240)
    await nextTick()
    expect(root().dataset.phase).toBe('gone')
    expect(w.emitted('done')).toHaveLength(1)
  })

  it('Esc 跳过：派发 skip 并立即收场', async () => {
    const w = mountSplash()
    await nextTick()
    await nextTick()

    advanceFrames(0) // 原点帧
    await nextTick()
    advanceFrames(400) // expand 中途（t=400）
    await nextTick()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(w.emitted('skip')).toHaveLength(1)
    await nextTick()
    expect(root().dataset.phase).toBe('leaving')
    vi.advanceTimersByTime(240)
    await nextTick()
    expect(w.emitted('done')).toHaveLength(1)
  })

  it('waiting 模式：settle 后驻留巡游不自动收场，finish() 才收场并调用 closeSplash', async () => {
    const closeSplash = vi.fn()
    setPlatformAdapter({ name: 'test', closeSplash })
    const w = mountSplash({ waiting: true })
    await nextTick()
    await nextTick()

    advanceFrames(0) // 原点帧
    await nextTick()
    advanceFrames(1000) // t 达 1000ms → intro 完成 → 进入轮廓巡游
    await nextTick()
    expect(root().dataset.phase).toBe('settle')
    advanceFrames(1000) // 巡游期间继续驻留
    await nextTick()
    expect(w.emitted('done')).toBeUndefined()

    ;(w.vm as unknown as { finish(): void }).finish()
    await nextTick()
    expect(root().dataset.phase).toBe('leaving')
    vi.advanceTimersByTime(240)
    await nextTick()
    expect(w.emitted('done')).toHaveLength(1)
    expect(closeSplash).toHaveBeenCalledTimes(1)
  })

  it('prefers-reduced-motion：跳过动画直达 settle，照常收场', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true } as unknown as MediaQueryList),
    )
    const w = mountSplash()
    await nextTick()
    await nextTick()

    expect(root().dataset.phase).toBe('settle')
    vi.advanceTimersByTime(60 + 240)
    expect(w.emitted('done')).toHaveLength(1)
  })
})
