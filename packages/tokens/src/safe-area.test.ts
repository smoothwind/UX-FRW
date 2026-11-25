import { afterEach, describe, expect, it } from 'vitest'
import { applySafeAreaInsets, getSafeAreaOverrides, resetSafeAreaInsets } from './safe-area'

afterEach(() => {
  resetSafeAreaInsets()
})

describe('applySafeAreaInsets', () => {
  it('逐边覆写 --ux-safe-*，负值钳为 0', () => {
    applySafeAreaInsets({ top: 47, bottom: 34, left: -5 })
    expect(getSafeAreaOverrides()).toEqual({ top: '47px', bottom: '34px', left: '0px' })
  })

  it('非有限值跳过，不产生半截覆写', () => {
    applySafeAreaInsets({ top: Number.NaN, right: 0 })
    expect(getSafeAreaOverrides()).toEqual({ right: '0px' })
  })

  it('同边重复调用取最后一次', () => {
    applySafeAreaInsets({ top: 10 })
    applySafeAreaInsets({ top: 20 })
    expect(getSafeAreaOverrides()).toEqual({ top: '20px' })
  })
})

describe('resetSafeAreaInsets', () => {
  it('摘除全部覆写回落 env()', () => {
    applySafeAreaInsets({ top: 47, right: 1, bottom: 2, left: 3 })
    resetSafeAreaInsets()
    expect(getSafeAreaOverrides()).toEqual({})
  })
})
