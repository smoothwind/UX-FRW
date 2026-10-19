import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import ErrorState from './ErrorState.vue'
import { looksLikeConnError } from './looks-like-conn-error'

enableAutoUnmount(afterEach)

const origClipboard = navigator.clipboard

function mountError(props: Record<string, unknown>): VueWrapper {
  return mount(ErrorState, { props: props as never, attachTo: document.body })
}

describe('looksLikeConnError', () => {
  it('连接类关键词命中（含中文/大小写）', () => {
    for (const msg of [
      'Not connected',
      'session expired',
      'Connection refused',
      'socket closed',
      'pipe broken',
      '连接已断开',
    ]) {
      expect(looksLikeConnError(msg)).toBe(true)
    }
  })

  it('超时类不按连接错误处理（独立重试语义）', () => {
    expect(looksLikeConnError('Query timeout')).toBe(false)
    expect(looksLikeConnError('连接超时')).toBe(false)
    expect(looksLikeConnError('syntax error')).toBe(false)
  })
})

describe('ErrorState', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: origClipboard, configurable: true })
  })

  it('普通错误：role=alert、默认标题、详情常显、重试按钮', async () => {
    const onRetry = vi.fn()
    const wrapper = mountError({ error: 'syntax error near FROM', onRetry })

    expect(wrapper.find('[data-ux="error"]').attributes('role')).toBe('alert')
    expect(wrapper.find('.ux-error__title').text()).toBe('操作失败')
    expect(wrapper.find('.ux-error__detail').text()).toBe('syntax error near FROM')

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    await buttons[0].trigger('click')
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('连接类错误：标题与重连动作；超时归位普通重试', () => {
    const conn = mountError({ error: 'Connection refused', onRetry: vi.fn(), onReconnect: vi.fn() })
    expect(conn.find('.ux-error__title').text()).toBe('连接出现问题')
    expect(conn.text()).toContain('重连')
    expect(conn.text()).not.toContain('重试')

    const timeout = mountError({ error: 'Query timeout', onRetry: vi.fn(), onReconnect: vi.fn() })
    expect(timeout.find('.error-title, .ux-error__title').text()).toBe('操作失败')
    expect(timeout.text()).toContain('重试')
  })

  it('title 覆盖自动标题', () => {
    const wrapper = mountError({ error: 'boom', title: '保存失败' })
    expect(wrapper.find('.ux-error__title').text()).toBe('保存失败')
  })

  it('有 summary 时默认折叠详情，可切换', async () => {
    const wrapper = mountError({ error: 'E-123 raw stack', summary: '数据库连接失败' })
    expect(wrapper.find('.ux-error__summary').text()).toBe('数据库连接失败')
    expect(wrapper.find('.ux-error__detail').exists()).toBe(false)

    const toggle = wrapper.findAll('button').find((b) => b.text().includes('显示详情'))
    await toggle?.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ux-error__detail').text()).toBe('E-123 raw stack')

    const hide = wrapper.findAll('button').find((b) => b.text().includes('隐藏详情'))
    await hide?.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ux-error__detail').exists()).toBe(false)
  })

  it('复制详情写入剪贴板；查看日志回调', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    const onOpenLog = vi.fn()
    const wrapper = mountError({ error: 'E-123', onOpenLog })
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)

    await buttons[0].trigger('click')
    expect(writeText).toHaveBeenCalledWith('E-123')

    await buttons[1].trigger('click')
    expect(onOpenLog).toHaveBeenCalledTimes(1)
  })

  it('onOpenLog 缺省时不渲染查看日志按钮', () => {
    const wrapper = mountError({ error: 'boom', onRetry: vi.fn() })
    expect(wrapper.findAll('button')).toHaveLength(2)
  })
})
