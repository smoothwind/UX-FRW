import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createShortcutController } from '@ux/services'
import { registerCommand, type Command } from '@ux/services'
import CommandPalette from './CommandPalette.vue'

const disposers: Array<() => void> = []
const uninstallers: Array<() => void> = []

function register(command: Command): void {
  disposers.push(registerCommand(command))
}

function installController(): void {
  const controller = createShortcutController()
  uninstallers.push(controller.install())
}

/** defineExpose 的 open() 在 vm 类型上不可见，统一断言入口 */
function openPalette(w: VueWrapper): void {
  ;(w.vm as unknown as { open(): void }).open()
}

let wrapper: VueWrapper | null = null

function mountPalette() {
  wrapper = mount(CommandPalette, { attachTo: document.body })
  return wrapper
}

function paletteEl(): HTMLElement | null {
  return document.querySelector('.ux-cmdk')
}

function options(): HTMLElement[] {
  return [...(document.querySelectorAll('[role="option"]') as NodeListOf<HTMLElement>)]
}

function activeText(): string {
  return document.querySelector('.ux-cmdk__item.is-active')?.textContent ?? ''
}

function type(query: string): void {
  const input = document.querySelector('.ux-cmdk__input') as HTMLInputElement
  input.value = query
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

async function pressInInput(key: string): Promise<void> {
  const input = document.querySelector('.ux-cmdk__input') as HTMLInputElement
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await nextTick()
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  while (disposers.length) disposers.pop()!()
  while (uninstallers.length) uninstallers.pop()!()
  document.body.innerHTML = ''
})

describe('CommandPalette', () => {
  it('Ctrl+K 全局热键打开（命令注册表 + ShortcutController 联动）', async () => {
    installController()
    mountPalette()
    expect(paletteEl()).toBeNull()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }))
    await nextTick()
    await nextTick()
    expect(paletteEl()).not.toBeNull()
    // combobox aria
    const input = document.querySelector('[role="combobox"]') as HTMLElement
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(input.getAttribute('aria-controls')).toBe('ux-cmdk-list')
  })

  it('注册表实时联动：打开后列出可用命令（排除自身热键项）', async () => {
    register({ id: 'file.save', title: '保存文件', shortcut: 'Ctrl+S', category: '文件', run: vi.fn() })
    register({ id: 'conn.drop', title: '断开连接', danger: true, run: vi.fn() })
    mountPalette()
    openPalette(wrapper!)
    await nextTick()
    await nextTick()
    const labels = options().map((o) => o.textContent ?? '')
    expect(labels).toHaveLength(2)
    expect(labels[0]).toContain('保存文件')
    expect(labels[0]).toContain('文件')
    expect(options()[1].className).toContain('ux-cmdk__item--danger')
  })

  it('when 能力过滤：不可用命令不出现', async () => {
    register({ id: 'a.on', title: '可用命令', run: vi.fn() })
    register({ id: 'a.off', title: '隐藏命令', when: () => false, run: vi.fn() })
    mountPalette()
    openPalette(wrapper!)
    await nextTick()
    await nextTick()
    expect(options()).toHaveLength(1)
    expect(options()[0].textContent).toContain('可用命令')
  })

  it('过滤：label/id/category 子串匹配 + 输入重置高亮', async () => {
    register({ id: 'file.save', title: '保存文件', category: '文件', run: vi.fn() })
    register({ id: 'conn.reconnect', title: '重连', category: '连接', run: vi.fn() })
    mountPalette()
    openPalette(wrapper!)
    await nextTick()
    type('conn')
    await nextTick()
    expect(options()).toHaveLength(1)
    expect(options()[0].textContent).toContain('重连')
    type('zzz')
    await nextTick()
    expect(document.querySelector('.ux-cmdk__empty')?.textContent).toContain('无匹配命令')
  })

  it('↑↓ 循环高亮 + Enter 执行并关闭', async () => {
    const runB = vi.fn()
    register({ id: 'a', title: '命令A', run: vi.fn() })
    register({ id: 'b', title: '命令B', run: runB })
    mountPalette()
    openPalette(wrapper!)
    await nextTick()
    await nextTick()
    expect(activeText()).toContain('命令A')
    await pressInInput('ArrowDown')
    expect(document.querySelector('[role="combobox"]')!.getAttribute('aria-activedescendant')).toBe('ux-cmdk-opt-1')
    expect(activeText()).toContain('命令B')
    await pressInInput('ArrowDown')
    expect(activeText()).toContain('命令A')
    await pressInInput('ArrowUp')
    expect(activeText()).toContain('命令B')
    await pressInInput('Enter')
    await nextTick()
    expect(runB).toHaveBeenCalledTimes(1)
    expect(paletteEl()).toBeNull()
  })

  it('Esc 关闭（focus trap 回调）', async () => {
    mountPalette()
    openPalette(wrapper!)
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await nextTick()
    expect(paletteEl()).toBeNull()
  })

  it('打开后输入框自动聚焦；点击遮罩关闭', async () => {
    mountPalette()
    openPalette(wrapper!)
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(document.querySelector('.ux-cmdk__input'))
    ;(document.querySelector('.ux-cmdk__scrim') as HTMLElement).dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    )
    await nextTick()
    expect(paletteEl()).toBeNull()
  })
})
