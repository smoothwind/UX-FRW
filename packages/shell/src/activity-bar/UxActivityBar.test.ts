import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UxActivityBar from './UxActivityBar.vue'
import type { ActivityItem } from '../types'

const items: ActivityItem[] = [
  { id: 'db', icon: 'obj-database', label: '数据库' },
  { id: 'table', icon: 'obj-table', label: '表', badge: 3 },
  { id: 'settings', icon: 'act-settings', label: '设置', pinned: true },
]

describe('UxActivityBar', () => {
  it('渲染条目：aria-label 常驻、badge 条目包 UxBadge', () => {
    const wrapper = mount(UxActivityBar, { props: { items, activeId: 'db' } })
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(3)
    expect(wrapper.find('[data-ux="activitybar"]').attributes('aria-label')).toBe('Activity Bar')

    expect(buttons[0].attributes('aria-label')).toBe('数据库')
    expect(buttons[0].attributes('aria-pressed')).toBe('true')
    expect(buttons[0].classes()).toContain('is-active')

    expect(buttons[1].attributes('aria-pressed')).toBe('false')
    expect(buttons[1].find('.ux-badge').exists()).toBe(true)
  })

  it('点击非 pinned 上报 select；pinned 不响应', async () => {
    const wrapper = mount(UxActivityBar, { props: { items, activeId: 'db' } })
    const buttons = wrapper.findAll('button')

    await buttons[1].trigger('click')
    expect(wrapper.emitted('select')).toEqual([['table']])

    await buttons[2].trigger('click')
    expect(wrapper.emitted('select')?.length).toBe(1)
    expect(buttons[2].attributes('aria-label')).toContain('常驻主区')
  })

  it('item.active 独立生效（与 activeId 取 OR）；label 覆盖默认 aria-label', () => {
    const withActive: ActivityItem[] = [
      { id: 'a', icon: 'obj-database', label: 'A' },
      { id: 'b', icon: 'obj-table', label: 'B', active: true },
    ]
    const wrapper = mount(UxActivityBar, {
      props: { items: withActive, activeId: 'zzz', label: '侧栏' },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].attributes('aria-pressed')).toBe('false')
    expect(buttons[1].attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-ux="activitybar"]').attributes('aria-label')).toBe('侧栏')
  })
})
