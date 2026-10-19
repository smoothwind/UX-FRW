import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useHoverIntent } from './useHoverIntent'

const Host = defineComponent({
  setup() {
    const intent = useHoverIntent(100)
    return { intent }
  },
  template: '<div />',
})

describe('useHoverIntent', () => {
  it('停留满 delay 才触发', () => {
    vi.useFakeTimers()
    const wrapper = mount(Host)
    const action = vi.fn()
    wrapper.vm.intent.schedule(action)
    vi.advanceTimersByTime(99)
    expect(action).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(action).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('走廊语义：重复 schedule 重置计时且只执行最后一次', () => {
    vi.useFakeTimers()
    const wrapper = mount(Host)
    const a = vi.fn()
    const b = vi.fn()
    wrapper.vm.intent.schedule(a)
    vi.advanceTimersByTime(60)
    wrapper.vm.intent.schedule(b)
    vi.advanceTimersByTime(60)
    expect(a).not.toHaveBeenCalled()
    expect(b).not.toHaveBeenCalled()
    vi.advanceTimersByTime(40)
    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('cancel 取消尚未触发的意图', () => {
    vi.useFakeTimers()
    const wrapper = mount(Host)
    const action = vi.fn()
    wrapper.vm.intent.schedule(action)
    wrapper.vm.intent.cancel()
    vi.advanceTimersByTime(500)
    expect(action).not.toHaveBeenCalled()
    // cancel 后可重新 schedule
    wrapper.vm.intent.schedule(action)
    vi.advanceTimersByTime(100)
    expect(action).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
