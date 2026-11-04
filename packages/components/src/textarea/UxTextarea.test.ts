import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxTextarea from './UxTextarea.vue'

let wrapper: VueWrapper | null = null

function mountTextarea(props: Record<string, unknown> = {}) {
  wrapper = mount(UxTextarea, {
    props: { modelValue: '', label: '备注', ...props },
    attachTo: document.body,
  })
  return wrapper
}

function textarea(w: VueWrapper) {
  return w.find('textarea')
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('UxTextarea', () => {
  it('label 关联 + 默认 3 行 + maxlength 透传', () => {
    const w = mountTextarea({ maxlength: 200 })
    expect(w.find('label').attributes('for')).toBe(textarea(w).attributes('id'))
    expect(textarea(w).attributes('rows')).toBe('3')
    expect(textarea(w).attributes('maxlength')).toBe('200')
  })

  it('输入 emit update:modelValue，受控回写 value', async () => {
    const w = mountTextarea()
    await textarea(w).setValue('第一行')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['第一行'])
    await w.setProps({ modelValue: '第一行' })
    expect((textarea(w).element as HTMLTextAreaElement).value).toBe('第一行')
  })

  it('error 时 aria-invalid + 红色错误文案；无 error 展示 hint', () => {
    const w = mountTextarea({ error: '备注不能为空' })
    expect(textarea(w).attributes('aria-invalid')).toBe('true')
    expect(w.find('.ux-field__error').exists()).toBe(true)
    const w2 = mountTextarea({ hint: '支持多行文本' })
    expect(textarea(w2).attributes('aria-invalid')).toBeUndefined()
    expect(w2.find('.ux-field__hint').exists()).toBe(true)
  })

  it('disabled 置灰不可输入', () => {
    const w = mountTextarea({ disabled: true })
    expect(textarea(w).attributes('disabled')).toBeDefined()
  })
})
