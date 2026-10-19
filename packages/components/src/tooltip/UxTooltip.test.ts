import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxTooltip from './UxTooltip.vue'
const Host = defineComponent({
  components: { UxTooltip },
  props: { content: { type: String, default: '提示文本' }, disabled: { type: Boolean, default: false } },
  template: `
    <UxTooltip :content="content" :disabled="disabled" :delay="120" placement="top">
      <button id="trigger" type="button">悬停我</button>
    </UxTooltip>
  `,
})

let wrapper: VueWrapper | null = null

function tip(): HTMLElement | null {
  return document.querySelector('[role="tooltip"]')
}

async function setHover(state: 'enter' | 'leave') {
  // mouseenter/mouseleave 不冒泡，须直接在绑定元素（.ux-tip-trigger）上触发
  const trigger = wrapper!.find('.ux-tip-trigger')
  await trigger.trigger(state === 'enter' ? 'mouseenter' : 'mouseleave')
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('UxTooltip', () => {
  it('hover 满 delay 后显示：Teleport 到 body + role=tooltip + aria-describedby', async () => {
    wrapper = mount(Host, { attachTo: document.body })
    await setHover('enter')
    vi.advanceTimersByTime(119)
    expect(tip()).toBeNull()
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(tip()).not.toBeNull()
    expect(tip()!.getAttribute('role')).toBe('tooltip')
    expect(tip()!.textContent).toBe('提示文本')
    expect(wrapper.find('.ux-tip-trigger').attributes('aria-describedby')).toBe(tip()!.id)
  })

  it('快速掠过（delay 内 leave）不闪烁', async () => {
    wrapper = mount(Host, { attachTo: document.body })
    await setHover('enter')
    await setHover('leave')
    vi.advanceTimersByTime(500)
    expect(tip()).toBeNull()
  })

  it('focusin 立即显示（无延迟），focusout 关闭', async () => {
    wrapper = mount(Host, { attachTo: document.body })
    await wrapper.find('#trigger').trigger('focusin')
    expect(tip()).not.toBeNull()
    await wrapper.find('#trigger').trigger('focusout')
    expect(tip()).toBeNull()
  })

  it('Esc 关闭', async () => {
    wrapper = mount(Host, { attachTo: document.body })
    await setHover('enter')
    vi.advanceTimersByTime(120)
    await nextTick()
    expect(tip()).not.toBeNull()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(tip()).toBeNull()
  })

  it('disabled 或无 content 不显示', async () => {
    wrapper = mount(Host, { attachTo: document.body, props: { disabled: true } })
    await setHover('enter')
    vi.advanceTimersByTime(500)
    expect(tip()).toBeNull()

    await wrapper.unmount()
    wrapper = mount(Host, { attachTo: document.body, props: { content: '' } })
    await wrapper.find('#trigger').trigger('focusin')
    expect(tip()).toBeNull()
  })
})
