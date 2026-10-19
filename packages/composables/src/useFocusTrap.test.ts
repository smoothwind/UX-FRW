import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import { useFocusTrap } from './useFocusTrap'

enableAutoUnmount(afterEach)

function createHarness(active: Ref<boolean>, onEscape?: () => void, returnFocus?: boolean) {
  return defineComponent({
    setup() {
      const container = ref<HTMLElement | null>(null)
      useFocusTrap(container, { active, onEscape, returnFocus })
      return () =>
        h('div', { ref: container, tabindex: '-1', 'data-trap-container': '' }, [
          h('button', { 'data-btn': 'a' }, 'A'),
          h('button', { 'data-btn': 'b' }, 'B'),
        ])
    },
  })
}

function mountTrap(active: Ref<boolean, boolean>, onEscape?: () => void, returnFocus?: boolean): VueWrapper {
  return mount(createHarness(active, onEscape, returnFocus), { attachTo: document.body })
}

describe('useFocusTrap', () => {
  it('激活时聚焦容器内首个可聚焦元素', async () => {
    const active = ref(true)
    mountTrap(active)
    await nextTick()
    await nextTick()
    expect(document.activeElement?.getAttribute('data-btn')).toBe('a')
  })

  it('激活时无内部可聚焦元素 → 聚焦容器本身', async () => {
    const Empty = defineComponent({
      setup() {
        const container = ref<HTMLElement | null>(null)
        useFocusTrap(container, { active: ref(true) })
        return () => h('div', { ref: container, tabindex: '-1' }, '空容器')
      },
    })
    mount(Empty, { attachTo: document.body })
    await nextTick()
    await nextTick()
    expect(document.activeElement?.hasAttribute('tabindex')).toBe(true)
    expect(document.activeElement?.textContent).toBe('空容器')
  })

  it('Tab 循环：末尾继续 → 首个；开头 Shift+Tab → 末尾', async () => {
    const active = ref(true)
    mountTrap(active)
    await nextTick()
    await nextTick()

    const last = document.querySelector('[data-btn="b"]') as HTMLElement
    last.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    expect(document.activeElement?.getAttribute('data-btn')).toBe('a')

    const first = document.querySelector('[data-btn="a"]') as HTMLElement
    first.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }))
    expect(document.activeElement?.getAttribute('data-btn')).toBe('b')
  })

  it('焦点在容器外时 Tab / Shift+Tab 拉回容器内', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()

    const active = ref(true)
    mountTrap(active)
    await nextTick()
    await nextTick()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    expect(document.activeElement?.getAttribute('data-btn')).toBe('a')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }))
    expect(document.activeElement?.getAttribute('data-btn')).toBe('b')
  })

  it('Escape → onEscape 回调', () => {
    const onEscape = vi.fn()
    const active = ref(true)
    mountTrap(active, onEscape)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('关闭后焦点归还；returnFocus false 时保持不动', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const active = ref(false)
    mountTrap(active)
    active.value = true
    await nextTick()
    await nextTick()
    expect(document.activeElement?.getAttribute('data-btn')).toBe('a')

    active.value = false
    await nextTick()
    expect(document.activeElement).toBe(trigger)

    const trigger2 = document.createElement('button')
    document.body.appendChild(trigger2)
    trigger2.focus()

    const active2 = ref(false)
    mountTrap(active2, undefined, false)
    active2.value = true
    await nextTick()
    await nextTick()
    expect(document.activeElement?.getAttribute('data-btn')).toBe('a')

    active2.value = false
    await nextTick()
    expect(document.activeElement).not.toBe(trigger2)
  })

  it('未激活时 Tab 不约束（不拦截默认行为）', () => {
    const active = ref(false)
    const onEscape = vi.fn()
    mountTrap(active, onEscape)
    const event = new KeyboardEvent('keydown', { key: 'Tab' })
    const spy = vi.spyOn(event, 'preventDefault')
    document.dispatchEvent(event)
    expect(spy).not.toHaveBeenCalled()
    expect(onEscape).not.toHaveBeenCalled()
  })
})
