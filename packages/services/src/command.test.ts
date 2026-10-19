import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref, watchEffect } from 'vue'
import {
  commandVersion,
  getAllCommands,
  getAvailableCommands,
  getCommand,
  registerCommand,
  runCommand,
  unregisterCommand,
  type Command,
} from './command'

const disposers: Array<() => void> = []

function cmd(over: Partial<Command> & { id: string }): Command {
  return { title: over.id, run: vi.fn(), ...over }
}

function register(command: Command): Command {
  const dispose = registerCommand(command)
  disposers.push(dispose)
  return command
}

afterEach(() => {
  while (disposers.length) disposers.pop()!()
})

describe('command registry', () => {
  it('注册后可查询，注销后消失', () => {
    register(cmd({ id: 'a.x' }))
    expect(getCommand('a.x')?.id).toBe('a.x')
    expect(getAllCommands().map((c) => c.id)).toContain('a.x')
    unregisterCommand('a.x')
    expect(getCommand('a.x')).toBeUndefined()
  })

  it('重复注册同 id 覆盖旧命令', () => {
    const first = register(cmd({ id: 'a.x', title: 'one' }))
    register(cmd({ id: 'a.x', title: 'two' }))
    expect(getCommand('a.x')?.title).toBe('two')
    expect(getAllCommands().filter((c) => c.id === 'a.x')).toHaveLength(1)
    expect(first.title).toBe('one')
  })

  it('commandVersion 响应式追踪注册变化', async () => {
    let runs = 0
    const stop = watchEffect(() => {
      commandVersion()
      runs++
    })
    const before = commandVersion()
    register(cmd({ id: 'v.x' }))
    await nextTick()
    expect(commandVersion()).toBeGreaterThan(before)
    expect(runs).toBeGreaterThanOrEqual(2)
    stop()
  })

  it('getAvailableCommands 过滤 when 为 false 的命令', () => {
    const flag = ref(true)
    register(cmd({ id: 'on', when: () => flag.value }))
    register(cmd({ id: 'off', when: () => false }))
    const ids = getAvailableCommands().map((c) => c.id)
    expect(ids).toContain('on')
    expect(ids).not.toContain('off')
  })
})

describe('runCommand', () => {
  it('执行存在的命令并返回 true', async () => {
    const run = vi.fn()
    register(cmd({ id: 'run.ok', run }))
    await expect(runCommand('run.ok')).resolves.toBe(true)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('不存在的命令返回 false', async () => {
    await expect(runCommand('nope')).resolves.toBe(false)
  })

  it('when 为 false 时拒绝执行', async () => {
    const run = vi.fn()
    register(cmd({ id: 'run.gated', run, when: () => false }))
    await expect(runCommand('run.gated')).resolves.toBe(false)
    expect(run).not.toHaveBeenCalled()
  })
})
