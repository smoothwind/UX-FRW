import { describe, expect, it } from 'vitest'
import { useActivityLog } from './useActivityLog'

describe('useActivityLog', () => {
  it('push 生成递增 id 并使用注入时间源', () => {
    let clock = 1000
    const log = useActivityLog({ now: () => clock })
    const a = log.push('info', 'first')
    clock = 2000
    const b = log.push('warn', 'second', 'detail')
    expect(a.id).toBe(1)
    expect(a.time).toBe(1000)
    expect(b.id).toBe(2)
    expect(b.time).toBe(2000)
    expect(b.detail).toBe('detail')
    expect(log.entries.value).toHaveLength(2)
  })

  it('环形缓冲超限丢弃最旧条目', () => {
    const log = useActivityLog({ limit: 3 })
    for (let i = 0; i < 5; i++) log.push('info', `e${i}`)
    expect(log.entries.value.map((e) => e.title)).toEqual(['e2', 'e3', 'e4'])
  })

  it('unreadErrors 只累计 error，markOpened 清零，clear 全清', () => {
    const log = useActivityLog()
    log.push('info', 'a')
    log.push('error', 'b')
    log.push('error', 'c')
    expect(log.unreadErrors.value).toBe(2)
    log.markOpened()
    expect(log.unreadErrors.value).toBe(0)
    log.push('error', 'd')
    expect(log.unreadErrors.value).toBe(1)
    log.clear()
    expect(log.entries.value).toHaveLength(0)
    expect(log.unreadErrors.value).toBe(0)
  })

  it('entries 为 shallowRef：push 触发引用变更', () => {
    const log = useActivityLog()
    const before = log.entries.value
    log.push('info', 'x')
    expect(before).toHaveLength(0)
    expect(log.entries.value).not.toBe(before)
    expect(log.entries.value).toHaveLength(1)
  })
})
