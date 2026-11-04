import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxCheckbox from './UxCheckbox.vue'

let wrapper: VueWrapper | null = null

function mountCheckbox(props: Record<string, unknown> = {}) {
  wrapper = mount(UxCheckbox, {
    props: { modelValue: false, label: '同步启用', ...props },
    attachTo: document.body,
  })
  return wrapper
}

function input(w: VueWrapper) {
  return w.find('input[type="checkbox"]')
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('UxCheckbox', () => {
  it('label 经 for/id 显式关联原生 input（红线 10）', () => {
    const w = mountCheckbox()
    expect(w.find('label').attributes('for')).toBe(input(w).attributes('id'))
  })

  it('点击勾选并 emit update:modelValue(true)，受控回写后 box 呈选中态', async () => {
    const w = mountCheckbox()
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')?.[0]).toEqual([true])
    await w.setProps({ modelValue: true })
    expect((input(w).element as HTMLInputElement).checked).toBe(true)
  })

  it('indeterminate 透传到原生 input（半选语义）', () => {
    const w = mountCheckbox({ indeterminate: true })
    expect((input(w).element as HTMLInputElement).indeterminate).toBe(true)
    const w2 = mountCheckbox({ indeterminate: false })
    expect((input(w2).element as HTMLInputElement).indeterminate).toBe(false)
  })

  it('disabled 点击不 emit', async () => {
    const w = mountCheckbox({ disabled: true })
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.find('.ux-checkbox--disabled').exists()).toBe(true)
  })

  it('error 时 aria-invalid=true 且优先于 hint 展示', () => {
    const w = mountCheckbox({ error: '至少选择一项', hint: '提示文案' })
    expect(input(w).attributes('aria-invalid')).toBe('true')
    expect(w.find('.ux-field__error').text()).toBe('至少选择一项')
    expect(w.find('.ux-field__hint').exists()).toBe(false)
  })

  it('无 error 时展示 hint 且不标 aria-invalid', () => {
    const w = mountCheckbox({ hint: '提示文案' })
    expect(input(w).attributes('aria-invalid')).toBeUndefined()
    expect(w.find('.ux-field__hint').text()).toBe('提示文案')
  })
})
