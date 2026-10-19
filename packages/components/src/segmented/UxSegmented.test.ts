import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxSegmented from './UxSegmented.vue'
import type { SegmentedOption } from './types'

const options: SegmentedOption[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'auto', label: '跟随系统', disabled: true },
  { value: 'contrast', label: '高对比' },
]

let wrapper: VueWrapper | null = null

function mountSeg(props: Record<string, unknown> = {}) {
  wrapper = mount(UxSegmented, {
    props: { modelValue: 'light', options, ariaLabel: '主题', ...props },
    attachTo: document.body,
  })
  return wrapper
}

function items(w: VueWrapper) {
  return w.findAll('[role="radio"]')
}

function enabled(w: VueWrapper) {
  return items(w).filter((i) => !i.attributes('disabled'))
}

function press(w: VueWrapper, key: string) {
  return w.find('[role="radiogroup"]').trigger('keydown', { key })
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('UxSegmented', () => {
  it('role=radiogroup + aria-checked + roving tabindex 落在选中项', () => {
    const w = mountSeg()
    expect(w.find('[role="radiogroup"]').attributes('aria-label')).toBe('主题')
    expect(items(w)).toHaveLength(4)
    expect(items(w)[0].attributes('aria-checked')).toBe('true')
    expect(items(w)[0].attributes('tabindex')).toBe('0')
    expect(items(w)[1].attributes('tabindex')).toBe('-1')
  })

  it('点击选择并 emit update:modelValue', async () => {
    const w = mountSeg()
    await items(w)[1].trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['dark'])
    await wrapper!.setProps({ modelValue: 'dark' })
    expect(items(w)[1].attributes('aria-checked')).toBe('true')
  })

  it('禁用项点击无效', async () => {
    const w = mountSeg()
    await items(w)[2].trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('→/↓ 循环且跳过禁用项', async () => {
    const w = mountSeg()
    await press(w, 'ArrowRight')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['dark'])
    await wrapper!.setProps({ modelValue: 'dark' })
    await press(w, 'ArrowRight')
    // auto 被跳过
    expect(w.emitted('update:modelValue')?.[1]).toEqual(['contrast'])
  })

  it('←/↑ 反向循环', async () => {
    const w = mountSeg({ modelValue: 'contrast' })
    await press(w, 'ArrowLeft')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['dark'])
  })

  it('Home / End 跳首末（End 落在可用项）', async () => {
    const w = mountSeg()
    await press(w, 'End')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['contrast'])
    await wrapper!.setProps({ modelValue: 'contrast' })
    await press(w, 'Home')
    expect(w.emitted('update:modelValue')?.[1]).toEqual(['light'])
  })

  it('键盘切换后焦点跟随到新选中按钮', async () => {
    const w = mountSeg()
    await press(w, 'ArrowRight')
    await nextTick()
    expect(document.activeElement).toBe(enabled(w)[1].element)
  })

  it('整体 disabled 时点击与键盘均无效', async () => {
    const w = mountSeg({ disabled: true })
    await items(w)[1].trigger('click')
    await press(w, 'ArrowRight')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.find('[role="radiogroup"]').attributes('aria-disabled')).toBe('true')
  })
})
