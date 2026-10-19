import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UxStatusBar from './UxStatusBar.vue'

describe('UxStatusBar', () => {
  it('左右分区渲染插槽内容', () => {
    const wrapper = mount(UxStatusBar, {
      slots: { default: '<span>MySQL@demo</span>', right: '<span>RN 3</span>' },
    })
    expect(wrapper.find('[data-ux="statusbar"]').exists()).toBe(true)
    expect(wrapper.find('[data-ux-part="statusbar-left"]').text()).toBe('MySQL@demo')
    expect(wrapper.find('[data-ux-part="statusbar-right"]').text()).toBe('RN 3')
  })

  it('空插槽渲染空状态栏', () => {
    const wrapper = mount(UxStatusBar)
    expect(wrapper.find('[data-ux="statusbar"]').text()).toBe('')
  })
})
