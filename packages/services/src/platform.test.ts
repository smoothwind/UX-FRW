import { describe, expect, it, vi } from 'vitest'
import {
  createWebWindowPlacement,
  getPlatformAdapter,
  setPlatformAdapter,
  type PlatformAdapter,
  type ToastIdentityOptions,
  type WindowMaterialOptions,
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

describe('PlatformAdapter 扩展位（窗口材质 / 通知身份）', () => {
  it('两个可选方法均为可选：最简适配器合法', () => {
    const adapter: PlatformAdapter = { name: 'web' }
    expect(adapter.applyWindowMaterial).toBeUndefined()
    expect(adapter.registerToastIdentity).toBeUndefined()
  })

  it('注入后按契约透传参数，置 null 清除', async () => {
    const applyWindowMaterial = vi.fn<(options: WindowMaterialOptions) => Promise<void>>()
    applyWindowMaterial.mockResolvedValue(undefined)
    const registerToastIdentity = vi.fn<(options: ToastIdentityOptions) => Promise<void>>()
    registerToastIdentity.mockResolvedValue(undefined)

    setPlatformAdapter({ name: 'tauri', applyWindowMaterial, registerToastIdentity })
    const adapter = getPlatformAdapter()

    await adapter!.applyWindowMaterial!({ effect: 'acrylic', tint: '#1a1a2e', dark: true }) // tokens-exempt 契约透传的宿主 tint 数据
    expect(applyWindowMaterial).toHaveBeenCalledWith({ effect: 'acrylic', tint: '#1a1a2e', dark: true }) // tokens-exempt 同上

    await adapter!.registerToastIdentity!({ id: 'com.example.notes', displayName: 'TigerNote' })
    expect(registerToastIdentity).toHaveBeenCalledWith({ id: 'com.example.notes', displayName: 'TigerNote' })

    setPlatformAdapter(null)
    expect(getPlatformAdapter()).toBeNull()
  })

  it("effect: 'none' 是合法的显式降级档位", async () => {
    const applyWindowMaterial = vi.fn<(options: WindowMaterialOptions) => Promise<void>>()
    applyWindowMaterial.mockResolvedValue(undefined)
    setPlatformAdapter({ name: 'electron', applyWindowMaterial })
    await getPlatformAdapter()!.applyWindowMaterial!({ effect: 'none' })
    expect(applyWindowMaterial).toHaveBeenCalledWith({ effect: 'none' })
    setPlatformAdapter(null)
  })
})
