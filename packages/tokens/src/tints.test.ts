import { afterEach, describe, expect, it } from 'vitest'
import {
  TINT_AA_RATIO,
  checkTintContrast,
  listTints,
  registerTint,
  resetTints,
  tintContrast,
} from './tints'

afterEach(() => {
  resetTints()
  document.head.innerHTML = ''
})

describe('tintContrast（WCAG 对比度）', () => {
  it('黑白对比度 21', () => {
    expect(tintContrast('#000000', '#ffffff')).toBe(21)
  })

  it('相同色对比度 1', () => {
    expect(tintContrast('#1a1a2e', '#1a1a2e')).toBe(1)
  })

  it('短 hex 与长 hex 等价', () => {
    expect(tintContrast('#fff', '#000')).toBe(21)
  })

  it('非法颜色抛错', () => {
    expect(() => tintContrast('red', '#fff')).toThrow(/仅支持 #rgb/)
  })

  it('阈值常量为 4.5', () => {
    expect(TINT_AA_RATIO).toBe(4.5)
  })
})

describe('checkTintContrast', () => {
  it('达标 tint：三对全过（黄便签）', () => {
    const report = checkTintContrast({
      surface: '#fff3c4',
      deep: '#f6e58d',
      fg: '#4a3b00',
      opaque: '#ffd32a',
    })
    expect(report.ok).toBe(true)
    expect(report.checks).toHaveLength(3)
    for (const c of report.checks) expect(c.pass).toBe(true)
  })

  it('不达标 tint：报告全量返回不短路', () => {
    // fg 与 surface 对比度不足
    const report = checkTintContrast({
      surface: '#fff3c4',
      deep: '#f6e58d',
      fg: '#dab600',
      opaque: '#ffd32a',
    })
    expect(report.ok).toBe(false)
    expect(report.checks.filter((c) => !c.pass).length).toBeGreaterThan(0)
    expect(report.checks).toHaveLength(3)
  })
})

describe('registerTint', () => {
  it('注册注入四个 CSS 变量并登记名称', () => {
    registerTint('amber', {
      surface: '#fff3c4',
      deep: '#f6e58d',
      fg: '#4a3b00',
      opaque: '#ffd32a',
    })
    const style = document.querySelector('style[data-ux-tints]')!
    expect(style.textContent).toContain('--ux-tint-amber-surface: #fff3c4')
    expect(style.textContent).toContain('--ux-tint-amber-deep: #f6e58d')
    expect(style.textContent).toContain('--ux-tint-amber-fg: #4a3b00')
    expect(style.textContent).toContain('--ux-tint-amber-opaque: #ffd32a')
    expect(listTints()).toEqual(['amber'])
  })

  it('dark 套注册：.dark 块覆盖同名变量', () => {
    registerTint(
      'mint',
      { surface: '#e8fbf1', deep: '#c9f2dd', fg: '#0b3d22', opaque: '#7bed9f' },
      { surface: '#1d3a2f', deep: '#162e25', fg: '#d9fbeb', opaque: '#2e5947' },
    )
    const style = document.querySelector('style[data-ux-tints]')!
    expect(style.textContent).toContain(':root {')
    expect(style.textContent).toContain('.dark {')
    expect(style.textContent).toContain('--ux-tint-mint-fg: #d9fbeb')
  })

  it('light 未达 AA 抛错，错误信息含对比对数值', () => {
    expect(() =>
      registerTint('bad', {
        surface: '#fff3c4',
        deep: '#f6e58d',
        fg: '#dab600',
        opaque: '#ffd32a',
      }),
    ).toThrow(/tint "bad"（light）未达 AA/)
    expect(listTints()).toEqual([])
  })

  it('dark 未达 AA 抛错', () => {
    expect(() =>
      registerTint(
        'bad-dark',
        { surface: '#fff3c4', deep: '#f6e58d', fg: '#4a3b00', opaque: '#ffd32a' },
        { surface: '#1d3a2f', deep: '#162e25', fg: '#3f6b52', opaque: '#2e5947' },
      ),
    ).toThrow(/tint "bad-dark"（dark）未达 AA/)
  })

  it('validate: false 跳过校验（明确承担可读性责任时）', () => {
    expect(() =>
      registerTint(
        'skipped',
        { surface: '#fff3c4', deep: '#f6e58d', fg: '#dab600', opaque: '#ffd32a' },
        undefined,
        { validate: false },
      ),
    ).not.toThrow()
    expect(listTints()).toEqual(['skipped'])
  })

  it('同名重复注册覆盖', () => {
    const def = { surface: '#fff3c4', deep: '#f6e58d', fg: '#4a3b00', opaque: '#ffd32a' }
    registerTint('x', def)
    registerTint('x', { ...def, surface: '#fff8d6' })
    const style = document.querySelector('style[data-ux-tints]')!
    expect(style.textContent).toContain('--ux-tint-x-surface: #fff8d6')
    expect(listTints()).toEqual(['x'])
  })
})
