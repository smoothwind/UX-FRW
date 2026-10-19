import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import UxToastHost from './ToastHost.vue'
import { dismissToast, notify, notifyOnce, toastState } from './service'

beforeEach(() => {
  vi.useFakeTimers()
  toastState.toasts.value = []
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('toast service', () => {
  it('notify 推入队列：字符串简写 + 默认 info 类型', () => {
    notify('已保存')
    notify({ type: 'success', message: '成功' })
    const list = toastState.toasts.value
    expect(list).toHaveLength(2)
    expect(list[0]).toMatchObject({ type: 'info', message: '已保存' })
    expect(list[1]).toMatchObject({ type: 'success', message: '成功' })
    expect(list[0].id).not.toBe(list[1].id)
  })

  it('默认 4 秒自动消失', () => {
    notify('短命')
    expect(toastState.toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(3999)
    expect(toastState.toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toastState.toasts.value).toHaveLength(0)
  })

  it('duration <=0 不自动消失', () => {
    notify({ message: '常驻', duration: 0 })
    vi.advanceTimersByTime(60000)
    expect(toastState.toasts.value).toHaveLength(1)
  })

  it('dismissToast 手动移除', () => {
    notify('a')
    const id = toastState.toasts.value[0].id
    dismissToast(id)
    expect(toastState.toasts.value).toHaveLength(0)
  })

  it('notifyOnce 同 key 5 秒窗口内只发一次', () => {
    // 避开 onceMap 默认值 0：从 10s 起步
    vi.setSystemTime(10000)
    notifyOnce('conn.lost', '连接断开')
    notifyOnce('conn.lost', '连接断开')
    vi.setSystemTime(14999)
    notifyOnce('conn.lost', '连接断开')
    expect(toastState.toasts.value).toHaveLength(1)
    vi.setSystemTime(15000)
    notifyOnce('conn.lost', '连接断开')
    expect(toastState.toasts.value).toHaveLength(2)
    // 不同 key 互不影响
    notifyOnce('other', '其他')
    expect(toastState.toasts.value).toHaveLength(3)
  })
})

describe('UxToastHost', () => {
  async function mountHost() {
    const wrapper = mount(UxToastHost, { attachTo: document.body })
    await nextTick()
    return wrapper
  }

  it('aria-live 容器 + role=status + 类型样式', async () => {
    const wrapper = await mountHost()
    expect(document.querySelector('.ux-toast-host')!.getAttribute('aria-live')).toBe('polite')
    notify({ type: 'warning', message: '注意' })
    await nextTick()
    const toast = document.querySelector('.ux-toast')!
    expect(toast.getAttribute('role')).toBe('status')
    expect(toast.className).toContain('ux-toast--warning')
    expect(toast.textContent).toContain('注意')
    wrapper.unmount()
  })

  it('动作按钮：点击执行并关闭', async () => {
    const wrapper = await mountHost()
    const run = vi.fn()
    notify({ message: '有动作', action: { label: '重试', run } })
    await nextTick()
    const btn = document.querySelector('.ux-toast__action') as HTMLButtonElement
    expect(btn.textContent).toContain('重试')
    btn.click()
    await nextTick()
    expect(run).toHaveBeenCalledTimes(1)
    expect(toastState.toasts.value).toHaveLength(0)
    wrapper.unmount()
  })

  it('无动作时不渲染按钮', async () => {
    const wrapper = await mountHost()
    notify('纯文本')
    await nextTick()
    expect(document.querySelector('.ux-toast__action')).toBeNull()
    wrapper.unmount()
  })
})
