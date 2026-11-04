import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxSlider from './UxSlider.vue'

let wrapper: VueWrapper | null = null

function mountSlider(props: Record<string, unknown> = {}) {
  wrapper = mount(UxSlider, {
    props: { modelValue: 4, label: '并发数', min: 1, max: 16, step: 1, ...props },
    attachTo: document.body,
  })
  return wrapper
}

function range(w: VueWrapper) {
  return w.find('input[type="range"]')
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('UxSlider', () => {
  it('label 关联 + min/max/step 透传', () => {
    const w = mountSlider()
    expect(w.find('label').attributes('for')).toBe(range(w).attributes('id'))
    expect(range(w).attributes('min')).toBe('1')
    expect(range(w).attributes('max')).toBe('16')
    expect(range(w).attributes('step')).toBe('1')
  })

  it('input emit 数值（非字符串）', async () => {
    const w = mountSlider()
    await range(w).setValue('8')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([8])
  })

  it('填充比例写入 --ux-slider-fill（0 封顶 100）', () => {
    const w = mountSlider({ modelValue: 4 }) // (4-1)/(16-1) = 20%
    expect(range(w).attributes('style')).toMatch(/--ux-slider-fill:\s*20%/)
    const w2 = mountSlider({ modelValue: 99, min: 0, max: 100 })
    expect(range(w2).attributes('style')).toMatch(/--ux-slider-fill:\s*99%/)
  })

  it('showValue 时 label 行带 output 当前值', () => {
    const w = mountSlider({ showValue: true })
    expect(w.find('output').text()).toBe('4')
    const w2 = mountSlider()
    expect(w2.find('output').exists()).toBe(false)
  })

  it('disabled 不可拖拽', () => {
    const w = mountSlider({ disabled: true })
    expect(range(w).attributes('disabled')).toBeDefined()
  })
})
