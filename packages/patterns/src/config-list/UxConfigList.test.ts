import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import UxConfigList from './UxConfigList.vue'
import type { ConfigListEntry, ConfigListFacet, ConfigListGroup } from './types'

enableAutoUnmount(afterEach)

const groups: ConfigListGroup[] = [
  { id: 'paging', label: '查询分页' },
  { id: 'preview', label: '表预览' },
]

const entries: ConfigListEntry[] = [
  {
    key: 'paged.mysql',
    group: 'paging',
    usage: 'MySQL 分页包装',
    builtin: 'SELECT * FROM t LIMIT 10',
    placeholders: ['sql'],
    facet: 'mysql',
    tag: 'MySQL',
  },
  { key: 'paged.oracle', group: 'paging', usage: 'Oracle 分页包装', builtin: 'SELECT * FROM t', facet: 'oracle', tag: 'Oracle' },
  { key: 'preview.mysql', group: 'preview', usage: 'MySQL 表预览', builtin: 'SELECT * FROM t LIMIT 100', facet: 'mysql' },
]

const facets: ConfigListFacet[] = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'oracle', label: 'Oracle' },
]

function mountList(extra: Record<string, unknown> = {}) {
  return mount(UxConfigList, {
    props: { entries, groups, modelValue: {}, facets, ...extra },
  })
}

function chipButtons(wrapper: ReturnType<typeof mountList>) {
  return wrapper.findAll('.ux-fchips__chip')
}

function segButtons(wrapper: ReturnType<typeof mountList>) {
  return wrapper.findAll('.ux-seg__item')
}

describe('UxConfigList', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('渲染分组与条目；无覆盖时默认展开第一组', () => {
    const wrapper = mountList()
    const heads = wrapper.findAll('.ux-clist__group-head')
    expect(heads).toHaveLength(2)
    expect(heads[0].find('.ux-clist__group-name').text()).toBe('查询分页')
    expect(heads[0].attributes('aria-expanded')).toBe('true')
    expect(heads[1].attributes('aria-expanded')).toBe('false')
    // 组头完整语义（红线 10）：名称 + 条数 + 覆盖数
    expect(heads[0].attributes('aria-label')).toContain('查询分页')
    expect(heads[0].attributes('aria-label')).toContain('2')
    // usage 为主标题，key 降级到 meta
    expect(wrapper.find('.ux-clist__usage').text()).toBe('MySQL 分页包装')
    expect(wrapper.find('.ux-clist__key').text()).toContain('paged.mysql')
  })

  it('有覆盖时默认展开覆盖组', () => {
    const wrapper = mountList({ modelValue: { 'preview.mysql': 'SELECT 9' } })
    const heads = wrapper.findAll('.ux-clist__group-head')
    expect(heads[0].attributes('aria-expanded')).toBe('false')
    expect(heads[1].attributes('aria-expanded')).toBe('true')
    expect(heads[1].find('.ux-clist__badge').text()).toContain('1')
  })

  it('组头点击切换展开；展开/折叠全部', async () => {
    const wrapper = mountList()
    const heads = wrapper.findAll('.ux-clist__group-head')

    await heads[1].trigger('click')
    expect(wrapper.findAll('.ux-clist__group-head')[1].attributes('aria-expanded')).toBe('true')

    const ghostButtons = wrapper.findAll('.ux-clist__actions button')
    await ghostButtons.find((b) => b.text().includes('折叠全部'))!.trigger('click')
    expect(wrapper.findAll('.ux-clist__group-head').every((h) => h.attributes('aria-expanded') === 'false')).toBe(true)

    await ghostButtons.find((b) => b.text().includes('展开全部'))!.trigger('click')
    expect(wrapper.findAll('.ux-clist__group-head').every((h) => h.attributes('aria-expanded') === 'true')).toBe(true)
  })

  it('facet 多选过滤：命中保留、无 facet 值的条目排除；筛选生效时隐藏 tag', async () => {
    const wrapper = mountList()
    await chipButtons(wrapper)[0].trigger('click') // 选中 MySQL

    const usages = wrapper.findAll('.ux-clist__usage').map((u) => u.text())
    expect(usages).toContain('MySQL 分页包装')
    expect(usages).toContain('MySQL 表预览')
    expect(usages).not.toContain('Oracle 分页包装')
    // facet 筛选生效时 tag 徽标隐藏降噪
    expect(wrapper.find('.ux-chip').exists()).toBe(false)

    // 再次点击取消 → 全量恢复
    await chipButtons(wrapper)[0].trigger('click')
    expect(wrapper.findAll('.ux-clist__usage')).toHaveLength(3)
    expect(wrapper.find('.ux-chip').exists()).toBe(true)
  })

  it('覆盖状态筛选（已覆盖/未覆盖）', async () => {
    const wrapper = mountList({ modelValue: { 'paged.oracle': 'SELECT 9' } })
    const seg = segButtons(wrapper)
    await seg.find((b) => b.text().includes('已覆盖'))!.trigger('click')
    expect(wrapper.findAll('.ux-clist__usage').map((u) => u.text())).toEqual(['Oracle 分页包装'])

    await seg.find((b) => b.text().includes('未覆盖'))!.trigger('click')
    const plain = wrapper.findAll('.ux-clist__usage').map((u) => u.text())
    expect(plain).not.toContain('Oracle 分页包装')
    expect(plain).toHaveLength(2)
  })

  it('搜索覆盖 key / 用途 / 内置值', async () => {
    const wrapper = mountList()
    await wrapper.find('.ux-clist__search input').setValue('oracle')
    expect(wrapper.findAll('.ux-clist__usage').map((u) => u.text())).toEqual(['Oracle 分页包装'])

    await wrapper.find('.ux-clist__search input').setValue('limit 100')
    expect(wrapper.findAll('.ux-clist__usage').map((u) => u.text())).toEqual(['MySQL 表预览'])
  })

  it('筛选反馈条：criteria + 匹配数 + 清除', async () => {
    const wrapper = mountList()
    expect(wrapper.find('[data-ux-part="config-list-filterbar"]').exists()).toBe(false)

    await chipButtons(wrapper)[1].trigger('click') // Oracle
    const bar = wrapper.find('[data-ux-part="config-list-filterbar"]')
    expect(bar.exists()).toBe(true)
    expect(bar.text()).toContain('Oracle')
    expect(bar.text()).toContain('1')

    await bar.find('button').trigger('click')
    expect(wrapper.find('[data-ux-part="config-list-filterbar"]').exists()).toBe(false)
    expect(wrapper.findAll('.ux-clist__usage')).toHaveLength(3)
  })

  it('空态语义区分：筛选过严（act-search + 清除动作）vs 无数据', async () => {
    // 筛选过严：全量条目 + 不命中关键词 → filtered 变体 + 清除动作
    const wrapper = mountList()
    await wrapper.find('.ux-clist__search input').setValue('nomatch')
    expect(wrapper.find('.ux-empty--filtered').exists()).toBe(true)
    expect(wrapper.find('.ux-empty svg').attributes('data-icon')).toBe('act-search')
    await wrapper.find('.ux-empty__action button').trigger('click')
    expect(wrapper.findAll('.ux-clist__usage')).toHaveLength(3)

    // 无数据：空条目集 → 普通空态，无动作
    const empty = mountList({ entries: [] })
    expect(empty.find('.ux-empty__title').text()).toBe('暂无配置项')
    expect(empty.find('.ux-empty__action').exists()).toBe(false)
  })

  it('编辑条目上报 update:modelValue；脏徽标与保存计数联动', async () => {
    const wrapper = mountList()
    expect(wrapper.find('[data-ux-part="config-list-save"]').attributes('disabled')).toBeDefined()

    const editor = wrapper.find('.ux-clist__editor')
    await editor.setValue('SELECT * FROM t LIMIT 20')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ 'paged.mysql': 'SELECT * FROM t LIMIT 20' }])

    await wrapper.setProps({ modelValue: { 'paged.mysql': 'SELECT * FROM t LIMIT 20' } })
    expect(wrapper.find('[data-ux-part="config-list-dirty"]').text()).toContain('1')
    const save = wrapper.find('[data-ux-part="config-list-save"]')
    expect(save.attributes('disabled')).toBeUndefined()
    await save.trigger('click')
    expect(wrapper.emitted('save')?.at(-1)).toEqual([{ 'paged.mysql': 'SELECT * FROM t LIMIT 20' }])
  })

  it('保存仅携带非空覆盖', async () => {
    const wrapper = mountList({ modelValue: { 'paged.mysql': 'SELECT 1', 'preview.mysql': '   ' } })
    await wrapper.find('[data-ux-part="config-list-save"]').trigger('click')
    expect(wrapper.emitted('save')?.at(-1)).toEqual([{ 'paged.mysql': 'SELECT 1' }])
  })

  it('单条恢复内置置空草稿；恢复全部上报 reset', async () => {
    const wrapper = mountList({ modelValue: { 'paged.mysql': 'SELECT 1' } })
    await wrapper.find('.ux-clist__reset-one').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ 'paged.mysql': '' }])

    await wrapper.setProps({ modelValue: { 'paged.mysql': 'SELECT 1' } })
    const reset = wrapper.findAll('.ux-clist__actions button').find((b) => b.text().includes('恢复全部内置'))!
    expect(reset.attributes('disabled')).toBeUndefined()
    await reset.trigger('click')
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })

  it('saving 状态透传保存按钮 loading', () => {
    const wrapper = mountList({ modelValue: { 'paged.mysql': 'SELECT 1' }, saving: true })
    expect(wrapper.find('[data-ux-part="config-list-save"] .ux-btn__spinner').exists()).toBe(true)
  })

  it('storageKey：恢复已存展开状态并写回变更', async () => {
    vi.useFakeTimers()
    window.localStorage.setItem(
      'ux.test.clist',
      JSON.stringify({ __version: 1, data: { open: ['preview'] } }),
    )
    const wrapper = mountList({ storageKey: 'ux.test.clist' })
    expect(wrapper.findAll('.ux-clist__group-head')[0].attributes('aria-expanded')).toBe('false')
    expect(wrapper.findAll('.ux-clist__group-head')[1].attributes('aria-expanded')).toBe('true')

    await wrapper.findAll('.ux-clist__group-head')[0].trigger('click')
    vi.advanceTimersByTime(300)
    const stored = JSON.parse(window.localStorage.getItem('ux.test.clist')!) as {
      data: { open: string[] }
    }
    expect(stored.data.open).toEqual(['preview', 'paging'])
    vi.useRealTimers()
  })
})
