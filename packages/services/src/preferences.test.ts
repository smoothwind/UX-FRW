import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPreferences } from './preferences'

interface Prefs extends Record<string, unknown> {
  theme: string
  fontSize: number
  panelOpen: boolean
}

const defaults: Prefs = { theme: 'light', fontSize: 14, panelOpen: false }
const KEY = 'prefs-test'

beforeEach(() => {
  localStorage.clear()
})

describe('createPreferences 加载', () => {
  it('空存储回 defaults', () => {
    const p = createPreferences<Prefs>({ key: KEY, version: 1, defaults })
    expect(p.state.value).toEqual(defaults)
  })

  it('损坏 JSON 回 defaults', () => {
    localStorage.setItem(KEY, '{oops')
    const p = createPreferences<Prefs>({ key: KEY, version: 1, defaults })
    expect(p.state.value).toEqual(defaults)
  })

  it('读取 envelope 并与 defaults 合并（缺省兜底）', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ __version: 1, data: { theme: 'dark' } }),
    )
    const p = createPreferences<Prefs>({ key: KEY, version: 1, defaults })
    expect(p.state.value).toEqual({ theme: 'dark', fontSize: 14, panelOpen: false })
  })

  it('旧版本数据经 migrate 迁移后合并', () => {
    const migrate = vi.fn(() => ({ theme: 'contrast', fontSize: 16 }))
    localStorage.setItem(
      KEY,
      JSON.stringify({ __version: 1, data: { theme: 'legacy' } }),
    )
    const p = createPreferences<Prefs>({ key: KEY, version: 2, defaults, migrate })
    expect(migrate).toHaveBeenCalledWith(1, { theme: 'legacy' })
    expect(p.state.value).toEqual({ theme: 'contrast', fontSize: 16, panelOpen: false })
  })

  it('同版本数据不触发 migrate', () => {
    const migrate = vi.fn()
    localStorage.setItem(
      KEY,
      JSON.stringify({ __version: 2, data: { fontSize: 18 } }),
    )
    createPreferences<Prefs>({ key: KEY, version: 2, defaults, migrate })
    expect(migrate).not.toHaveBeenCalled()
  })

  it('裸数据（无版本号）以版本 0 进入迁移', () => {
    const migrate = vi.fn(() => ({ theme: 'migrated' }))
    localStorage.setItem(KEY, JSON.stringify({ theme: 'old' }))
    const p = createPreferences<Prefs>({ key: KEY, version: 2, defaults, migrate })
    expect(migrate).toHaveBeenCalledWith(0, { theme: 'old' })
    expect(p.state.value.theme).toBe('migrated')
  })
})

describe('createPreferences 变更与持久化', () => {
  it('patch / set / reset', () => {
    const p = createPreferences<Prefs>({ key: KEY, version: 1, defaults })
    p.patch({ theme: 'dark', fontSize: 16 })
    expect(p.state.value).toMatchObject({ theme: 'dark', fontSize: 16 })
    p.set('panelOpen', true)
    expect(p.state.value.panelOpen).toBe(true)
    p.reset()
    expect(p.state.value).toEqual(defaults)
  })

  it('变更经防抖后以 envelope 写入 localStorage', async () => {
    vi.useFakeTimers()
    const p = createPreferences<Prefs>({ key: KEY, version: 3, defaults, debounce: 100 })
    p.set('theme', 'dark')
    vi.advanceTimersByTime(50)
    p.set('fontSize', 20)
    await nextTick()
    vi.advanceTimersByTime(99)
    expect(localStorage.getItem(KEY)).toBeNull()
    vi.advanceTimersByTime(1)
    const raw = JSON.parse(localStorage.getItem(KEY)!) as { __version: number; data: Prefs }
    expect(raw.__version).toBe(3)
    expect(raw.data).toMatchObject({ theme: 'dark', fontSize: 20 })
    vi.useRealTimers()
  })

  it('连续变更只保留最后一次写入', async () => {
    vi.useFakeTimers()
    const setItem = vi.spyOn(localStorage, 'setItem')
    const p = createPreferences<Prefs>({ key: KEY, version: 1, defaults, debounce: 50 })
    p.set('theme', 'a')
    vi.advanceTimersByTime(10)
    p.set('theme', 'b')
    vi.advanceTimersByTime(10)
    p.set('theme', 'c')
    await nextTick()
    vi.advanceTimersByTime(60)
    expect(setItem).toHaveBeenCalledTimes(1)
    expect(p.state.value.theme).toBe('c')
    setItem.mockRestore()
    vi.useRealTimers()
  })
})
