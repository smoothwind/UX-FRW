import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxMenuBar from './UxMenuBar.vue'
import type { MenuBarItem } from './types'

function freshItems(): MenuBarItem[] {
  return [
    { id: 'file', label: 'File', items: [{ id: 'new', label: 'New', run: vi.fn() }] },
    { id: 'edit', label: 'Edit', items: [{ id: 'undo', label: 'Undo', run: vi.fn() }] },
    { id: 'help', label: 'Help', run: vi.fn() },
  ]
}

let wrapper: VueWrapper | null = null

function mountBar(items: MenuBarItem[] = freshItems()): VueWrapper {
  wrapper = mount(UxMenuBar, {
    props: { items, ariaLabel: '主菜单' },
    attachTo: document.body,
  })
  return wrapper
}

function buttons(w: VueWrapper = wrapper!) {
  return w.findAll('[role="menuitem"]')
}

function focusedIndex(w: VueWrapper = wrapper!): number {
  return buttons(w).findIndex((b) => b.attributes('tabindex') === '0')
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('UxMenuBar 结构与 roving tabindex', () => {
  it('role=menubar + 项 role=menuitem + aria-label', () => {
    const w = mountBar()
    expect(w.find('[role="menubar"]').attributes('aria-label')).toBe('主菜单')
    expect(buttons(w)).toHaveLength(3)
    expect(focusedIndex()).toBe(0)
  })

  it('点击焦点项后 roving tabindex 跟随', async () => {
    mountBar()
    const edit = buttons()[1]
    ;(edit.element as HTMLElement).focus()
    edit.trigger('focus')
    await vi.waitFor(() => {
      expect(focusedIndex()).toBe(1)
    })
  })
})

describe('UxMenuBar 展开与关闭', () => {
  it('点击展开下拉（role=menu），再点收起', async () => {
    const w = mountBar()
    const file = buttons()[0]
    expect(file.attributes('aria-haspopup')).toBe('menu')
    await file.trigger('click')
    expect(w.find('[role="menu"]').exists()).toBe(true)
    expect(file.attributes('aria-expanded')).toBe('true')
    await file.trigger('click')
    expect(w.find('[role="menu"]').exists()).toBe(false)
  })

  it('无子菜单的顶级项直接执行 run，不展开', async () => {
    const items = freshItems()
    const w = mountBar(items)
    await buttons()[2].trigger('click')
    expect(items[2].run).toHaveBeenCalledTimes(1)
    expect(w.find('[role="menu"]').exists()).toBe(false)
  })

  it('下拉项点击执行并收起菜单', async () => {
    const items = freshItems()
    const w = mountBar(items)
    await buttons()[0].trigger('click')
    await w.find('[role="menu"] .ux-menu__item').trigger('click')
    expect(items[0].items![0].run).toHaveBeenCalledTimes(1)
    expect(w.emitted('select')?.[0][0]).toMatchObject({ id: 'new' })
    expect(w.find('[role="menu"]').exists()).toBe(false)
  })

  it('Esc 关闭下拉', async () => {
    const w = mountBar()
    await buttons()[0].trigger('click')
    expect(w.find('[role="menu"]').exists()).toBe(true)
    await w.find('[role="menu"]').trigger('keydown', { key: 'Escape' })
    expect(w.find('[role="menu"]').exists()).toBe(false)
  })
})

describe('UxMenuBar 键盘', () => {
  it('关闭态 ←→ 移动 roving 焦点', async () => {
    mountBar()
    await wrapper!.trigger('keydown', { key: 'ArrowRight' })
    expect(focusedIndex()).toBe(1)
    await wrapper!.trigger('keydown', { key: 'ArrowLeft' })
    await wrapper!.trigger('keydown', { key: 'ArrowLeft' })
    expect(focusedIndex()).toBe(2)
  })

  it('展开态 → 切换相邻顶级菜单（重挂载下拉）', async () => {
    const w = mountBar()
    await buttons()[0].trigger('click')
    await w.trigger('keydown', { key: 'ArrowRight' })
    expect(buttons()[1].attributes('aria-expanded')).toBe('true')
    expect(w.find('[role="menu"]').exists()).toBe(true)
  })

  it('Home / End 跳首末', async () => {
    mountBar()
    await wrapper!.trigger('keydown', { key: 'End' })
    expect(focusedIndex()).toBe(2)
    await wrapper!.trigger('keydown', { key: 'Home' })
    expect(focusedIndex()).toBe(0)
  })

  it('ArrowDown 展开焦点项下拉', async () => {
    const w = mountBar()
    await w.trigger('keydown', { key: 'ArrowDown' })
    expect(w.find('[role="menu"]').exists()).toBe(true)
  })

  it('下拉内 ←→ 仅切换一次相邻菜单（bar 不重复处理）', async () => {
    const w = mountBar()
    await buttons()[0].trigger('click')
    await w.find('[role="menu"]').trigger('keydown', { key: 'ArrowRight' })
    expect(focusedIndex()).toBe(1)
    expect(buttons()[1].attributes('aria-expanded')).toBe('true')
    expect(w.find('[role="menu"]').exists()).toBe(true)
  })
})
