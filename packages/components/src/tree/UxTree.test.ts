import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxTree from './UxTree.vue'
import type { TreeNodeData } from './types'

function freshItems(): TreeNodeData[] {
  return [
    {
      id: 'db',
      label: 'Databases',
      icon: 'obj-database',
      children: [
        { id: 'users', label: 'users', leaf: true },
        { id: 'orders', label: 'orders', leaf: true, badge: 3 },
      ],
    },
    {
      id: 'lost',
      label: 'Archive',
      status: 'lost',
      children: [{ id: 'logs', label: 'logs', leaf: true }],
    },
    { id: 'off', label: 'Disabled node', disabled: true, leaf: true },
    { id: 'shell', label: 'Scripts', children: [] },
  ]
}

let wrapper: VueWrapper | null = null

function mountTree(props: Record<string, unknown> = {}, items: TreeNodeData[] = freshItems()) {
  wrapper = mount(UxTree, {
    props: { items, ariaLabel: '对象树', ...props },
    attachTo: document.body,
  })
  return wrapper
}

function row(w: VueWrapper, id: string) {
  return w.find(`[data-ux-tree-id="${id}"]`)
}

function rows(w: VueWrapper) {
  return w.findAll('[role="treeitem"]')
}

function key(w: VueWrapper, id: string, key: string) {
  return row(w, id).trigger('keydown', { key })
}

async function toggle(w: VueWrapper, id: string) {
  await row(w, id).find('.ux-tree__twist').trigger('click')
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('UxTree 结构与 aria', () => {
  it('role=tree + treeitem + aria-level + roving tabindex', () => {
    const w = mountTree()
    expect(w.find('[role="tree"]').attributes('aria-label')).toBe('对象树')
    expect(rows(w)).toHaveLength(4)
    expect(row(w, 'db').attributes('aria-level')).toBe('1')
    expect(row(w, 'db').attributes('aria-expanded')).toBe('false')
    expect(row(w, 'db').attributes('tabindex')).toBe('0')
    expect(row(w, 'lost').attributes('tabindex')).toBe('-1')
  })

  it('展开后子级 aria-level 递增，aria-expanded 同步', async () => {
    const w = mountTree()
    await toggle(w, 'db')
    await wrapper!.setProps({ expanded: ['db'] })
    expect(row(w, 'db').attributes('aria-expanded')).toBe('true')
    expect(rows(w)).toHaveLength(6)
    expect(row(w, 'users').attributes('aria-level')).toBe('2')
    expect(row(w, 'users').attributes('aria-expanded')).toBeUndefined()
  })

  it('badge 角标封顶 99+，lost 状态渲染红点', () => {
    const items: TreeNodeData[] = [
      freshItems()[0],
      { ...freshItems()[1] },
      freshItems()[2],
      freshItems()[3],
    ]
    ;(items[0].children![1] as { badge: number }).badge = 120
    const w = mountTree({ expanded: ['db'] }, items)
    expect(row(w, 'orders').text()).toContain('99+')
    expect(row(w, 'lost').find('.ux-tree__dot').exists()).toBe(true)
  })
})

describe('UxTree 选中', () => {
  it('点击选中：update:modelValue + aria-selected', async () => {
    const w = mountTree()
    await row(w, 'db').trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['db'])
    await wrapper!.setProps({ modelValue: 'db' })
    expect(row(w, 'db').attributes('aria-selected')).toBe('true')
  })

  it('禁用节点不可选中', async () => {
    const w = mountTree()
    await row(w, 'off').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(row(w, 'off').attributes('aria-disabled')).toBe('true')
  })

  it('Enter / Space 选中当前聚焦节点', async () => {
    const w = mountTree()
    await key(w, 'db', 'Enter')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['db'])
  })
})

describe('UxTree 键盘导航（APG Tree）', () => {
  it('→ 展开再进入首子级；← 收起后回父级', async () => {
    const w = mountTree()
    await key(w, 'db', 'ArrowRight')
    expect(w.emitted('update:expanded')?.[0]).toEqual([['db']])
    await wrapper!.setProps({ expanded: ['db'] })
    expect(row(w, 'db').attributes('aria-expanded')).toBe('true')
    await key(w, 'db', 'ArrowRight')
    expect(document.activeElement).toBe(row(w, 'users').element)
    await key(w, 'users', 'ArrowLeft')
    expect(document.activeElement).toBe(row(w, 'db').element)
    await key(w, 'db', 'ArrowLeft')
    expect(w.emitted('update:expanded')?.at(-1)).toEqual([[]])
  })

  it('↑↓ 在可见项间移动（含展开后的子级）', async () => {
    const w = mountTree({ expanded: ['db'] })
    await key(w, 'db', 'ArrowDown')
    expect(document.activeElement).toBe(row(w, 'users').element)
    await key(w, 'users', 'ArrowDown')
    expect(document.activeElement).toBe(row(w, 'orders').element)
    await key(w, 'orders', 'ArrowDown')
    expect(document.activeElement).toBe(row(w, 'lost').element)
    await key(w, 'lost', 'ArrowUp')
    expect(document.activeElement).toBe(row(w, 'orders').element)
  })

  it('Home / End 跳首末', async () => {
    const w = mountTree()
    await key(w, 'db', 'End')
    expect(document.activeElement).toBe(row(w, 'shell').element)
    await key(w, 'shell', 'Home')
    expect(document.activeElement).toBe(row(w, 'db').element)
  })

  it('首字母跳转（大小写不敏感，环形查找）', async () => {
    const w = mountTree()
    await key(w, 'db', 's')
    expect(document.activeElement).toBe(row(w, 'shell').element)
    await key(w, 'shell', 'a')
    expect(document.activeElement).toBe(row(w, 'lost').element)
  })
})

describe('UxTree 搜索过滤', () => {
  it('命中节点保留祖先链并强制展开', async () => {
    const w = mountTree()
    await wrapper!.setProps({ filter: 'orders' })
    const visible = rows(w).map((r) => r.attributes('data-ux-tree-id'))
    expect(visible).toEqual(['db', 'orders'])
    expect(row(w, 'db').attributes('aria-expanded')).toBe('true')
  })

  it('清空过滤恢复原状（展开态由 expanded prop 决定）', async () => {
    const w = mountTree({ expanded: [] })
    await wrapper!.setProps({ filter: 'users' })
    expect(rows(w)).toHaveLength(2)
    await wrapper!.setProps({ filter: '' })
    expect(rows(w)).toHaveLength(4)
    expect(row(w, 'db').attributes('aria-expanded')).toBe('false')
  })
})

describe('UxTree 懒加载', () => {
  it('展开无 children 的非叶节点触发 lazyLoad，完成后渲染子级', async () => {
    const lazyLoad = vi.fn(async (node: TreeNodeData) =>
      node.id === 'remote'
        ? [{ id: 'remote-child', label: 'remote child', leaf: true }]
        : [],
    )
    const items: TreeNodeData[] = [{ id: 'remote', label: 'Remote node' }]
    const w = mountTree({ lazyLoad }, items)
    expect(row(w, 'remote').attributes('aria-expanded')).toBe('false')
    await toggle(w, 'remote')
    await wrapper!.setProps({ expanded: ['remote'] })
    expect(w.emitted('update:expanded')?.[0]).toEqual([['remote']])
    await vi.waitFor(() => {
      expect(lazyLoad).toHaveBeenCalledTimes(1)
    })
    await nextTick()
    await nextTick()
    expect(row(w, 'remote-child').exists()).toBe(true)
    expect(row(w, 'remote').attributes('aria-expanded')).toBe('true')
  })

  it('显式 leaf 不参与懒加载', async () => {
    const lazyLoad = vi.fn()
    const items: TreeNodeData[] = [{ id: 'leafy', label: 'Leafy', leaf: true }]
    const w = mountTree({ lazyLoad }, items)
    await toggle(w, 'leafy')
    expect(lazyLoad).not.toHaveBeenCalled()
  })
})

describe('UxTree 右键菜单集成', () => {
  it('contextmenu 上报节点与坐标', async () => {
    const w = mountTree()
    await row(w, 'db').trigger('contextmenu', { clientX: 40, clientY: 60 })
    const emitted = w.emitted('node-contextmenu')
    expect(emitted).toHaveLength(1)
    const payload = emitted![0][0] as { node: TreeNodeData; x: number; y: number }
    expect(payload.node.id).toBe('db')
    expect(payload.x).toBe(40)
    expect(payload.y).toBe(60)
  })
})

describe('UxTree 双击', () => {
  it('双击节点上报 node-dblclick（含节点与原始事件）', async () => {
    const w = mountTree()
    await row(w, 'db').trigger('dblclick')
    const emitted = w.emitted('node-dblclick')
    expect(emitted).toHaveLength(1)
    const payload = emitted![0][0] as { node: TreeNodeData; event: MouseEvent }
    expect(payload.node.id).toBe('db')
    expect(payload.event).toBeInstanceOf(MouseEvent)
  })

  it('双击目录仍切换展开（保留原行为）', async () => {
    const w = mountTree({ expanded: [] })
    await row(w, 'db').trigger('dblclick')
    expect(w.emitted('update:expanded')?.[0][0]).toEqual(['db'])
  })

  it('双击叶子节点只上报事件、不产生 expanded 变更', async () => {
    const w = mountTree({ expanded: ['db'] })
    await row(w, 'users').trigger('dblclick')
    expect(w.emitted('node-dblclick')).toHaveLength(1)
    expect(w.emitted('update:expanded')).toBeUndefined()
  })
})

describe('UxTree 拖拽（防守式校验）', () => {
  function dragOn(w: VueWrapper, id: string, clientY = 0) {
    const el = row(w, id)
    vi.spyOn(el.element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 100,
      bottom: 100,
    } as DOMRect)
    return el.trigger('dragover', {
      clientY,
      dataTransfer: { dropEffect: 'none' },
    })
  }

  function dragStart(w: VueWrapper, id: string) {
    return row(w, id).trigger('dragstart', {
      dataTransfer: { setData: vi.fn(), effectAllowed: '' },
    })
  }

  it('before/after/inside 由纵坐标分区判定并 emit node-move', async () => {
    const w = mountTree({ expanded: ['db'] })
    await dragStart(w, 'users')
    await dragOn(w, 'db', 10)
    expect(row(w, 'db').classes()).toContain('is-drop-before')
    await dragOn(w, 'db', 50)
    expect(row(w, 'db').classes()).toContain('is-drop-inside')
    // 投放按最后一次 dragover 的指示条落位（指示即所得）
    await dragOn(w, 'db', 10)
    await row(w, 'db').trigger('drop', { dataTransfer: {} })
    const moved = w.emitted('node-move')?.[0][0]
    expect(moved).toMatchObject({ dragId: 'users', targetId: 'db', position: 'before' })
  })

  it('拖到自身 / 自身子树内部必拒（组件内建防守）', async () => {
    const w = mountTree({ expanded: ['db'] })
    await dragStart(w, 'db')
    await dragOn(w, 'db', 50)
    expect(row(w, 'db').classes()).not.toContain('is-drop-inside')
    await dragOn(w, 'users', 50)
    expect(row(w, 'users').classes()).not.toContain('is-drop-inside')
    await row(w, 'users').trigger('drop', { dataTransfer: {} })
    expect(w.emitted('node-move')).toBeUndefined()
  })

  it('canDrop 返回 false 时拒绝并显示无投放指示', async () => {
    const w = mountTree({ canDrop: () => false, expanded: ['db'] })
    await dragStart(w, 'users')
    await dragOn(w, 'lost', 50)
    expect(row(w, 'lost').classes()).not.toContain('is-drop-inside')
    await row(w, 'lost').trigger('drop', { dataTransfer: {} })
    expect(w.emitted('node-move')).toBeUndefined()
  })
})

describe('UxTree 指针拖拽兜底（Tauri/WebView2 无 HTML5 DnD）', () => {
  function press(w: VueWrapper, id: string, x = 10, y = 10): void {
    row(w, id).element.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: x, clientY: y }),
    )
  }

  function move(x: number, y: number): void {
    document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y }))
  }

  function up(x = 10, y = 10): void {
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: x, clientY: y }))
  }

  it('行不设 draggable（Tauri 下避免原生拖拽循环取消指针流），拖拽全由指针兜底承担', () => {
    const w = mountTree({ expanded: ['db'] })
    expect(row(w, 'users').attributes('draggable')).toBeUndefined()
  })

  it('指针手势超阈值激活，落点行由 elementFromPoint 判定并 emit node-move', async () => {
    const w = mountTree({ expanded: ['db'] })
    const target = row(w, 'db').element
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 100,
      bottom: 100,
    } as DOMRect)
    const original = document.elementFromPoint
    document.elementFromPoint = () => target
    try {
      press(w, 'users')
      move(30, 50)
      await nextTick()
      expect(row(w, 'db').classes()).toContain('is-drop-inside')
      expect(w.find('.ux-tree').classes()).toContain('is-pointer-dragging')
      up(30, 50)
    } finally {
      document.elementFromPoint = original
      vi.restoreAllMocks()
    }
    const moved = w.emitted('node-move')?.[0][0]
    expect(moved).toMatchObject({ dragId: 'users', targetId: 'db', position: 'inside' })
  })

  it('位移未超阈值松开不触发拖拽，点击选中不受影响', async () => {
    const w = mountTree({ expanded: ['db'] })
    press(w, 'users')
    move(12, 11)
    up(12, 11)
    expect(w.emitted('node-move')).toBeUndefined()
    await row(w, 'users').trigger('click')
    expect(w.emitted('update:modelValue')?.map((args) => args[0])).toEqual(['users'])
  })

  it('pointercancel（原生拖拽接管信号）后指针流失效并清场', async () => {
    const w = mountTree({ expanded: ['db'] })
    const target = row(w, 'db').element
    const original = document.elementFromPoint
    document.elementFromPoint = () => target
    try {
      press(w, 'users')
      move(30, 12)
      document.dispatchEvent(new Event('pointercancel'))
      move(40, 14)
      up(40, 14)
    } finally {
      document.elementFromPoint = original
    }
    await nextTick()
    expect(w.emitted('node-move')).toBeUndefined()
    expect(w.find('.ux-tree').classes()).not.toContain('is-pointer-dragging')
  })

  it('disabled 节点不可发起指针拖拽', () => {
    const w = mountTree({ expanded: ['db'] })
    const target = row(w, 'users').element
    const original = document.elementFromPoint
    document.elementFromPoint = () => target
    try {
      press(w, 'off')
      move(30, 12)
      up(30, 12)
    } finally {
      document.elementFromPoint = original
    }
    expect(w.emitted('node-move')).toBeUndefined()
  })

  it('落点在树外（elementFromPoint 无行）时不产生指示与移动', () => {
    const w = mountTree({ expanded: ['db'] })
    const original = document.elementFromPoint
    document.elementFromPoint = () => null
    try {
      press(w, 'users')
      move(400, 300)
      up(400, 300)
    } finally {
      document.elementFromPoint = original
    }
    expect(w.emitted('node-move')).toBeUndefined()
  })
})
