import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from './EmptyState.vue'

describe('EmptyState', () => {
  it('渲染图标、标题、提示与动作插槽', () => {
    const wrapper = mount(EmptyState, {
      props: { icon: 'obj-database', title: '暂无数据库', hint: '新建一个以开始' },
      slots: { action: '<button data-act>新建</button>' },
    })
    expect(wrapper.find('[data-ux="empty"]').exists()).toBe(true)
    expect(wrapper.find('.ux-empty__icon').exists()).toBe(true)
    expect(wrapper.find('.ux-empty__title').text()).toBe('暂无数据库')
    expect(wrapper.find('.ux-empty__hint').text()).toBe('新建一个以开始')
    expect(wrapper.find('.ux-empty__action').exists()).toBe(true)
    expect(wrapper.find('[data-act]').exists()).toBe(true)
    expect(wrapper.find('.ux-empty--compact').exists()).toBe(false)
  })

  it('可选字段缺省不渲染；compact 变体', () => {
    const wrapper = mount(EmptyState, { props: { title: '空', compact: true } })
    expect(wrapper.find('.ux-empty__icon').exists()).toBe(false)
    expect(wrapper.find('.ux-empty__hint').exists()).toBe(false)
    expect(wrapper.find('.ux-empty__action').exists()).toBe(false)
    expect(wrapper.find('.ux-empty--compact').exists()).toBe(true)
  })

  it('filtered 变体：icon 缺省时用 act-search，显式 icon 优先', () => {
    const filtered = mount(EmptyState, { props: { title: '无匹配项', filtered: true } })
    expect(filtered.find('.ux-empty--filtered').exists()).toBe(true)
    expect(filtered.find('svg').attributes('data-icon')).toBe('act-search')

    const explicit = mount(EmptyState, {
      props: { title: '无匹配项', icon: 'obj-database', filtered: true },
    })
    expect(explicit.find('svg').attributes('data-icon')).toBe('obj-database')
  })
})
