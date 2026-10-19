import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UxPanelToolbar from './UxPanelToolbar.vue'

describe('UxPanelToolbar', () => {
  it('三段插槽按需渲染 + 段间分隔线 + 弹性占位', () => {
    const wrapper = mount(UxPanelToolbar, {
      props: { ariaLabel: '面板工具栏' },
      slots: {
        lead: '<button>新建查询</button>',
        monitor: '<span>SELECT 1</span>',
        actions: '<button>运行</button>',
      },
    })
    const toolbar = wrapper.find('[data-ux="panel-toolbar"]')
    expect(toolbar.attributes('role')).toBe('toolbar')
    expect(toolbar.attributes('aria-label')).toBe('面板工具栏')

    expect(wrapper.find('[data-ux-part="toolbar-lead"]').exists()).toBe(true)
    expect(wrapper.find('[data-ux-part="toolbar-monitor"]').exists()).toBe(true)
    expect(wrapper.find('[data-ux-part="toolbar-actions"]').exists()).toBe(true)
    expect(wrapper.findAll('.ux-sep')).toHaveLength(1)
    expect(wrapper.find('.ux-spacer').exists()).toBe(true)
  })

  it('缺段时对应分区与分隔线不渲染', () => {
    const wrapper = mount(UxPanelToolbar, {
      props: { ariaLabel: 't' },
      slots: { lead: '<span>only</span>' },
    })
    expect(wrapper.find('[data-ux-part="toolbar-lead"]').exists()).toBe(true)
    expect(wrapper.find('[data-ux-part="toolbar-monitor"]').exists()).toBe(false)
    expect(wrapper.find('[data-ux-part="toolbar-actions"]').exists()).toBe(false)
    expect(wrapper.findAll('.ux-sep')).toHaveLength(0)
  })

  it('空插槽渲染空工具栏', () => {
    const wrapper = mount(UxPanelToolbar, { props: { ariaLabel: 't' } })
    expect(wrapper.find('[data-ux="panel-toolbar"]').exists()).toBe(true)
    expect(wrapper.find('[data-ux-part="toolbar-lead"]').exists()).toBe(false)
  })
})
