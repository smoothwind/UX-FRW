import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useDismiss, type DismissReason } from './useDismiss'

let lastWrapper: { unmount(): void } | null = null

function mountDismiss(opts: { escape?: boolean } = {}) {
  const active = ref(false)
  const reasons: DismissReason[] = []
  const Host = defineComponent({
    setup() {
      useDismiss({
        active: () => active.value,
        onDismiss: (reason) => reasons.push(reason),
        escape: opts.escape,
        ignore: () => [document.getElementById('anchor'), document.getElementById('layer')],
      })
      return () => ''
    },
  })
  const wrapper = mount(Host, { attachTo: document.body })
  lastWrapper = wrapper
  document.body.innerHTML =
    '<button id="anchor">触发</button><div id="layer">浮层</div><div id="outside">外部</div>'
  return { wrapper, active, reasons }
}

function pointerDown(target: Element): void {
  target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
}

function pressEscape(): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
}

afterEach(() => {
  lastWrapper?.unmount()
  lastWrapper = null
  document.body.innerHTML = ''
})

describe('useDismiss', () => {
  it('active 时监听：Esc → onDismiss("escape") 并阻断传播', async () => {
    const { active, reasons } = mountDismiss()
    expect(reasons).toHaveLength(0)
    pressEscape()
    expect(reasons).toHaveLength(0)
    active.value = true
    await nextTick()
    pressEscape()
    expect(reasons).toEqual(['escape'])
  })

  it('外部 pointerdown → onDismiss("outside")；ignore 元素内部不 dismiss', async () => {
    const { active, reasons } = mountDismiss()
    active.value = true
    await nextTick()
    pointerDown(document.getElementById('outside')!)
    expect(reasons).toEqual(['outside'])
    pointerDown(document.getElementById('anchor')!)
    pointerDown(document.getElementById('layer')!)
    expect(reasons).toEqual(['outside'])
    // ignore 元素的后代也不算外部
    const child = document.createElement('span')
    document.getElementById('layer')!.appendChild(child)
    pointerDown(child)
    expect(reasons).toEqual(['outside'])
  })

  it('escape:false 时 Esc 不处理（菜单类自行分层）', async () => {
    const { active, reasons } = mountDismiss({ escape: false })
    active.value = true
    await nextTick()
    pressEscape()
    expect(reasons).toHaveLength(0)
    pointerDown(document.getElementById('outside')!)
    expect(reasons).toEqual(['outside'])
  })

  it('active 置回 false 后停止监听', () => {
    const { active, reasons } = mountDismiss()
    active.value = true
    active.value = false
    pressEscape()
    pointerDown(document.getElementById('outside')!)
    expect(reasons).toHaveLength(0)
  })

  it('组件卸载后不再监听', async () => {
    const { wrapper, active, reasons } = mountDismiss()
    active.value = true
    wrapper.unmount()
    pressEscape()
    pointerDown(document.getElementById('outside')!)
    expect(reasons).toHaveLength(0)
  })
})
