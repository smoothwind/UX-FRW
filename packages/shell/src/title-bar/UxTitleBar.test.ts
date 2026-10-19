import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import UxTitleBar from './UxTitleBar.vue'
import { setPlatformAdapter, type WindowControls } from '@ux/services'

function stubControls(overrides: Partial<WindowControls> = {}): WindowControls & {
  minimize: ReturnType<typeof vi.fn>
  toggleMaximize: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
} {
  return {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    isMaximized: vi.fn().mockResolvedValue(false),
    onMaximizedChange: vi.fn(() => () => {}),
    ...overrides,
  } as WindowControls & {
    minimize: ReturnType<typeof vi.fn>
    toggleMaximize: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
  }
}

afterEach(() => {
  setPlatformAdapter(null)
})

describe('UxTitleBar', () => {
  it('无窗口控制适配器：只渲染三区插槽，不出控制按钮', () => {
    const wrapper = mount(UxTitleBar, {
      props: { title: '我的应用' },
      slots: { left: '<span>L</span>', right: '<span>R</span>' },
    })
    expect(wrapper.find('[data-ux="titlebar"]').exists()).toBe(true)
    expect(wrapper.find('[data-ux-part="titlebar-left"]').text()).toBe('L')
    expect(wrapper.find('[data-ux-part="titlebar-center"]').text()).toContain('我的应用')
    expect(wrapper.find('[data-ux-part="titlebar-right"]').text()).toContain('R')
    expect(wrapper.find('[data-ux-part="window-controls"]').exists()).toBe(false)
  })

  it('有适配器：渲染三键并转发点击', async () => {
    const controls = stubControls()
    setPlatformAdapter({ name: 'test', windowControls: controls })

    const wrapper = mount(UxTitleBar, { props: {} })
    await nextTick() // onMounted 赋值触发重渲染，异步刷
    const buttons = wrapper.findAll('[data-ux-part="window-controls"] button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0].attributes('aria-label')).toBe('最小化')
    expect(buttons[1].attributes('aria-label')).toBe('最大化')
    expect(buttons[2].attributes('aria-label')).toBe('关闭')

    await buttons[0].trigger('click')
    expect(controls.minimize).toHaveBeenCalledTimes(1)
    await buttons[1].trigger('click')
    expect(controls.toggleMaximize).toHaveBeenCalledTimes(1)
    await buttons[2].trigger('click')
    expect(controls.close).toHaveBeenCalledTimes(1)
  })

  it('isMaximized 初始态与 onMaximizedChange 推送切换 最大化/还原', async () => {
    let push: ((value: boolean) => void) | null = null
    const controls = stubControls({
      isMaximized: vi.fn().mockResolvedValue(true),
      onMaximizedChange: vi.fn((cb: (value: boolean) => void) => {
        push = cb
        return () => {}
      }),
    })
    setPlatformAdapter({ name: 'test', windowControls: controls })

    const wrapper = mount(UxTitleBar, { props: {} })
    await vi.waitFor(() => {
      expect(wrapper.findAll('[data-ux-part="window-controls"] button')[1].attributes('aria-label')).toBe('还原')
    })

    push!(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('[data-ux-part="window-controls"] button')[1].attributes('aria-label')).toBe('最大化')
  })

  it('组件卸载时退订 maximized 变更', () => {
    const unsubscribe = vi.fn()
    const controls = stubControls({ onMaximizedChange: vi.fn(() => unsubscribe) })
    setPlatformAdapter({ name: 'test', windowControls: controls })

    const wrapper = mount(UxTitleBar, { props: {} })
    wrapper.unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
