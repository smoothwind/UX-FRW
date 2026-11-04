import { describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { useConfirm } from './useConfirm'

describe('useConfirm · Promise 结算', () => {
  it('字符串捷径打开：current 承载 message，settle(true) 兑现 true 且清场', async () => {
    const { current, confirm, settle } = useConfirm()
    const pending = confirm('删除这条记录？')
    expect(current.value).toEqual({ message: '删除这条记录？' })
    settle(true)
    await expect(pending).resolves.toBe(true)
    expect(current.value).toBeNull()
  })

  it('对象入参：可选字段原样承载', async () => {
    const { current, confirm, settle } = useConfirm()
    const pending = confirm({
      title: '清空回收站',
      message: '将删除 12 个文件，不可恢复。',
      confirmText: '清空',
      cancelText: '再想想',
      danger: true,
    })
    expect(current.value).toMatchObject({
      title: '清空回收站',
      confirmText: '清空',
      cancelText: '再想想',
      danger: true,
    })
    settle(false)
    await expect(pending).resolves.toBe(false)
  })

  it('settle(false) 兑现 false；未打开时 settle 为 no-op', async () => {
    const { current, confirm, settle } = useConfirm()
    const pending = confirm({ message: 'm' })
    settle(false)
    await expect(pending).resolves.toBe(false)
    expect(() => settle(true)).not.toThrow()
    expect(current.value).toBeNull()
  })
})

describe('useConfirm · Esc = 取消（规则 8）', () => {
  it('open 时 Esc 兑现 false 并清场', async () => {
    const { current, confirm } = useConfirm()
    const pending = confirm('m')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await expect(pending).resolves.toBe(false)
    expect(current.value).toBeNull()
  })

  it('结算后移除监听：后续 Esc 不再影响', async () => {
    const { confirm, settle, current } = useConfirm()
    const first = confirm('m1')
    settle(true)
    await first
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(current.value).toBeNull()
  })
})

describe('useConfirm · 竞态', () => {
  it('新请求把上一个未结算请求按取消结算', async () => {
    const { confirm, settle, current } = useConfirm()
    const first = confirm('旧问题')
    const second = confirm('新问题')
    await expect(first).resolves.toBe(false)
    expect(current.value).toEqual({ message: '新问题' })
    settle(true)
    await expect(second).resolves.toBe(true)
  })

  it('组件卸载时 pending 按取消结算，不悬挂', async () => {
    const scope = effectScope()
    let pending!: Promise<boolean>
    scope.run(() => {
      const { confirm } = useConfirm()
      pending = confirm('悬空问题')
    })
    scope.stop()
    await expect(pending).resolves.toBe(false)
  })
})
