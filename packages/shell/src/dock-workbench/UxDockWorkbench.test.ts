import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { useDockLayout, type DockLayout } from '@ux/composables'
import UxDockWorkbench from './UxDockWorkbench.vue'
import UxFloatPanel from '../float-panel/UxFloatPanel.vue'
import UxPanel from '../panel/UxPanel.vue'
import UxSplitter from '../splitter/UxSplitter.vue'
import type { DockPanelDef } from '../types'

enableAutoUnmount(afterEach)
afterEach(() => localStorage.clear())

const defs: DockPanelDef[] = [
  { id: 'explorer', title: '资源管理器' },
  { id: 'props', title: '属性' },
  { id: 'log', title: '日志' },
  { id: 'notes', title: '便签' },
]

interface LayoutSeed {
  key: string
  extraPanels?: Record<string, { zone: 'left' | 'right' | 'bottom' | null }>
}

function buildLayout({ key, extraPanels = {} }: LayoutSeed): DockLayout {
  return useDockLayout({
    key,
    panels: {
      explorer: { zone: 'left', lastZone: 'left' },
      props: { zone: 'right', lastZone: 'right' },
      log: { zone: 'bottom', lastZone: 'bottom' },
      ...extraPanels,
    },
    sizes: { left: 260, right: 300, bottom: 220 },
    limits: { left: [180, 420] },
  })
}

function mountWorkbench(layout: DockLayout) {
  return mount(UxDockWorkbench, {
    props: { layout, panels: defs },
    slots: {
      activity: '<div data-wb-activity>activity</div>',
      center: '<div data-wb-center>center</div>',
      panel: '<template #panel="{ id }"><div :data-tb="id">{{ id }} 内容</div></template>',
    },
  })
}

describe('UxDockWorkbench', () => {
  it('渲染三区面板、插槽与 Splitters', () => {
    const wrapper = mountWorkbench(buildLayout({ key: 'wb-basic' }))

    expect(wrapper.find('[data-wb-activity]').exists()).toBe(true)
    expect(wrapper.find('[data-wb-center]').exists()).toBe(true)

    expect(wrapper.find('[data-ux-part="dock-left"]').attributes('style')).toContain('width: 260px')
    expect(wrapper.find('[data-ux-part="dock-right"]').attributes('style')).toContain('width: 300px')
    expect(wrapper.find('[data-ux-part="dock-bottom"]').attributes('style')).toContain('height: 220px')

    expect(wrapper.find('[data-tb="explorer"]').exists()).toBe(true)
    expect(wrapper.find('[data-tb="props"]').exists()).toBe(true)
    expect(wrapper.find('[data-tb="log"]').exists()).toBe(true)

    const splitters = wrapper.findAllComponents(UxSplitter)
    expect(splitters).toHaveLength(3)
    expect(splitters[0].props('modelValue')).toBe(260)
    expect(splitters[0].props('min')).toBe(180)
    expect(splitters[0].props('max')).toBe(420)
    expect(splitters[1].props('modelValue')).toBe(300)
    expect(splitters[2].props('modelValue')).toBe(220)
  })

  it('activate：同区占用者让位', async () => {
    const layout = buildLayout({
      key: 'wb-activate',
      extraPanels: { notes: { zone: null } },
    })
    const wrapper = mountWorkbench(layout)

    layout.activate('notes')
    await nextTick()

    expect(wrapper.find('[data-tb="notes"]').exists()).toBe(true)
    expect(wrapper.find('[data-tb="explorer"]').exists()).toBe(false)
  })

  it('面板关闭 → hide → 区消失', async () => {
    const wrapper = mountWorkbench(buildLayout({ key: 'wb-close' }))
    const panels = wrapper.findAllComponents(UxPanel)
    expect(panels.length).toBe(3)

    panels[1].vm.$emit('close', 'props')
    await nextTick()
    expect(wrapper.find('[data-ux-part="dock-right"]').exists()).toBe(false)

    panels[2].vm.$emit('close', 'log')
    await nextTick()
    expect(wrapper.find('[data-ux-part="dock-bottom"]').exists()).toBe(false)
  })

  it('float → 悬浮卡渲染；minimize → 层叠条；restore → 回悬浮', async () => {
    const wrapper = mountWorkbench(buildLayout({ key: 'wb-float' }))
    const layout = wrapper.props('layout') as DockLayout

    layout.float('log')
    await nextTick()

    const float = wrapper.find('[data-ux-part="floats"]')
    expect(float.exists()).toBe(true)
    const floatEl = wrapper.findComponent(UxFloatPanel)
    expect(floatEl.props('title')).toBe('日志')
    expect(floatEl.props('geom')).toMatchObject({ x: 120, y: 90, w: 480, h: 360 })

    layout.minimize('log')
    await nextTick()
    expect(wrapper.find('[data-ux-part="floats"] [data-ux="float"]').exists()).toBe(false)

    const stack = wrapper.find('[data-ux-part="minimize-stack"]')
    expect(stack.exists()).toBe(true)
    expect(stack.find('button').attributes('title')).toBe('日志')

    await stack.find('button').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-ux-part="floats"] [data-ux="float"]').exists()).toBe(true)
    expect(wrapper.find('[data-ux-part="minimize-stack"]').exists()).toBe(false)
  })

  it('拖拽投放：停靠面板投放到悬浮区', async () => {
    const wrapper = mountWorkbench(buildLayout({ key: 'wb-drag' }))
    const layout = wrapper.props('layout') as DockLayout

    layout.beginDrag('explorer')
    await nextTick()

    const overlay = wrapper.find('[data-ux-part="drop-overlay"]')
    expect(overlay.exists()).toBe(true)
    expect(overlay.findAll('.ux-dock__dz')).toHaveLength(4)

    await overlay.find('.ux-dock__dz--float').trigger('dragover')
    expect(overlay.find('.ux-dock__dz--float').classes()).toContain('is-over')

    await overlay.find('.ux-dock__dz--float').trigger('drop')
    await nextTick()

    expect(wrapper.find('[data-ux-part="drop-overlay"]').exists()).toBe(false)
    const floatEl = wrapper.findComponent(UxFloatPanel)
    expect(floatEl.props('title')).toBe('资源管理器')
    expect(wrapper.find('[data-ux-part="dock-left"]').exists()).toBe(false)
  })

  it('Splitter 拖拽 → resizeZone 钳制在 [min, max]', async () => {
    const wrapper = mountWorkbench(buildLayout({ key: 'wb-resize' }))
    const left = wrapper.findAllComponents(UxSplitter)[0]

    left.vm.$emit('update:modelValue', 999)
    await nextTick()
    expect(wrapper.find('[data-ux-part="dock-left"]').attributes('style')).toContain('width: 420px')

    left.vm.$emit('update:modelValue', 50)
    await nextTick()
    expect(wrapper.find('[data-ux-part="dock-left"]').attributes('style')).toContain('width: 180px')
  })
})
