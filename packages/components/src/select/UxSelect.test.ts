import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxSelect from './UxSelect.vue'

let wrapper: VueWrapper | null = null

function mountSelect(props: Record<string, unknown> = {}, slots?: Record<string, string>) {
  wrapper = mount(UxSelect, {
    props: { modelValue: '', label: '数据库', ...props },
    slots: slots ?? {
      default: [
        '<option value="" disabled>请选择…</option>',
        '<option value="mysql">MySQL</option>',
        '<option value="oracle">Oracle</option>',
      ].join(''),
    },
    attachTo: document.body,
  })
  return wrapper
}

function select(w: VueWrapper) {
  return w.find('select')
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('UxSelect', () => {
  it('label 关联 + 默认插槽透传 option', () => {
    const w = mountSelect()
    expect(w.find('label').attributes('for')).toBe(select(w).attributes('id'))
    expect(w.findAll('option')).toHaveLength(3)
  })

  it('chevron 装饰图标对读屏隐藏，不劫持指针事件', () => {
    const w = mountSelect()
    const chevron = w.find('.ux-select__chevron')
    expect(chevron.find('[data-icon="act-chevron-down"]').exists()).toBe(true)
  })

  it('change emit 选中值，受控回写 select.value', async () => {
    const w = mountSelect()
    await select(w).setValue('oracle')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['oracle'])
    await w.setProps({ modelValue: 'oracle' })
    await nextTick()
    expect((select(w).element as HTMLSelectElement).value).toBe('oracle')
  })

  it('disabled 不可选', () => {
    const w = mountSelect({ disabled: true })
    expect(select(w).attributes('disabled')).toBeDefined()
  })

  it('error 时 aria-invalid=true', () => {
    const w = mountSelect({ error: '请选择数据库' })
    expect(select(w).attributes('aria-invalid')).toBe('true')
    expect(w.find('.ux-field__error').text()).toBe('请选择数据库')
  })
})
