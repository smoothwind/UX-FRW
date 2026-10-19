import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UxAppShell from './UxAppShell.vue'

describe('UxAppShell', () => {
  it('渲染标题栏/主区/状态栏插槽', () => {
    const wrapper = mount(UxAppShell, {
      slots: {
        titlebar: '<div data-test-titlebar>标题栏</div>',
        statusbar: '<div data-test-statusbar>状态栏</div>',
        default: '<div data-test-body>主区</div>',
      },
    })
    expect(wrapper.find('[data-ux="appshell"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-titlebar]').exists()).toBe(true)
    expect(wrapper.find('[data-test-body]').exists()).toBe(true)
    expect(wrapper.find('div[data-ux-part="body"]').text()).toContain('主区')
    expect(wrapper.find('[data-ux-part="menubar"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-statusbar]').exists()).toBe(true)
  })

  it('提供 menubar 插槽时渲染菜单栏区', () => {
    const wrapper = mount(UxAppShell, {
      slots: {
        menubar: '<div data-test-menu>菜单</div>',
        default: '<div>主区</div>',
      },
    })
    expect(wrapper.find('[data-ux-part="menubar"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-menu]').exists()).toBe(true)
  })

  it('插槽顺序：标题栏 → 菜单栏 → 主区 → 状态栏', () => {
    const wrapper = mount(UxAppShell, {
      slots: {
        titlebar: '<div data-test-role="titlebar" />',
        menubar: '<div data-test-role="menubar" />',
        statusbar: '<div data-test-role="statusbar" />',
        default: '<div data-test-role="body" />',
      },
    })
    const roles = wrapper
      .find('[data-ux="appshell"]')
      .findAll('[data-test-role]')
      .map((n) => n.attributes('data-test-role'))
    expect(roles).toEqual(['titlebar', 'menubar', 'body', 'statusbar'])
  })
})
