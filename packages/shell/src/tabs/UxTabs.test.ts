import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import { openContextMenu } from '@ux/components'
import UxTabs from './UxTabs.vue'
import type { UxTabDef } from '../types'

vi.mock('@ux/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ux/components')>()
  return { ...actual, openContextMenu: vi.fn() }
})

enableAutoUnmount(afterEach)

const items: UxTabDef[] = [
  { id: 'a', title: '表 A' },
  { id: 'b', title: '表 B', subtitle: 'db@host', dirty: true, accent: '#f00' }, // tokens-exempt 测试数据标识色
  { id: 'c', title: '表 C', closable: false },
]

function mountTabs(items0: UxTabDef[] = items, activeId = 'a', extra: Record<string, unknown> = {}): VueWrapper {
  return mount(UxTabs, {
    props: { items: items0, activeId },
    ...extra,
    attachTo: document.body,
  } as never)
}

function tabsOf(wrapper: VueWrapper) {
  return wrapper.findAll('[data-ux-part="tab"]')
}

describe('UxTabs', () => {
  it('渲染页签：roving tabindex、选中态、title/subtitle、dirty、accent', () => {
    const wrapper = mountTabs()
    const list = wrapper.find('[data-ux="tabs"]')
    expect(list.attributes('role')).toBe('tablist')
    expect(list.attributes('aria-label')).toBe('Tabs')

    const tabs = tabsOf(wrapper)
    expect(tabs).toHaveLength(3)
    expect(tabs[0].attributes('role')).toBe('tab')
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    expect(tabs[0].attributes('tabindex')).toBe('0')
    expect(tabs[1].attributes('aria-selected')).toBe('false')
    expect(tabs[1].attributes('tabindex')).toBe('-1')

    expect(tabs[1].attributes('title')).toBe('表 B · db@host')
    expect(tabs[1].find('.ux-tabs__dot').attributes('aria-label')).toBe('未保存')
    expect(tabs[1].find('.ux-tabs__accent').exists()).toBe(true)
    expect(tabs[0].find('.ux-tabs__accent').exists()).toBe(false)
    expect(tabs[0].text()).toContain('表 A')
  })

  it('点击上报 select 并聚焦；关闭按钮上报 close', async () => {
    const wrapper = mountTabs()
    const tabs = tabsOf(wrapper)

    await tabs[2].trigger('click')
    expect(wrapper.emitted('select')).toEqual([['c']])
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(tabs[2].element)

    await tabs[1].find('.ux-tabs__close').trigger('click')
    expect(wrapper.emitted('close')).toEqual([['b']])
    expect(wrapper.emitted('select')?.length).toBe(1)
  })

  it('中键关闭：closable false 不响应', async () => {
    const wrapper = mountTabs()
    const tabs = tabsOf(wrapper)

    await tabs[0].trigger('auxclick', { button: 1 })
    expect(wrapper.emitted('close')).toEqual([['a']])

    await tabs[2].trigger('auxclick', { button: 1 })
    expect(wrapper.emitted('close')?.length).toBe(1)
  })

  it('键盘导航：左右循环、Home/End、Delete 关闭活动页签', async () => {
    const wrapper = mountTabs()
    const tabs = tabsOf(wrapper)

    await tabs[0].trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('select')).toEqual([['b']])
    await tabs[0].trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('select')).toEqual([['b'], ['c']])
    await tabs[0].trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('select')).toEqual([['b'], ['c'], ['a']])
    await tabs[0].trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('select')).toEqual([['b'], ['c'], ['a'], ['c']])

    await tabs[0].trigger('keydown', { key: 'Delete' })
    expect(wrapper.emitted('close')).toEqual([['a']])
  })

  it('右键：select 上报且菜单条目含关闭系列', async () => {
    const wrapper = mountTabs()
    const tabs = tabsOf(wrapper)
    await tabs[1].trigger('contextmenu')

    expect(wrapper.emitted('select')).toEqual([['b']])
    expect(vi.mocked(openContextMenu)).toHaveBeenCalledTimes(1)
    const menuItems = vi.mocked(openContextMenu).mock.calls[0][1] as Array<{ id: string }>
    for (const id of ['close', 'close-others', 'close-right', 'close-left', 'close-all']) {
      expect(menuItems.some((i) => i.id === id)).toBe(true)
    }
  })

  it('actions 插槽：布局类与动作区', () => {
    const bare = mountTabs()
    expect(bare.find('.ux-tabs-host').classes()).toContain('ux-tabs-host--bare')
    expect(bare.find('[data-ux-part="tabs-actions"]').exists()).toBe(false)

    const withActions = mountTabs(items, 'a', {
      slots: { actions: '<button data-actions-btn>操作</button>' },
    } as never)
    expect(withActions.find('.ux-tabs-host').classes()).toContain('ux-tabs-host--actions')
    expect(withActions.find('[data-ux-part="tabs-actions"]').exists()).toBe(true)
    expect(withActions.find('[data-actions-btn]').exists()).toBe(true)
  })

  it('拖拽重排：dragstart + drop → reorder；dragover 高亮', async () => {
    const wrapper = mountTabs()
    const tabs = tabsOf(wrapper)

    await tabs[0].trigger('dragstart')
    await tabs[2].trigger('dragover')
    expect(tabs[2].classes()).toContain('is-drag-over')

    await tabs[2].trigger('drop')
    expect(wrapper.emitted('reorder')).toEqual([['a', 2]])

    await tabs[0].trigger('dragend')
    expect(tabs[2].classes()).not.toContain('is-drag-over')
  })

  it('status 三态样式', () => {
    const wrapper = mountTabs([
      { id: 'x', title: 'X', status: 'lost' },
      { id: 'y', title: 'Y', status: 'off' },
    ], 'x')
    const tabs = tabsOf(wrapper)
    expect(tabs[0].classes()).toContain('is-lost')
    expect(tabs[1].classes()).toContain('is-off')
    expect(tabs[1].attributes('aria-selected')).toBe('false')
  })

  it('focusTab 暴露给外部', async () => {
    const wrapper = mountTabs()
    const exposed = wrapper.vm as unknown as { focusTab(id: string): void }
    exposed.focusTab('c')
    await nextTick()
    await nextTick()
    const tabs = tabsOf(wrapper)
    expect(document.activeElement).toBe(tabs[2].element)
  })
})
