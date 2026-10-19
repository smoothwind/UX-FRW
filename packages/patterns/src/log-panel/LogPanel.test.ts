import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import LogPanel from './LogPanel.vue'
import { useActivityLog } from '@ux/composables'

const FIXED_NOW = new Date(2026, 9, 19, 9, 5, 7).getTime()

async function mountPanel() {
  const log = useActivityLog({ now: () => FIXED_NOW })
  log.push('info', '连接已建立', 'host=127.0.0.1\nport=3306')
  log.push('warn', '慢查询 1.2s')
  log.push('error', 'SQL 执行失败', 'Error: duplicate key')

  // 预置滚动几何：scrollHeight 800 / clientHeight 200，便于断言自动滚动
  const wrapper = mount(LogPanel, { props: { log, label: '活动日志' } })
  const list = wrapper.find('[data-ux-part="log-body"]')
  Object.defineProperty(list.element, 'scrollHeight', { value: 800, configurable: true })
  Object.defineProperty(list.element, 'clientHeight', { value: 200, configurable: true })
  await nextTick()
  return { wrapper, log, list }
}

function rows(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.ux-log__row')
}

describe('LogPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('渲染条目：级别图标行、时间 HH:mm:ss、detail 行可聚焦', async () => {
    const { wrapper } = await mountPanel()

    expect(rows(wrapper)).toHaveLength(3)
    expect(wrapper.find('[data-ux="log-panel"]').attributes('aria-label')).toBe('活动日志')

    const first = rows(wrapper)[0]
    expect(first.find('.ux-log__time').text()).toBe('09:05:07')
    expect(first.find('.ux-log__title').text()).toBe('连接已建立')
    expect(first.classes()).toContain('ux-log__row--info')
    expect(first.attributes('role')).toBe('button')
    expect(first.attributes('tabindex')).toBe('0')

    // 无 detail 的行不可交互
    expect(rows(wrapper)[1].attributes('role')).toBeUndefined()
    // 级别过滤计数 chip
    expect(wrapper.find('.ux-chip').text()).toBe('3')
  })

  it('级别过滤：只显示对应级别，计数跟随变化', async () => {
    const { wrapper } = await mountPanel()
    const radios = wrapper.findAll('[role="radio"]')

    await radios[1].trigger('click') // 错误
    await nextTick()

    const visible = rows(wrapper)
    expect(visible).toHaveLength(1)
    expect(visible[0].find('.ux-log__title').text()).toBe('SQL 执行失败')
    expect(visible[0].classes()).toContain('ux-log__row--error')
    expect(wrapper.find('.ux-chip').text()).toBe('1')

    await radios[0].trigger('click') // 全部
    await nextTick()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('详情展开/折叠：点击与 Enter/Space 均可切换', async () => {
    const { wrapper } = await mountPanel()
    const first = rows(wrapper)[0]

    expect(wrapper.find('.ux-log__detail').exists()).toBe(false)

    await first.trigger('click')
    const detail = wrapper.find('.ux-log__detail')
    expect(detail.exists()).toBe(true)
    expect(detail.text()).toContain('host=127.0.0.1')

    await rows(wrapper)[0].trigger('keydown.space')
    expect(wrapper.find('.ux-log__detail').exists()).toBe(false)

    await rows(wrapper)[0].trigger('keydown.enter')
    expect(wrapper.find('.ux-log__detail').exists()).toBe(true)
  })

  it('自动滚动：新日志写入时贴底；关闭后不再贴底，滚回底部自动恢复', async () => {
    const { wrapper, log, list } = await mountPanel()

    // mount 后已贴底（scrollHeight 800）
    expect(list.element.scrollTop).toBe(800)

    log.push('info', '新日志')
    // watch 里是 nextTick(scrollToBottom)，需两拍才落地
    await nextTick()
    await nextTick()
    expect(list.element.scrollTop).toBe(800)

    // 滚离底部（800 - 100 - 200 = 500 ≥ 4）→ 自动滚动关闭
    list.element.scrollTop = 100
    await list.trigger('scroll')
    await nextTick()
    const toggle = wrapper.find('button[aria-pressed]')
    expect(toggle.attributes('aria-pressed')).toBe('false')

    // 关闭后写入不再贴底
    log.push('info', '离底期间日志')
    await nextTick()
    await nextTick()
    expect(list.element.scrollTop).toBe(100)

    // 滚回底部（800 - 800 - 200 < 4）→ 自动恢复并立即贴底
    list.element.scrollTop = 800
    await list.trigger('scroll')
    expect(toggle.attributes('aria-pressed')).toBe('true')
    await nextTick()
    await nextTick()
    expect(list.element.scrollTop).toBe(800)
  })

  it('挂载即 markOpened：未读错误清零；清空按钮清空并显示空态', async () => {
    const log = useActivityLog({ now: () => FIXED_NOW })
    log.push('error', '错误一')
    log.push('error', '错误二')
    expect(log.unreadErrors.value).toBe(2)

    const wrapper = mount(LogPanel, { props: { log } })
    await nextTick()
    expect(log.unreadErrors.value).toBe(0)

    await wrapper.find('button[aria-label="清空"]').trigger('click')
    expect(log.entries.value).toHaveLength(0)
    expect(wrapper.find('.ux-log__empty').text()).toBe('暂无日志')
  })
})
