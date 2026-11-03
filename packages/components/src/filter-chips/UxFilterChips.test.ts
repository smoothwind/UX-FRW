import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import UxFilterChips from './UxFilterChips.vue'
import type { SegmentedOption } from '../segmented/types'

enableAutoUnmount(afterEach)

const options: SegmentedOption[] = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'pg', label: 'PostgreSQL' },
  { value: 'oracle', label: 'Oracle', disabled: true },
]

function mountChips(modelValue: string[] = [], extra: Record<string, unknown> = {}) {
  return mount(UxFilterChips, {
    props: { options, modelValue, ariaLabel: '数据库种类', ...extra },
  })
}

describe('UxFilterChips', () => {
  it('渲染全部选项，aria-pressed 反映选中态', () => {
    const wrapper = mountChips(['mysql'])
    const chips = wrapper.findAll('button')
    expect(chips).toHaveLength(3)
    expect(chips[0].attributes('aria-pressed')).toBe('true')
    expect(chips[0].classes()).toContain('is-on')
    expect(chips[1].attributes('aria-pressed')).toBe('false')
    expect(chips[1].classes()).not.toContain('is-on')
    expect(wrapper.find('[data-ux="filter-chips"]').attributes('aria-label')).toBe('数据库种类')
    expect(wrapper.find('[role="group"]').exists()).toBe(true)
  })

  it('点击未选项追加、已选项移除', async () => {
    const wrapper = mountChips([])
    const chips = wrapper.findAll('button')

    await chips[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['mysql']]])

    await wrapper.setProps({ modelValue: ['mysql'] })
    await chips[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
  })

  it('多选互不覆盖', async () => {
    const wrapper = mountChips(['mysql'])
    const chips = wrapper.findAll('button')

    await chips[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['mysql', 'pg']])
  })

  it('禁用项点击无 emit', async () => {
    const wrapper = mountChips([])
    const chips = wrapper.findAll('button')

    await chips[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(chips[2].attributes('disabled')).toBeDefined()
  })

  it('size 变体类名', () => {
    const sm = mountChips([], { size: 'sm' })
    expect(sm.find('.ux-fchips--sm').exists()).toBe(true)
    const md = mountChips([], { size: 'md' })
    expect(md.find('.ux-fchips--md').exists()).toBe(true)
  })
})
