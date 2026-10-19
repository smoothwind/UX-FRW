import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import SettingsShell from './SettingsShell.vue'
import type { SettingsCategory } from '../types'

enableAutoUnmount(afterEach)

const categories: SettingsCategory[] = [
  { id: 'general', label: '常规', icon: 'act-settings' },
  { id: 'theme', label: '主题' },
  { id: 'keys', label: '快捷键' },
]

function mountSettings(activeId = 'general', extra: Record<string, unknown> = {}) {
  return mount(SettingsShell, {
    props: { categories, activeId, ...extra },
    slots: {
      default: `<template #default="{ activeId }"><div data-panel-id>{{ activeId }}</div></template>`,
    },
    attachTo: document.body,
  })
}

describe('SettingsShell', () => {
  it('渲染分类导航与内容面板', () => {
    const wrapper = mountSettings()
    const nav = wrapper.find('[data-ux-part="settings-nav"]')
    expect(nav.attributes('aria-label')).toBe('Settings')

    const buttons = nav.findAll('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0].classes()).toContain('is-active')
    expect(buttons[0].attributes('aria-current')).toBe('true')
    expect(buttons[1].attributes('aria-current')).toBeUndefined()
    expect(buttons[0].find('.ux-icon, svg, i').exists()).toBe(true)

    expect(wrapper.find('[data-ux-part="settings-content"]').text()).toContain('更改即时生效')
    expect(wrapper.find('.ux-settings__panel [data-panel-id]').text()).toBe('general')

    const other = mountSettings('keys')
    expect(other.find('.ux-settings__panel [data-panel-id]').text()).toBe('keys')
  })

  it('点击分类上报 select 并聚焦', async () => {
    const wrapper = mountSettings()
    const buttons = wrapper.find('[data-ux-part="settings-nav"]').findAll('button')

    await buttons[2].trigger('click')
    expect(wrapper.emitted('select')).toEqual([['keys']])
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(buttons[2].element)
  })

  it('键盘导航：上下循环、Home/End', async () => {
    const wrapper = mountSettings()
    const nav = wrapper.find('[data-ux-part="settings-nav"]')

    await nav.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('select')?.at(-1)).toEqual(['theme'])
    await nav.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('select')?.at(-1)).toEqual(['keys'])
    await nav.trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('select')?.at(-1)).toEqual(['keys'])
    await nav.trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('select')?.at(-1)).toEqual(['general'])
  })

  it('label 覆盖默认无障碍名称', () => {
    const wrapper = mountSettings('general', { label: '偏好设置' })
    expect(wrapper.find('[data-ux-part="settings-nav"]').attributes('aria-label')).toBe('偏好设置')
  })
})
