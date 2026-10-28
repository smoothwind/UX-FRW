import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxDropdown from './UxDropdown.vue'
import type { MenuItem } from '../menu/types'

function buildItems(runA = vi.fn(), runB = vi.fn()): MenuItem[] {
  return [
    { id: 'a', label: '打开文件', icon: 'act-search', shortcut: 'Ctrl+O', run: runA },
    { type: 'separator' },
    { id: 'b', label: '删除', danger: true, run: runB },
  ]
}

const Host = defineComponent({
  components: { UxDropdown },
  props: { items: { type: Array, required: true }, disabled: { type: Boolean, default: false } },
  template: `<UxDropdown :items="items" label="操作" aria-label="操作菜单" :disabled="disabled" />`,
})

let wrapper: VueWrapper | null = null

/** 菜单 Teleport 到 body，须从 document 查询 */
function menu(): HTMLElement | null {
  return document.querySelector('.ux-dropdown__menu')
}

function menuItems(): HTMLElement[] {
  return [
    ...document.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'),
  ] as HTMLElement[]
}

function trigger() {
  return wrapper!.find('.ux-dropdown__btn')
}

async function openMenu(): Promise<void> {
  await trigger().trigger('click')
  await nextTick()
}

async function clickItem(index: number): Promise<void> {
  menuItems()[index].click()
  await nextTick()
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('UxDropdown', () => {
  it('触发按钮带 menubutton 语义（aria-haspopup/aria-expanded）', () => {
    wrapper = mount(Host, { attachTo: document.body, props: { items: buildItems() } })
    const btn = trigger()
    expect(btn.attributes('aria-haspopup')).toBe('menu')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(btn.attributes('aria-label')).toBe('操作菜单')
    // 红线 14：悬浮提示与读屏双通道——title 缺省回退 label/ariaLabel
    expect(btn.attributes('title')).toBe('操作菜单')
    expect(btn.text()).toContain('操作')
  })

  it('点击触发按钮打开菜单并更新 aria-expanded', async () => {
    wrapper = mount(Host, { attachTo: document.body, props: { items: buildItems() } })
    expect(menu()).toBeNull()
    await openMenu()
    expect(menu()).not.toBeNull()
    expect(trigger().attributes('aria-expanded')).toBe('true')
    expect(menu()!.getAttribute('aria-label')).toBe('操作菜单')
    expect(menu()!.getAttribute('role')).toBe('menu')
  })

  it('再次点击关闭', async () => {
    wrapper = mount(Host, { attachTo: document.body, props: { items: buildItems() } })
    await openMenu()
    await openMenu()
    expect(menu()).toBeNull()
  })

  it('↓ 打开（APG menubutton）；Esc 关闭并归还焦点', async () => {
    wrapper = mount(Host, { attachTo: document.body, props: { items: buildItems() } })
    await trigger().trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(menu()).not.toBeNull()
    menu()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await nextTick()
    expect(menu()).toBeNull()
    expect(document.activeElement).toBe(trigger().element)
  })

  it('点击菜单项：执行 run、emit select、关闭并归还焦点', async () => {
    const runA = vi.fn()
    wrapper = mount(Host, { attachTo: document.body, props: { items: buildItems(runA) } })
    await openMenu()
    await clickItem(0)
    expect(runA).toHaveBeenCalledTimes(1)
    expect(menu()).toBeNull()
    expect(document.activeElement).toBe(trigger().element)
  })

  it('checkable 项激活后菜单不关闭', async () => {
    const checkItems: MenuItem[] = [
      { id: 'c', label: '显示网格', type: 'checkbox', checked: false, run: vi.fn() },
    ]
    wrapper = mount(Host, { attachTo: document.body, props: { items: checkItems } })
    await openMenu()
    await clickItem(0)
    expect(menu()).not.toBeNull()
  })

  it('菜单内 Tab 立即关闭（APG：只进出一次）', async () => {
    wrapper = mount(Host, { attachTo: document.body, props: { items: buildItems() } })
    await openMenu()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    await nextTick()
    expect(menu()).toBeNull()
  })

  it('外部点击关闭', async () => {
    wrapper = mount(Host, { attachTo: document.body, props: { items: buildItems() } })
    await openMenu()
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(menu()).toBeNull()
  })

  it('disabled 不打开', async () => {
    wrapper = mount(Host, { attachTo: document.body, props: { items: buildItems(), disabled: true } })
    await openMenu()
    expect(menu()).toBeNull()
    expect(trigger().attributes('disabled')).toBeDefined()
  })

  it('menuItemKind 归一：separator 渲染为 role=separator 且不可聚焦', async () => {
    wrapper = mount(Host, { attachTo: document.body, props: { items: buildItems() } })
    await openMenu()
    expect(document.querySelectorAll('[role="separator"]')).toHaveLength(1)
    expect(menuItems()).toHaveLength(2)
  })
})
