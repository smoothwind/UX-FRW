import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useOverflowPosition, type Placement } from './useOverflowPosition'

function mountPosition(opts: {
  placement?: Placement
  offset?: number
  margin?: number
  getRect?: () => { left: number; top: number; right: number; bottom: number }
}) {
  const active = ref(false)
  const anchor = ref<HTMLElement | null>(null)
  const popper = ref<HTMLElement | null>(null)
  const Host = defineComponent({
    setup() {
      const update = useOverflowPosition({
        anchor,
        popper,
        active: () => active.value,
        ...opts,
      })
      return { update, anchor, popper }
    },
    template:
      '<div><span ref="anchor" id="anchor" /><div ref="popper" id="popper" style="position:fixed" /></div>',
  })
  const wrapper = mount(Host, { attachTo: document.body })
  const anchorEl = wrapper.find('#anchor').element as HTMLElement
  const popperEl = wrapper.find('#popper').element as HTMLElement
  Object.defineProperty(anchorEl, 'getBoundingClientRect', {
    value: () => ({ left: 100, top: 100, right: 200, bottom: 130, width: 100, height: 30 }),
    configurable: true,
  })
  Object.defineProperty(popperEl, 'offsetWidth', { value: 80, configurable: true })
  Object.defineProperty(popperEl, 'offsetHeight', { value: 50, configurable: true })
  return { wrapper, active, anchor, popper, anchorEl, popperEl }
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 1
  })
  vi.stubGlobal('ResizeObserver', class {
    observe(): void {}
    disconnect(): void {}
    unobserve(): void {}
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('useOverflowPosition', () => {
  it('bottom-start：浮层置于锚点下方左对齐（含 offset）', async () => {
    const { active, popperEl } = mountPosition({ placement: 'bottom-start', offset: 6 })
    active.value = true
    await new Promise((r) => setTimeout(r, 0))
    expect(popperEl.style.left).toBe('100px')
    expect(popperEl.style.top).toBe('136px')
  })

  it('bottom-end 右对齐；top 翻转到锚点上方', async () => {
    const { active, popperEl } = mountPosition({ placement: 'bottom-end' })
    active.value = true
    await new Promise((r) => setTimeout(r, 0))
    expect(popperEl.style.left).toBe('120px')
    expect(popperEl.style.top).toBe('134px')
  })

  it('视口底部放不下时翻转到 top', async () => {
    const original = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 150, configurable: true })
    const { active, popperEl } = mountPosition({ placement: 'bottom', margin: 8 })
    active.value = true
    await new Promise((r) => setTimeout(r, 0))
    // bottom 需 134+50+8 > 150 → 翻转：top = ar.top - ph - gap = 100-50-4
    expect(Number.parseFloat(popperEl.style.top)).toBe(46)
    Object.defineProperty(window, 'innerHeight', { value: original, configurable: true })
  })

  it('视口钳制：越界坐标收到 margin 内', async () => {
    const original = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { value: 120, configurable: true })
    const { active, popperEl } = mountPosition({ placement: 'bottom-start', margin: 8 })
    active.value = true
    await new Promise((r) => setTimeout(r, 0))
    expect(Number.parseFloat(popperEl.style.left)).toBe(120 - 80 - 8)
    Object.defineProperty(window, 'innerWidth', { value: original, configurable: true })
  })

  it('getRect 虚拟锚点覆盖几何测量（右键坐标场景）', async () => {
    const { active, popperEl } = mountPosition({
      placement: 'bottom-start',
      getRect: () => ({ left: 400, top: 300, right: 400, bottom: 300 }),
    })
    active.value = true
    await new Promise((r) => setTimeout(r, 0))
    expect(popperEl.style.left).toBe('400px')
    expect(popperEl.style.top).toBe('304px')
  })

  it('非 active 时不定位；滚动触发重算', async () => {
    const { active, popperEl } = mountPosition({ placement: 'bottom-start' })
    await new Promise((r) => setTimeout(r, 0))
    expect(popperEl.style.left).toBe('')
    active.value = true
    await new Promise((r) => setTimeout(r, 0))
    expect(popperEl.style.left).not.toBe('')
    window.dispatchEvent(new Event('scroll'))
    await new Promise((r) => setTimeout(r, 0))
    expect(popperEl.style.left).not.toBe('')
  })
})
