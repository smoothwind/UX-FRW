import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import UxSplitter from './UxSplitter.vue'

enableAutoUnmount(afterEach)

function mountSplitter(props: Record<string, unknown> = {}): VueWrapper {
  return mount(UxSplitter, {
    props: { modelValue: 500, min: 120, max: 800, label: '调整分屏', ...props },
    attachTo: document.body,
  })
}

function lastEmitted(wrapper: VueWrapper): number {
  const events = wrapper.emitted('update:modelValue')
  return events![events!.length - 1][0] as number
}

describe('UxSplitter', () => {
  it('separator 语义：role / tabindex / aria 值域齐全', () => {
    const wrapper = mountSplitter({ orientation: 'horizontal' })
    const el = wrapper.element
    expect(el.getAttribute('role')).toBe('separator')
    expect(el.getAttribute('tabindex')).toBe('0')
    expect(el.getAttribute('aria-orientation')).toBe('horizontal')
    expect(el.getAttribute('aria-valuenow')).toBe('500')
    expect(el.getAttribute('aria-valuemin')).toBe('120')
    expect(el.getAttribute('aria-valuemax')).toBe('800')
    expect(el.getAttribute('aria-label')).toBe('调整分屏')
  })

  it('键盘步进：方向键 ±step，Shift 4×，Home/End 到边界', async () => {
    const wrapper = mountSplitter()

    await wrapper.trigger('keydown', { key: 'ArrowLeft' })
    expect(lastEmitted(wrapper)).toBe(492)
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(lastEmitted(wrapper)).toBe(508)

    await wrapper.trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    expect(lastEmitted(wrapper)).toBe(532)

    await wrapper.trigger('keydown', { key: 'Home' })
    expect(lastEmitted(wrapper)).toBe(120)
    await wrapper.trigger('keydown', { key: 'End' })
    expect(lastEmitted(wrapper)).toBe(800)
  })

  it('horizontal 取向：↑ 减 ↓ 加；reverse 方向取反', async () => {
    const wrapper = mountSplitter({ orientation: 'horizontal' })
    await wrapper.trigger('keydown', { key: 'ArrowUp' })
    expect(lastEmitted(wrapper)).toBe(492)
    await wrapper.trigger('keydown', { key: 'ArrowDown' })
    expect(lastEmitted(wrapper)).toBe(508)

    const reversed = mountSplitter({ reverse: true })
    await reversed.trigger('keydown', { key: 'ArrowRight' })
    expect(lastEmitted(reversed)).toBe(492)
  })

  it('钳制在 [min, max] 区间', async () => {
    const wrapper = mountSplitter({ modelValue: 795 })
    await wrapper.trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    expect(lastEmitted(wrapper)).toBe(800)

    const low = mountSplitter({ modelValue: 125 })
    await low.trigger('keydown', { key: 'ArrowLeft' })
    expect(lastEmitted(low)).toBe(120)
  })

  it('指针拖拽：位移增量提交，body 标记类随起止增删', async () => {
    const wrapper = mountSplitter()
    await wrapper.trigger('pointerdown', { clientX: 100 })
    expect(wrapper.element).toBe(document.activeElement)
    expect(document.body.classList.contains('ux-resizing')).toBe(true)
    expect(document.body.classList.contains('ux-resizing--vertical')).toBe(true)

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 160 }))
    expect(lastEmitted(wrapper)).toBe(560)
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 90 }))
    expect(lastEmitted(wrapper)).toBe(490)

    window.dispatchEvent(new MouseEvent('pointerup'))
    expect(document.body.classList.contains('ux-resizing')).toBe(false)
    expect(document.body.classList.contains('ux-resizing--vertical')).toBe(false)
  })

  it('reverse 拖拽：指针右移提交值减小', async () => {
    const wrapper = mountSplitter({ reverse: true })
    await wrapper.trigger('pointerdown', { clientX: 100 })
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 160 }))
    expect(lastEmitted(wrapper)).toBe(440)
    window.dispatchEvent(new MouseEvent('pointerup'))
  })
})
