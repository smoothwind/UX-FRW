import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useVirtualRows } from './useVirtualRows'

class ResizeObserverStub {
  static instances: ResizeObserverStub[] = []
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    ResizeObserverStub.instances.push(this)
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  trigger(): void {
    this.callback([], this as unknown as ResizeObserver)
  }
}

function fixedHeight(el: Element, height: number): void {
  Object.defineProperty(el, 'clientHeight', { value: height, configurable: true })
}

async function mountRows(count: number, rowHeight = 24, overscan = 6) {
  const TestComp = defineComponent({
    setup() {
      const api = useVirtualRows({ count: () => count, rowHeight, overscan })
      return { api }
    },
    template: `<div :ref="setEl" @scroll="api.onScroll"></div>`,
    methods: {
      setEl(this: { api: ReturnType<typeof useVirtualRows> }, el: unknown) {
        this.api.containerRef.value = el as HTMLElement | null
      },
    },
  })
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)

  const wrapper = mount(TestComp)
  const el = wrapper.element
  fixedHeight(el, 480)
  ResizeObserverStub.instances[ResizeObserverStub.instances.length - 1].trigger()
  return { wrapper, el }
}

describe('useVirtualRows', () => {
  it('初始窗口：顶部从 0 开始，覆盖视口 + overscan', async () => {
    const { wrapper } = await mountRows(1000)
    const api = wrapper.vm.api as ReturnType<typeof useVirtualRows>
    expect(api.startIndex.value).toBe(0)
    expect(api.endIndex.value).toBe(Math.min(1000, 0 + Math.ceil(480 / 24) + 1 + 6 * 2))
    expect(api.padTop.value).toBe(0)
    expect(api.totalHeight.value).toBe(1000 * 24)
  })

  it('滚动后窗口平移，padTop 对应起始行偏移', async () => {
    const { wrapper, el } = await mountRows(1000)
    const api = wrapper.vm.api as ReturnType<typeof useVirtualRows>
    el.scrollTop = 2400
    await wrapper.find('div').trigger('scroll')
    expect(api.startIndex.value).toBe(Math.floor(2400 / 24) - 6)
    expect(api.padTop.value).toBe(api.startIndex.value * 24)
    expect(api.endIndex.value).toBe(Math.min(1000, api.startIndex.value + 21 + 12))
  })

  it('接近底部时 endIndex 钳制到总行数', async () => {
    const { wrapper, el } = await mountRows(30)
    const api = wrapper.vm.api as ReturnType<typeof useVirtualRows>
    el.scrollTop = 30 * 24
    await wrapper.find('div').trigger('scroll')
    expect(api.startIndex.value).toBe(Math.floor((30 * 24) / 24) - 6)
    expect(api.endIndex.value).toBe(30)
  })
})
