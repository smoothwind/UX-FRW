import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UxPanel from './UxPanel.vue'

function mountPanel(props: Record<string, unknown> = {}) {
  return mount(UxPanel, { props: { panelId: 'p1', title: '资源管理器', ...props } })
}

describe('UxPanel', () => {
  it('结构：data-ux / title / 双插槽分区', () => {
    const wrapper = mountPanel({
      closable: false,
      dockable: false,
    })
    expect(wrapper.find('[data-ux="panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-ux-part="panel-head"]').text()).toContain('资源管理器')
    expect(wrapper.find('[data-ux-part="panel-body"]').exists()).toBe(true)
  })

  it('停靠态默认按钮：悬浮 + 关闭，无最小化', async () => {
    const wrapper = mountPanel()
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)

    await buttons[0].trigger('click')
    expect(wrapper.emitted('float')).toEqual([['p1']])
    await buttons[1].trigger('click')
    expect(wrapper.emitted('close')).toEqual([['p1']])
    expect(wrapper.emitted('minimize')).toBeUndefined()
  })

  it('悬浮态：显示最小化，双击/按钮均转悬浮语义', async () => {
    const wrapper = mountPanel({ floating: true })
    expect(wrapper.find('[data-ux="panel"]').classes()).toContain('ux-panel--floating')

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(3)

    await buttons[1].trigger('click') // 最小化
    expect(wrapper.emitted('minimize')).toEqual([['p1']])
    await buttons[0].trigger('click') // 停靠
    expect(wrapper.emitted('dock')).toEqual([['p1']])

    await wrapper.find('[data-ux-part="panel-head"]').trigger('dblclick')
    expect(wrapper.emitted('dblclick')).toEqual([['p1']])
  })

  it('悬浮态头部按下转发 pointerdown；按钮区域按下不转发', async () => {
    const wrapper = mountPanel({ floating: true })
    const head = wrapper.find('[data-ux-part="panel-head"]')

    await head.trigger('pointerdown')
    expect(wrapper.emitted('header-pointerdown')!.length).toBe(1)

    await wrapper.find('button').trigger('pointerdown')
    expect(wrapper.emitted('header-pointerdown')!.length).toBe(1)
  })

  it('非悬浮态头部按下不转发（拖拽换区走 DnD）', async () => {
    const wrapper = mountPanel()
    await wrapper.find('[data-ux-part="panel-head"]').trigger('pointerdown')
    expect(wrapper.emitted('header-pointerdown')).toBeUndefined()
  })

  it('DnD：draggable 绑定头部，dragstart 写入 dataTransfer 并上报', async () => {
    const wrapper = mountPanel({ draggable: false })
    expect(wrapper.find('[data-ux-part="panel-head"]').attributes('draggable')).toBe('false')

    const floating = mountPanel({ floating: true })
    expect(floating.find('[data-ux-part="panel-head"]').attributes('draggable')).toBe('false')

    const docked = mountPanel()
    const head = docked.find('[data-ux-part="panel-head"]')
    expect(head.attributes('draggable')).toBe('true')

    const setData = vi.fn()
    await head.trigger('dragstart', { dataTransfer: { setData, effectAllowed: null } })
    expect(setData).toHaveBeenCalledWith('text/plain', 'p1')
    expect(docked.emitted('dragstart')).toEqual([['p1']])

    await head.trigger('dragend')
    expect(docked.emitted('dragend')).toEqual([['p1']])
  })
})
