import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import UxFloatPanel from './UxFloatPanel.vue'
import UxPanel from '../panel/UxPanel.vue'
import type { FloatGeom } from '@ux/composables'

enableAutoUnmount(afterEach)

const geom: FloatGeom = { x: 20, y: 30, w: 400, h: 300 }

function mountFloat(g: FloatGeom = geom): VueWrapper {
  return mount(UxFloatPanel, {
    props: { panelId: 'f1', title: '便签', geom: g, z: 101 },
    attachTo: document.body,
  })
}

describe('UxFloatPanel', () => {
  it('渲染几何与层叠', () => {
    const wrapper = mountFloat()
    const root = wrapper.find('[data-ux="float"]')
    const style = root.attributes('style') ?? ''
    expect(style).toContain('left: 20px')
    expect(style).toContain('top: 30px')
    expect(style).toContain('width: 400px')
    expect(style).toContain('height: 300px')
    expect(style).toContain('z-index: 101') // tokens-exempt 测试固定值
    expect(root.text()).toContain('便签')
  })

  it('geom 变化 → 位置更新', async () => {
    const wrapper = mountFloat()
    await wrapper.setProps({ geom: { ...geom, x: 200, y: 150 } })
    const style = wrapper.find('[data-ux="float"]').attributes('style') ?? ''
    expect(style).toContain('left: 200px')
    expect(style).toContain('top: 150px')
  })

  it('任意点击 → focus 上报', async () => {
    const wrapper = mountFloat()
    await wrapper.find('[data-ux="float"]').trigger('pointerdown')
    expect(wrapper.emitted('focus')).toEqual([['f1']])
  })

  it('标题栏拖拽：focus + move 偏移 + pointerup 清理', async () => {
    const wrapper = mountFloat()
    const panel = wrapper.findComponent(UxPanel)

    panel.vm.$emit('header-pointerdown', 'f1', new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
    expect(wrapper.emitted('focus')).toEqual([['f1']])
    expect(document.body.classList.contains('ux-resizing')).toBe(true)

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 160, clientY: 140 }))
    await nextTick()
    expect(wrapper.emitted('move')).toEqual([['f1', 80, 70]])

    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(document.body.classList.contains('ux-resizing')).toBe(false)

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 300 }))
    await nextTick()
    expect(wrapper.emitted('move')?.length).toBe(1)
  })

  it('右下角 resize 手柄：resize 上报偏移量', async () => {
    const wrapper = mountFloat()
    const handle = wrapper.find('.ux-float__resize')

    await handle.trigger('pointerdown', { clientX: 10, clientY: 10 })
    expect(wrapper.emitted('focus')).toEqual([['f1']])
    expect(document.body.classList.contains('ux-resizing')).toBe(true)

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 42, clientY: 36 }))
    await nextTick()
    expect(wrapper.emitted('resize')).toEqual([['f1', { w: 432, h: 326 }]])

    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(document.body.classList.contains('ux-resizing')).toBe(false)
  })

  it('UxPanel 动作透传：dock/minimize/close', async () => {
    const wrapper = mountFloat()
    const panel = wrapper.findComponent(UxPanel)

    panel.vm.$emit('dock', 'f1')
    panel.vm.$emit('minimize', 'f1')
    panel.vm.$emit('close', 'f1')

    expect(wrapper.emitted('dock')).toEqual([['f1']])
    expect(wrapper.emitted('minimize')).toEqual([['f1']])
    expect(wrapper.emitted('close')).toEqual([['f1']])
  })
})
