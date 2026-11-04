import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxSwitch from './UxSwitch.vue'

let wrapper: VueWrapper | null = null

function mountSwitch(props: Record<string, unknown> = {}) {
  wrapper = mount(UxSwitch, {
    props: { modelValue: false, label: '自动换行', ...props },
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

describe('UxSwitch', () => {
  it('原生 input 承载 role=switch，label 经 for/id 关联', () => {
    const w = mountSwitch()
    expect(input(w).attributes('role')).toBe('switch')
    expect(w.find('label').attributes('for')).toBe(input(w).attributes('id'))
  })

  it('点击切换并 emit update:modelValue，受控回写 checked', async () => {
    const w = mountSwitch()
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')?.[0]).toEqual([true])
    await w.setProps({ modelValue: true })
    expect((input(w).element as HTMLInputElement).checked).toBe(true)
  })

  it('disabled 点击不 emit', async () => {
    const w = mountSwitch({ disabled: true })
    await input(w).setValue(true)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('error 时 aria-invalid=true', () => {
    const w = mountSwitch({ error: '此项必开' })
    expect(input(w).attributes('aria-invalid')).toBe('true')
    expect(w.find('.ux-field__error').text()).toBe('此项必开')
  })
})
