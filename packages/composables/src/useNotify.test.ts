import { afterEach, describe, expect, it, vi } from 'vitest'
import { useNotify } from './useNotify'

describe('useNotify · notify', () => {
  it('字符串捷径入队：type 默认 info，记录含 id/message', () => {
    const api = useNotify()
    const id = api.notify('已保存')
    expect(api.toasts.value).toHaveLength(1)
    expect(api.toasts.value[0]).toMatchObject({ id, type: 'info', message: '已保存' })
  })

  it('对象入队：保留 type / action / onClick', () => {
    const api = useNotify()
    const onClick = vi.fn()
    const run = vi.fn()
    api.notify({ type: 'danger', message: '保存失败', action: { label: '重试', run }, onClick })
    const record = api.toasts.value[0]
    expect(record.type).toBe('danger')
    expect(record.message).toBe('保存失败')
    expect(record.action).toEqual({ label: '重试', run })
    expect(record.onClick).toBe(onClick)
  })

  it('duration 缺省 4000：3999ms 仍在，+1ms 自动移除', () => {
    vi.useFakeTimers()
    try {
      const api = useNotify()
      const id = api.notify('稍候')
      vi.advanceTimersByTime(3999)
      expect(api.toasts.value).toHaveLength(1)
      vi.advanceTimersByTime(1)
      expect(api.toasts.value).toHaveLength(0)
      expect(id).toBeGreaterThan(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('duration <=0 常驻：60s 后仍在', () => {
    vi.useFakeTimers()
    try {
      const api = useNotify()
      api.notify({ message: '常驻', duration: 0 })
      vi.advanceTimersByTime(60000)
      expect(api.toasts.value).toHaveLength(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('dismiss 按 id 移除；未知 id 为 no-op', () => {
    const api = useNotify()
    const a = api.notify('A')
    const b = api.notify({ message: 'B', duration: 0 })
    api.dismiss(a)
    expect(api.toasts.value.map((t) => t.id)).toEqual([b])
    expect(() => api.dismiss(9999)).not.toThrow()
    expect(api.toasts.value).toHaveLength(1)
  })
})

describe('useNotify · notifyOnce', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('5 秒窗口内同 key 去重：第二次返回 null 且不入队', () => {
    const api = useNotify()
    vi.useFakeTimers()
    // 避开 onceMap 默认值 0：从 10s 起步（否则首次调用即被误判去重）
    vi.setSystemTime(10000)
    expect(api.notifyOnce('save-fail', { message: '第一次', duration: 0 })).not.toBeNull()
    vi.advanceTimersByTime(4999)
    expect(api.notifyOnce('save-fail', { message: '第二次', duration: 0 })).toBeNull()
    expect(api.toasts.value).toHaveLength(1)
    expect(api.toasts.value[0].message).toBe('第一次')
  })

  it('窗口过后放行；不同 key 互不影响', () => {
    const api = useNotify()
    vi.useFakeTimers()
    vi.setSystemTime(10000)
    api.notifyOnce('k1', { message: 'a', duration: 0 })
    vi.advanceTimersByTime(5000)
    expect(api.notifyOnce('k1', { message: 'b', duration: 0 })).not.toBeNull()
    expect(api.notifyOnce('k2', { message: 'c', duration: 0 })).not.toBeNull()
    expect(api.toasts.value).toHaveLength(3)
  })

  it('自定义窗口 windowMs 生效', () => {
    const api = useNotify()
    vi.useFakeTimers()
    vi.setSystemTime(10000)
    api.notifyOnce('k', 'a', 1000)
    vi.advanceTimersByTime(1000)
    expect(api.notifyOnce('k', 'b', 1000)).not.toBeNull()
  })
})

describe('useNotify · 实例隔离', () => {
  it('两次 useNotify() 队列互相独立（多窗口形态）', () => {
    const a = useNotify()
    const b = useNotify()
    a.notify('仅 A')
    expect(a.toasts.value).toHaveLength(1)
    expect(b.toasts.value).toHaveLength(0)
    a.dismiss(a.toasts.value[0].id)
    expect(a.toasts.value).toHaveLength(0)
  })
})
