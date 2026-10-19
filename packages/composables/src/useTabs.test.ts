import { describe, expect, it, vi } from 'vitest'
import { useTabs, type TabItemState } from './useTabs'

interface Item extends TabItemState {
  id: string
  title: string
}

function tab(id: string, extra: Partial<Item> = {}): Omit<Item, 'id'> & { id: string } {
  return { id, title: `T-${id}`, ...extra }
}

describe('useTabs', () => {
  it('open 默认激活新页签并自动生成 id', () => {
    const api = useTabs<Item>()
    const created = api.open({ title: 'A' })
    expect(created).not.toBeNull()
    expect(api.tabs.value).toHaveLength(1)
    expect(api.activeId.value).toBe(created!.id)
    expect(api.activeTab.value?.title).toBe('A')
  })

  it('open activate=false 时首个页签仍激活，后续不抢占', () => {
    const api = useTabs<Item>()
    const a = api.open({ title: 'A' }, { activate: false })
    const b = api.open({ title: 'B' }, { activate: false })
    expect(api.activeId.value).toBe(a!.id)
    expect(api.tabs.value).toHaveLength(2)
    expect(api.tabs.value[1].id).toBe(b!.id)
  })

  it('dedupe 命中时激活已有页签且不新增', () => {
    const api = useTabs<Item>()
    const a = api.open(tab('a'), { dedupe: (t) => t.title === 'T-a' })
    api.open(tab('b'))
    const hit = api.open(tab('a2', { title: 'T-a' }), { dedupe: (t) => t.title === 'T-a' })
    expect(hit!.id).toBe(a!.id)
    expect(api.tabs.value).toHaveLength(2)
    expect(api.activeId.value).toBe(a!.id)
  })

  it('max 上限：open 返回 null 并触发 onLimit', () => {
    const onLimit = vi.fn()
    const api = useTabs<Item>({ max: 2, onLimit })
    api.open(tab('a'))
    api.open(tab('b'))
    expect(api.open(tab('c'))).toBeNull()
    expect(onLimit).toHaveBeenCalledWith(2)
    expect(api.tabs.value).toHaveLength(2)
  })

  it('close 邻位激活：右侧优先，末位回退左侧', () => {
    const api = useTabs<Item>()
    const [a, b, c] = [tab('a'), tab('b'), tab('c')].map((t) => api.open(t)!)
    api.activate(c.id)
    api.close(c.id)
    expect(api.activeId.value).toBe(b.id)
    api.close(b.id)
    expect(api.activeId.value).toBe(a.id)
    api.close(a.id)
    expect(api.activeId.value).toBe('')
    expect(api.tabs.value).toHaveLength(0)
    expect([a, b, c].every(Boolean)).toBe(true)
  })

  it('close 非活动页签不改变激活态', () => {
    const api = useTabs<Item>()
    const a = api.open(tab('a'))!
    const b = api.open(tab('b'))!
    api.close(a.id)
    expect(api.activeId.value).toBe(b.id)
  })

  it('closable=false 的页签无法单个或批量关闭', () => {
    const api = useTabs<Item>()
    const pinned = api.open(tab('pinned', { closable: false }))!
    api.open(tab('a'))
    api.open(tab('b'))
    api.close(pinned.id)
    api.closeRight(pinned.id)
    api.closeOthers(pinned.id)
    api.closeAll()
    expect(api.tabs.value.map((t) => t.id)).toEqual(['pinned'])
  })

  it('guardClose 返回 false 阻止单个 close，批量关闭不经过守卫', () => {
    const api = useTabs<Item>({ guardClose: (t) => !t.dirty })
    api.open(tab('a', { dirty: true }))
    api.open(tab('b'))
    api.close('a')
    expect(api.tabs.value).toHaveLength(2)
    api.closeAll()
    expect(api.tabs.value).toHaveLength(0)
  })

  it('closeOthers 保留自身与 pinned', () => {
    const api = useTabs<Item>()
    api.open(tab('a'))
    api.open(tab('pinned', { closable: false }))
    const c = api.open(tab('c'))!
    api.closeOthers(c.id)
    expect(api.tabs.value.map((t) => t.id).sort()).toEqual(['c', 'pinned'])
    expect(api.activeId.value).toBe(c.id)
  })

  it('closeRight / closeLeft：激活页签被移除时回落到基准页签', () => {
    const api = useTabs<Item>()
    api.open(tab('a'))
    api.open(tab('b'))
    api.open(tab('c'))
    api.activate('c')
    api.closeRight('b')
    expect(api.tabs.value.map((t) => t.id)).toEqual(['a', 'b'])
    expect(api.activeId.value).toBe('b')
    api.closeLeft('b')
    expect(api.tabs.value.map((t) => t.id)).toEqual(['b'])
    expect(api.activeId.value).toBe('b')
  })

  it('closeAll 保留 pinned 并激活幸存者', () => {
    const api = useTabs<Item>()
    api.open(tab('a'))
    const pinned = api.open(tab('pinned', { closable: false }))!
    api.closeAll()
    expect(api.tabs.value.map((t) => t.id)).toEqual(['pinned'])
    expect(api.activeId.value).toBe(pinned.id)
  })

  it('move 支持前移、后移（下标修正）与越界钳制', () => {
    const api = useTabs<Item>()
    ;['a', 'b', 'c', 'd'].forEach((id) => api.open(tab(id)))
    api.move('d', 0)
    expect(api.tabs.value.map((t) => t.id)).toEqual(['d', 'a', 'b', 'c'])
    api.move('d', 4)
    expect(api.tabs.value.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd'])
    api.move('a', 99)
    expect(api.tabs.value.map((t) => t.id)).toEqual(['b', 'c', 'd', 'a'])
    api.move('a', -5)
    expect(api.tabs.value.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd'])
    api.move('ghost', 1)
    expect(api.tabs.value).toHaveLength(4)
  })

  it('cycle 正反循环切换，空列表安全', () => {
    const api = useTabs<Item>()
    api.cycle()
    expect(api.tabs.value).toHaveLength(0)
    const a = api.open(tab('a'))!
    api.open(tab('b'))
    api.open(tab('c'))
    api.cycle()
    expect(api.activeId.value).toBe(a.id)
    api.cycle()
    expect(api.activeId.value).toBe(api.tabs.value[1].id)
    api.cycle()
    expect(api.activeId.value).toBe(api.tabs.value[2].id)
    api.cycle(1)
    expect(api.activeId.value).toBe(a.id)
    api.cycle(-1)
    expect(api.activeId.value).toBe(api.tabs.value[2].id)
  })

  it('activate 对不存在的 id 无效', () => {
    const api = useTabs<Item>()
    const a = api.open(tab('a'))!
    api.activate('ghost')
    expect(api.activeId.value).toBe(a.id)
  })

  it('exportSnapshot 返回拷贝，importSnapshot 恢复并处理激活目标', () => {
    const api = useTabs<Item>()
    api.open(tab('a'))
    api.open(tab('b'))
    const snapshot = api.exportSnapshot()
    snapshot[0].title = 'MUTATED'
    expect(api.tabs.value[0].title).toBe('T-a')

    const other = useTabs<Item>()
    other.importSnapshot(api.exportSnapshot())
    expect(other.tabs.value.map((t) => t.id)).toEqual(['a', 'b'])
    expect(other.activeId.value).toBe('a')

    other.importSnapshot(api.exportSnapshot(), { activate: 'b' })
    expect(other.activeId.value).toBe('b')

    other.importSnapshot(api.exportSnapshot(), { activate: 'ghost' })
    expect(other.activeId.value).toBe('a')
  })
})
