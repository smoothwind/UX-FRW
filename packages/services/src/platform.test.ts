import { describe, expect, it, vi } from 'vitest'
import {
  createWebWindowPlacement,
  getPlatformAdapter,
  setPlatformAdapter,
  type PlatformAdapter,
  type WindowPlacement,
} from './platform'

describe('createWebWindowPlacement', () => {
  it('placeToCursorDisplay / resyncBounds 为 no-op 且兑现', async () => {
    const placement = createWebWindowPlacement()
    await expect(placement.placeToCursorDisplay()).resolves.toBeUndefined()
    await expect(placement.placeToCursorDisplay({ width: 800 })).resolves.toBeUndefined()
    await expect(placement.resyncBounds()).resolves.toBeUndefined()
  })

  it('缺省不实现 onDisplayMetricsChanged（宿主可选能力）', () => {
    const placement: WindowPlacement = createWebWindowPlacement()
    expect(placement.onDisplayMetricsChanged).toBeUndefined()
  })
})

describe('PlatformAdapter.windowPlacement', () => {
  it('可选字段注入后可读取，置 null 清除', () => {
    const placement = createWebWindowPlacement()
    const adapter: PlatformAdapter = { name: 'electron', windowPlacement: placement }
    setPlatformAdapter(adapter)
    expect(getPlatformAdapter()?.windowPlacement).toBe(placement)

    setPlatformAdapter(null)
    expect(getPlatformAdapter()).toBeNull()
  })

  it('桌形适配器示例：placeToCursorDisplay 按契约调用', async () => {
    const placeToCursorDisplay = vi.fn().mockResolvedValue(undefined)
    const resyncBounds = vi.fn().mockResolvedValue(undefined)
    const adapter: PlatformAdapter = {
      name: 'tauri',
      windowPlacement: { placeToCursorDisplay, resyncBounds },
    }
    setPlatformAdapter(adapter)
    await adapter.windowPlacement!.placeToCursorDisplay({ width: 1000, workAreaRatio: 0.9 })
    await adapter.windowPlacement!.resyncBounds()
    expect(placeToCursorDisplay).toHaveBeenCalledWith({ width: 1000, workAreaRatio: 0.9 })
    expect(resyncBounds).toHaveBeenCalledTimes(1)
  })
})
