import { afterEach, describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import UxDialog from './UxDialog.vue'

const Host = defineComponent({
  components: { UxDialog },
  props: { closeOnScrim: { type: Boolean, default: true }, showClose: { type: Boolean, default: true } },
  setup() {
    const open = ref(false)
    return { open }
  },
  template: `
    <button id="trigger" type="button" @click="open = true">打开</button>
    <UxDialog v-model:open="open" title="测试对话框" :close-on-scrim="closeOnScrim" :show-close="showClose">
      <button id="first" type="button">一</button>
      <button id="second" type="button">二</button>
      <template #footer><button id="last" type="button">三</button></template>
    </UxDialog>
  `,
})

function dialog(): HTMLElement | null {
  return document.querySelector('.ux-dialog')
}

function scrim(): HTMLElement | null {
  return document.querySelector('.ux-dialog__scrim')
}

function press(key: string, init: KeyboardEventInit = {}): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
}

let wrapper: ReturnType<typeof mount> | null = null

function openDialog(props: Record<string, boolean> = {}): ReturnType<typeof mount> {
  const w = mount(Host, { attachTo: document.body, props })
  ;(w.find('#trigger').element as HTMLElement).focus()
  w.find('#trigger').trigger('click')
  return w
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('UxDialog 渲染与 a11y', () => {
  it('关闭时不渲染，打开后 role=dialog + aria-modal + aria-label', async () => {
    wrapper = mount(Host, { attachTo: document.body })
    expect(dialog()).toBeNull()
    wrapper.find('#trigger').trigger('click')
    await nextTick()
    await nextTick()
    const el = dialog()
    expect(el).not.toBeNull()
    expect(el!.getAttribute('role')).toBe('dialog')
    expect(el!.getAttribute('aria-modal')).toBe('true')
    expect(el!.getAttribute('aria-label')).toBe('测试对话框')
  })

  it('showClose=false 时无关闭按钮，footer 插槽渲染', async () => {
    wrapper = openDialog({ showClose: false })
    await nextTick()
    await nextTick()
    expect(document.querySelector('.ux-dialog__close, [aria-label="关闭"]')).toBeNull()
    expect(document.getElementById('last')).not.toBeNull()
  })
})

describe('UxDialog 焦点陷阱', () => {
  it('打开后焦点进入容器内首个可聚焦元素', async () => {
    wrapper = openDialog()
    await nextTick()
    await nextTick()
    const closeBtn = document.querySelector('[aria-label="关闭"]')
    expect(document.activeElement).toBe(closeBtn)
  })

  it('Tab 循环约束在容器内（首元素回绕 / 末元素回绕 / 容器外拉回）', async () => {
    wrapper = openDialog()
    await nextTick()
    await nextTick()
    const closeBtn = document.querySelector('[aria-label="关闭"]')
    expect(document.activeElement).toBe(closeBtn)
    press('Tab', { shiftKey: true })
    expect(document.activeElement).toBe(document.getElementById('last'))
    press('Tab')
    expect(document.activeElement).toBe(closeBtn)
    ;(document.getElementById('trigger') as HTMLElement).focus()
    press('Tab', { shiftKey: true })
    expect(document.activeElement).toBe(document.getElementById('last'))
    press('Tab')
    expect(document.activeElement).toBe(closeBtn)
  })

  it('Esc 关闭对话框（update:open=false）', async () => {
    wrapper = openDialog()
    await nextTick()
    await nextTick()
    expect(dialog()).not.toBeNull()
    press('Escape')
    await nextTick()
    await nextTick()
    expect(dialog()).toBeNull()
  })

  it('关闭后焦点归还到打开前的触发元素', async () => {
    wrapper = openDialog()
    await nextTick()
    await nextTick()
    press('Escape')
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(wrapper.find('#trigger').element)
  })
})

describe('UxDialog 遮罩关闭', () => {
  it('closeOnScrim=true：点击遮罩自身关闭，点击内容区不关', async () => {
    wrapper = openDialog()
    await nextTick()
    await nextTick()
    ;(document.querySelector('.ux-dialog') as HTMLElement).dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    )
    await nextTick()
    expect(dialog()).not.toBeNull()
    scrim()!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()
    await nextTick()
    expect(dialog()).toBeNull()
  })

  it('closeOnScrim=false：点击遮罩不关闭', async () => {
    wrapper = openDialog({ closeOnScrim: false })
    await nextTick()
    await nextTick()
    scrim()!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()
    expect(dialog()).not.toBeNull()
  })
})
