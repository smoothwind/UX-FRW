import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxSplitPane from './UxSplitPane.vue'
import UxSplitter from '../splitter/UxSplitter.vue'

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
  trigger(rect: { width: number; height: number }): void {
    this.callback([{ contentRect: rect } as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
}

function mountPane(props: Record<string, unknown> = {}): VueWrapper {
  return mount(UxSplitPane, { props: { ratio: 0.3, ...props } })
}

function triggerMeasure(rect: { width: number; height: number }): void {
  ResizeObserverStub.instances[ResizeObserverStub.instances.length - 1].trigger(rect)
}

describe('UxSplitPane', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  })

  it('未测量前首窗格走 flex-basis calc 兜底', () => {
    const wrapper = mountPane()
    const first = wrapper.find('[data-ux-part="pane-first"]')
    expect(first.attributes('style')).toContain('flex-basis: calc((100% - 4px) * 0.3)')
  })

  it('测量后首窗格 px = ratio × 容器宽，Splitter 收到值域与当前值', async () => {
    const wrapper = mountPane()
    triggerMeasure({ width: 1000, height: 500 })
    await nextTick()

    const first = wrapper.find('[data-ux-part="pane-first"]')
    expect(first.attributes('style')).toContain('width: 300px')

    const splitter = wrapper.findComponent(UxSplitter)
    expect(splitter.props('modelValue')).toBe(300)
    expect(splitter.props('min')).toBe(200)
    expect(splitter.props('max')).toBe(800)
  })

  it('Splitter 回传 px → ratio 钳制在 [min, max] 并保留 3 位小数', async () => {
    const wrapper = mountPane()
    triggerMeasure({ width: 1000, height: 500 })
    await nextTick()

    const splitter = wrapper.findComponent(UxSplitter)
    splitter.vm.$emit('update:modelValue', 100)
    await nextTick()
    expect(wrapper.emitted('update:ratio')![0]).toEqual([0.2])

    splitter.vm.$emit('update:modelValue', 950)
    await nextTick()
    expect(wrapper.emitted('update:ratio')![1]).toEqual([0.8])

    splitter.vm.$emit('update:modelValue', 500)
    await nextTick()
    expect(wrapper.emitted('update:ratio')![2]).toEqual([0.5])
  })

  it('vertical 取向按高度计算', async () => {
    const wrapper = mountPane({ orientation: 'vertical' })
    triggerMeasure({ width: 1000, height: 500 })
    await nextTick()

    const first = wrapper.find('[data-ux-part="pane-first"]')
    expect(first.attributes('style')).toContain('height: 150px')
    expect(wrapper.find('[data-ux="splitpane"]').classes()).toContain('ux-splitpane--vertical')
  })

  it('size 未就绪时拖拽不产生比例', () => {
    const wrapper = mountPane()
    const splitter = wrapper.findComponent(UxSplitter)
    splitter.vm.$emit('update:modelValue', 500)
    expect(wrapper.emitted('update:ratio')).toBeUndefined()
  })
})
