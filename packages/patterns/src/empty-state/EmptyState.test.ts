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
})
