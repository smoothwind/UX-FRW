import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxPopover from './UxPopover.vue'

const Host = defineComponent({
  components: { UxPopover },
  props: {
    trigger: { type: String, default: 'click' },
    dismissOnOutside: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    matchTriggerWidth: { type: Boolean, default: false },
  },
  template: `
    <UxPopover
      ref="pop"
      role="dialog"
      aria-label="气泡"
      :trigger="trigger"
      :dismiss-on-outside="dismissOnOutside"
      :disabled="disabled"
      :match-trigger-width="matchTriggerWidth"
    >
      <button id="anchor" type="button">打开</button>
      <template #content><span id="body">内容</span></template>
    </UxPopover>
  `,
})

let wrapper: VueWrapper | null = null

function pop(): HTMLElement | null {
  return document.querySelector('.ux-pop')
}

function api() {
  return (wrapper!.vm as unknown as { $refs: { pop: { open(): void; close(): void; toggle(): void } } })
    .$refs.pop
}

async function clickAnchor(): Promise<void> {
  await wrapper!.find('#anchor').trigger('click')
  await nextTick()
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('UxPopover', () => {
  it('点击锚点开合；Teleport 到 body + role/aria-label', async () => {
    wrapper = mount(Host, { attachTo: document.body })
    expect(pop()).toBeNull()
    await clickAnchor()
    expect(pop()).not.toBeNull()
    expect(pop()!.getAttribute('role')).toBe('dialog')
    expect(pop()!.getAttribute('aria-label')).toBe('气泡')
    expect(pop()!.textContent).toContain('内容')
    // 再次点击关闭
    await clickAnchor()
    expect(pop()).toBeNull()
  })

  it('v-model:open 受控：状态与父组件同步', async () => {
    const Controlled = defineComponent({
      components: { UxPopover },
      setup() {
        const open = ref(false)
        return { open }
      },
      template: `
        <UxPopover v-model:open="open" aria-label="受控">
          <button id="c-anchor" type="button">打开</button>
          <template #content><span id="c-body">内容</span></template>
        </UxPopover>
      `,
    })
    const w = mount(Controlled, { attachTo: document.body })
    expect(document.querySelector('.ux-pop')).toBeNull()
    await w.find('#c-anchor').trigger('click')
    await nextTick()
    expect((w.vm as unknown as { open: boolean }).open).toBe(true)
    expect(document.querySelector('.ux-pop')).not.toBeNull()
    await w.find('#c-anchor').trigger('click')
    await nextTick()
    expect((w.vm as unknown as { open: boolean }).open).toBe(false)
    expect(document.querySelector('.ux-pop')).toBeNull()
    w.unmount()
  })

  it('暴露 open/close/toggle API', async () => {
    wrapper = mount(Host, { attachTo: document.body })
    api().open()
    await nextTick()
    expect(pop()).not.toBeNull()
    api().toggle()
    await nextTick()
    expect(pop()).toBeNull()
    api().open()
    await nextTick()
    api().close()
    await nextTick()
    expect(pop()).toBeNull()
  })

  it('点击浮层外部关闭；点击浮层内部保持打开', async () => {
    wrapper = mount(Host, { attachTo: document.body })
    await clickAnchor()
    expect(pop()).not.toBeNull()
    document.querySelector('#body')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(pop()).not.toBeNull()
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(pop()).toBeNull()
  })

  it('dismissOnOutside=false 时点击外部不关闭', async () => {
    wrapper = mount(Host, { attachTo: document.body, props: { dismissOnOutside: false } })
    await clickAnchor()
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(pop()).not.toBeNull()
  })

  it('Esc 关闭', async () => {
    wrapper = mount(Host, { attachTo: document.body })
    await clickAnchor()
    expect(pop()).not.toBeNull()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await nextTick()
    expect(pop()).toBeNull()
  })

  it('trigger=manual 时点击锚点不自动开合，仅 API 控制', async () => {
    wrapper = mount(Host, { attachTo: document.body, props: { trigger: 'manual' } })
    await clickAnchor()
    expect(pop()).toBeNull()
    api().open()
    await nextTick()
    expect(pop()).not.toBeNull()
  })

  it('disabled 时点击与 API 均不开', async () => {
    wrapper = mount(Host, { attachTo: document.body, props: { disabled: true } })
    await clickAnchor()
    expect(pop()).toBeNull()
    api().open()
    await nextTick()
    expect(pop()).toBeNull()
  })

  it('打开后定位写入 left/top（useOverflowPosition）', async () => {
    wrapper = mount(Host, { attachTo: document.body })
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })
    await clickAnchor()
    await nextTick()
    const p = pop()!
    expect(p.style.left).toMatch(/px$/)
    expect(p.style.top).toMatch(/px$/)
    raf.mockRestore()
  })
})
