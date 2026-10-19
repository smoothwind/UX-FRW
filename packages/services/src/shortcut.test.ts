import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerCommand, type Command } from './command'
import {
  createShortcutController,
  eventToShortcut,
  findShortcutIssues,
  normalizeShortcut,
  RESERVED_SHORTCUTS,
  type ShortcutController,
  type ShortcutIssue,
} from './shortcut'

const disposers: Array<() => void> = []
const uninstallers: Array<() => void> = []

function cmd(over: Partial<Command> & { id: string }): Command {
  return { title: over.id, run: vi.fn(), ...over }
}

function register(command: Command): Command {
  const dispose = registerCommand(command)
  disposers.push(dispose)
  return command
}

function installed(controller: ShortcutController): void {
  uninstallers.push(controller.install())
}

function keydown(init: KeyboardEventInit, target: EventTarget = document): KeyboardEvent {
  const ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(ev)
  return ev
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  while (disposers.length) disposers.pop()!()
  while (uninstallers.length) uninstallers.pop()!()
})

describe('normalizeShortcut', () => {
  it('修饰键固定顺序 + 主键大写', () => {
    expect(normalizeShortcut('shift+ctrl+t')).toBe('Ctrl+Shift+T')
    expect(normalizeShortcut('alt+meta+k')).toBe('Alt+Meta+K')
    expect(normalizeShortcut('k')).toBe('K')
  })

  it('别名归一化：control/option/cmd/win/del/esc 等', () => {
    expect(normalizeShortcut('control+p')).toBe('Ctrl+P')
    expect(normalizeShortcut('option+left')).toBe('Alt+ArrowLeft')
    expect(normalizeShortcut('cmd+comma')).toBe('Meta+,')
    expect(normalizeShortcut('win+period')).toBe('Meta+.')
    expect(normalizeShortcut('esc')).toBe('Escape')
    expect(normalizeShortcut('del')).toBe('Delete')
    expect(normalizeShortcut('pageup')).toBe('PageUp')
    expect(normalizeShortcut('ctrl+space')).toBe('Ctrl+Space')
    expect(normalizeShortcut('ctrl+slash')).toBe('Ctrl+/')
  })
})

describe('eventToShortcut', () => {
  it('从事件还原规范键序', () => {
    expect(
      eventToShortcut(new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'p' })),
    ).toBe('Ctrl+Shift+P')
    expect(eventToShortcut(new KeyboardEvent('keydown', { key: ' ' }))).toBe('Space')
    expect(eventToShortcut(new KeyboardEvent('keydown', { key: 'a' }))).toBe('A')
  })

  it('仅按修饰键返回 null（含 Control 本名）', () => {
    expect(eventToShortcut(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true }))).toBeNull()
    expect(eventToShortcut(new KeyboardEvent('keydown', { key: 'Shift', shiftKey: true }))).toBeNull()
    expect(eventToShortcut(new KeyboardEvent('keydown', { key: 'Alt', altKey: true }))).toBeNull()
    expect(eventToShortcut(new KeyboardEvent('keydown', { key: 'Meta', metaKey: true }))).toBeNull()
  })
})

describe('findShortcutIssues', () => {
  it('同键序多命令 → duplicate', () => {
    const issues = findShortcutIssues(
      [cmd({ id: 'a', shortcut: 'Ctrl+K' }), cmd({ id: 'b', shortcut: 'ctrl+k' })],
    )
    const dup = issues.find((i) => i.type === 'duplicate')
    expect(dup?.combo).toBe('Ctrl+K')
    expect(dup?.ids.sort()).toEqual(['a', 'b'])
  })

  it('保留键位 → reserved', () => {
    for (const reserved of RESERVED_SHORTCUTS) {
      const issues: ShortcutIssue[] = findShortcutIssues([cmd({ id: 'x', shortcut: reserved })])
      expect(issues.some((i) => i.type === 'reserved' && i.combo === reserved)).toBe(true)
    }
  })

  it('干净键序无告警', () => {
    const issues = findShortcutIssues([cmd({ id: 'a', shortcut: 'Ctrl+K' })])
    expect(issues).toHaveLength(0)
  })
})

describe('createShortcutController', () => {
  it('install 幂等，卸载后停止匹配', async () => {
    const controller = createShortcutController()
    const run = vi.fn()
    register(cmd({ id: 's.a', shortcut: 'Ctrl+J', run }))
    const dispose = controller.install()
    expect(controller.install()).toBe(dispose)
    uninstallers.push(dispose)
    keydown({ ctrlKey: true, key: 'j' })
    await flush()
    expect(run).toHaveBeenCalledTimes(1)
    dispose()
    uninstallers.pop()
    keydown({ ctrlKey: true, key: 'j' })
    await flush()
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('匹配执行并 preventDefault', async () => {
    const controller = createShortcutController()
    installed(controller)
    const run = vi.fn()
    register(cmd({ id: 's.b', shortcut: 'Ctrl+Alt+K', run }))
    const ev = keydown({ ctrlKey: true, altKey: true, key: 'k' })
    await flush()
    expect(run).toHaveBeenCalledTimes(1)
    expect(ev.defaultPrevented).toBe(true)
  })

  it('输入框聚焦时默认不触发且不拦截', async () => {
    const controller = createShortcutController()
    installed(controller)
    const run = vi.fn()
    register(cmd({ id: 's.c', shortcut: 'Ctrl+K', run }))
    const input = document.createElement('input')
    document.body.appendChild(input)
    const ev = keydown({ ctrlKey: true, key: 'k' }, input)
    await flush()
    expect(run).not.toHaveBeenCalled()
    expect(ev.defaultPrevented).toBe(false)
    input.remove()
  })

  it('allowInInput 命令在输入框内放行', async () => {
    const controller = createShortcutController()
    installed(controller)
    const run = vi.fn()
    register(cmd({ id: 's.d', shortcut: 'Ctrl+K', run, allowInInput: true }))
    const input = document.createElement('input')
    document.body.appendChild(input)
    const ev = keydown({ ctrlKey: true, key: 'k' }, input)
    await flush()
    expect(run).toHaveBeenCalledTimes(1)
    expect(ev.defaultPrevented).toBe(true)
    input.remove()
  })

  it('冲突键序整体挂起，命令面板等入口仍可运行', async () => {
    const controller = createShortcutController()
    installed(controller)
    const runA = vi.fn()
    const runB = vi.fn()
    register(cmd({ id: 's.e1', shortcut: 'Ctrl+K', run: runA }))
    register(cmd({ id: 's.e2', shortcut: 'Ctrl+K', run: runB }))
    keydown({ ctrlKey: true, key: 'k' })
    await flush()
    expect(runA).not.toHaveBeenCalled()
    expect(runB).not.toHaveBeenCalled()
  })

  it('冲突一方被 override 后另一方恢复触发', async () => {
    const controller = createShortcutController()
    installed(controller)
    const runA = vi.fn()
    const runB = vi.fn()
    register(cmd({ id: 's.f1', shortcut: 'Ctrl+K', run: runA }))
    register(cmd({ id: 's.f2', shortcut: 'Ctrl+K', run: runB }))
    controller.setOverride('s.f2', 'Ctrl+Shift+K')
    keydown({ ctrlKey: true, key: 'k' })
    await flush()
    expect(runA).toHaveBeenCalledTimes(1)
    keydown({ ctrlKey: true, shiftKey: true, key: 'k' })
    await flush()
    expect(runB).toHaveBeenCalledTimes(1)
  })

  it('setOverride(null) 恢复默认键序', () => {
    const controller = createShortcutController()
    const run = vi.fn()
    register(cmd({ id: 's.g', shortcut: 'Ctrl+K', run }))
    controller.setOverride('s.g', 'Ctrl+Shift+K')
    expect(controller.getOverride('s.g')).toBe('Ctrl+Shift+K')
    expect(controller.getEffectiveShortcut('s.g')).toBe('Ctrl+Shift+K')
    controller.setOverride('s.g', null)
    expect(controller.getOverride('s.g')).toBeUndefined()
    expect(controller.getEffectiveShortcut('s.g')).toBe('Ctrl+K')
  })

  it('getIssues 反映 override 后的有效键序', () => {
    const controller = createShortcutController()
    register(cmd({ id: 's.h1', shortcut: 'Ctrl+K' }))
    register(cmd({ id: 's.h2', shortcut: 'Ctrl+L' }))
    expect(controller.getIssues()).toHaveLength(0)
    controller.setOverride('s.h2', 'Ctrl+K')
    expect(controller.getIssues().some((i) => i.type === 'duplicate')).toBe(true)
  })

  it('setSuspended 暂停全局匹配（改键录制期间）', async () => {
    const controller = createShortcutController()
    installed(controller)
    const run = vi.fn()
    register(cmd({ id: 's.i', shortcut: 'Ctrl+K', run }))
    controller.setSuspended(true)
    keydown({ ctrlKey: true, key: 'k' })
    await flush()
    expect(run).not.toHaveBeenCalled()
    controller.setSuspended(false)
    keydown({ ctrlKey: true, key: 'k' })
    await flush()
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('overrides 为响应式快照', () => {
    const controller = createShortcutController()
    controller.setOverride('s.j', 'ctrl+shift+k')
    expect(controller.overrides.value).toEqual({ 's.j': 'Ctrl+Shift+K' })
  })
})
