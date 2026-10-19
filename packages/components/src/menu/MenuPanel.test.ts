import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxMenuPanel from './MenuPanel.vue'
import type { MenuItem } from './types'

function freshItems(): MenuItem[] {
  return [
    { id: 'open', label: 'Open', run: vi.fn(), shortcut: 'Ctrl+O' },
    { id: 'save', label: 'Save', run: vi.fn() },
    { type: 'separator', id: 'sep' },
    { type: 'label', id: 'lbl', label: 'Group' },
    { id: 'cut', label: 'Cut', disabled: true },
    { id: 'wrap', label: 'Wrap', type: 'checkbox', checked: true },
    {
      id: 'more',
      label: 'More',
      items: [{ id: 'sub-a', label: 'Sub A', run: vi.fn() }],
    },
  ]
}

let wrapper: VueWrapper | null = null

function mountPanel(items: MenuItem[] = freshItems(), submenu = false): VueWrapper {
  wrapper = mount(UxMenuPanel, {
    props: { items, ariaLabel: '测试菜单', submenu },
    attachTo: document.body,
  })
  return wrapper
}

async function press(key: string): Promise<void> {
  await wrapper!.trigger('keydown', { key })
}

function activeText(w: VueWrapper = wrapper!): string {
  const el = w.find('.ux-menu__item.is-active')
  return el.exists() ? el.text() : ''
}

function itemByText(text: string, w: VueWrapper = wrapper!) {
  return w.findAll('.ux-menu__item').find((node) => node.text() === text)!
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('UxMenuPanel aria 结构', () => {
  it('role=menu + 各类型项 role 正确', () => {
    const w = mountPanel()
    const root = w.find('[role="menu"]')
    expect(root.exists()).toBe(true)
    expect(root.attributes('aria-label')).toBe('测试菜单')
    expect(w.findAll('[role="menuitem"]').length).toBeGreaterThanOrEqual(3)
    expect(w.find('[role="separator"]').exists()).toBe(true)
    expect(w.find('.ux-menu__label').text()).toBe('Group')
    const check = w.find('[role="menuitemcheckbox"]')
    expect(check.attributes('aria-checked')).toBe('true')
  })

  it('禁用项 aria-disabled 且仍可键盘聚焦（APG）', async () => {
    mountPanel()
    expect(itemByText('Cut').attributes('aria-disabled')).toBe('true')
    await press('ArrowDown')
    await press('ArrowDown')
    expect(activeText()).toContain('Cut')
  })

  it('初始聚焦根元素并高亮首个可用项', async () => {
    const w = mountPanel()
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(w.find('[role="menu"]').element)
    })
    expect(activeText()).toContain('Open')
  })
})

describe('UxMenuPanel 键盘导航', () => {
  it('ArrowDown 循环且跳过 separator/label（含禁用项）', async () => {
    mountPanel()
    for (const expected of ['Save', 'Cut', 'Wrap', 'More', 'Open']) {
      await press('ArrowDown')
      expect(activeText()).toContain(expected)
    }
  })

  it('ArrowUp 反向循环', async () => {
    mountPanel()
    await press('ArrowUp')
    expect(activeText()).toContain('More')
  })

  it('Home / End 跳首末', async () => {
    mountPanel()
    await press('End')
    expect(activeText()).toContain('More')
    await press('Home')
    expect(activeText()).toContain('Open')
  })

  it('首字母跳转', async () => {
    mountPanel()
    await press('w')
    expect(activeText()).toContain('Wrap')
    await press('s')
    expect(activeText()).toContain('Save')
  })

  it('Enter / Space 执行并 emit select；禁用项不执行', async () => {
    const items = freshItems()
    mountPanel(items)
    await press('Enter')
    await press(' ')
    expect(items[0].run).toHaveBeenCalledTimes(2)
    expect(wrapper!.emitted('select')?.[0][0]).toMatchObject({ id: 'open' })

    await press('Home')
    await press('ArrowDown')
    await press('ArrowDown')
    expect(activeText()).toContain('Cut')
    await press('Enter')
    expect(wrapper!.emitted('select')).toHaveLength(2)
  })
})

describe('UxMenuPanel 子菜单', () => {
  it('Enter / ArrowRight 展开子菜单，aria-expanded 同步', async () => {
    mountPanel()
    await press('End')
    await press('ArrowRight')
    expect(wrapper!.find('.ux-menu--sub').exists()).toBe(true)
    expect(itemByText('More').attributes('aria-expanded')).toBe('true')
    expect(itemByText('More').attributes('aria-haspopup')).toBe('menu')
  })

  it('ArrowRight 在普通项上 emit navigate（menubar 切换）', async () => {
    mountPanel()
    await press('ArrowRight')
    expect(wrapper!.emitted('navigate')?.[0]).toEqual(['right'])
  })

  it('Esc 先关子菜单再 dismiss', async () => {
    mountPanel()
    await press('End')
    await press('ArrowRight')
    expect(wrapper!.find('.ux-menu--sub').exists()).toBe(true)
    await press('Escape')
    expect(wrapper!.find('.ux-menu--sub').exists()).toBe(false)
    expect(wrapper!.emitted('dismiss')).toBeUndefined()
    await press('Escape')
    expect(wrapper!.emitted('dismiss')).toHaveLength(1)
  })

  it('点击子菜单项执行并冒泡 select', async () => {
    const items = freshItems()
    mountPanel(items)
    await press('End')
    await press('ArrowRight')
    const subItem = wrapper!.find('.ux-menu--sub .ux-menu__item')
    await subItem.trigger('click')
    expect(items[6].items![0].run).toHaveBeenCalledTimes(1)
    expect(wrapper!.emitted('select')?.[0][0]).toMatchObject({ id: 'sub-a' })
  })

  it('submenu 模式 ArrowLeft emit dismiss', async () => {
    mountPanel(freshItems(), true)
    await press('ArrowLeft')
    expect(wrapper!.emitted('dismiss')).toHaveLength(1)
  })
})

describe('UxMenuPanel checkbox', () => {
  it('点击 checkbox 执行并 emit（勾选态由调用方维护）', async () => {
    const items = freshItems()
    mountPanel(items)
    await itemByText('Wrap').trigger('click')
    expect(wrapper!.emitted('select')?.[0][0]).toMatchObject({ id: 'wrap', type: 'checkbox' })
  })
})
