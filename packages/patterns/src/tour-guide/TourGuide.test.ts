import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import TourGuide from './TourGuide.vue'
import type { TourStep } from '../types'

enableAutoUnmount(afterEach)

const steps: TourStep[] = [
  { target: '[data-tour-anchor="0"]', title: '第一步', desc: '第一行\n第二行' },
  { target: '[data-tour-anchor="1"]', title: '第二步', desc: '第二页说明' },
]

beforeEach(() => {
  document.body.innerHTML = ''
  document.body.insertAdjacentHTML(
    'beforeend',
    '<div data-tour-anchor="0">锚点A</div><div data-tour-anchor="1">锚点B</div>',
  )
  vi.stubGlobal(
    'requestAnimationFrame',
    ((cb: FrameRequestCallback) => {
      cb(0)
      return 1
    }) as unknown as typeof requestAnimationFrame,
  )
  vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const idx = this.getAttribute('data-tour-anchor')
    const make = (top: number, left: number, width: number, height: number): DOMRect =>
      ({ top, left, width, height, bottom: top + height, right: left + width }) as DOMRect
    if (idx === '0') return make(100, 50, 300, 200)
    if (idx === '1') return make(700, 30, 240, 150)
    return make(0, 0, 0, 0)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

function mountTour(props: Record<string, unknown> = {}): VueWrapper {
  return mount(TourGuide, {
    props: { steps, ...props },
    attachTo: document.body,
  })
}

function cardButtons(wrapper: VueWrapper) {
  return wrapper.find('[data-ux-part="tour-card"]').findAll('button')
}

describe('TourGuide', () => {
  it('挂载自动启动：spot 定位、卡片内容、初始聚焦', async () => {
    const wrapper = mountTour()
    await nextTick()
    await nextTick()

    const tour = wrapper.find('[data-ux="tour"]')
    expect(tour.exists()).toBe(true)
    expect(tour.attributes('role')).toBe('dialog')
    expect(tour.attributes('aria-modal')).toBe('true')
    expect(tour.classes()).not.toContain('ux-tour--dim')

    const spot = wrapper.find('[data-ux-part="tour-spot"]')
    expect(spot.exists()).toBe(true)
    expect(spot.attributes('style')).toContain('left: 44px')
    expect(spot.attributes('style')).toContain('width: 312px')

    const card = wrapper.find('[data-ux-part="tour-card"]')
    expect(card.attributes('style')).toContain('left: 50px')
    expect(card.attributes('style')).toContain('top: 314px')
    expect(card.find('.ux-tour__step').text()).toBe('1 / 2')
    expect(card.find('.ux-tour__title').text()).toBe('第一步')
    expect(card.findAll('.ux-tour__desc p')).toHaveLength(2)

    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(card.element)
  })

  it('翻页：下一步/上一步/完成写 storage 并上报 done', async () => {
    const wrapper = mountTour({ storageKey: 'tour-test' })
    await nextTick()
    await nextTick()
    expect(cardButtons(wrapper)).toHaveLength(2)

    await cardButtons(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.ux-tour__step').text()).toBe('2 / 2')
    expect(cardButtons(wrapper)).toHaveLength(3)
    expect(cardButtons(wrapper).at(-1)?.text()).toContain('完成')

    await cardButtons(wrapper).at(-1)?.trigger('click')
    await nextTick()
    expect(wrapper.find('[data-ux="tour"]').exists()).toBe(false)
    expect(wrapper.emitted('done')).toHaveLength(1)
    expect(localStorage.getItem('tour-test')).toBe('1')
  })

  it('键盘：ArrowRight/ArrowLeft 翻页，Escape 完成', async () => {
    const wrapper = mountTour()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await nextTick()
    expect(wrapper.find('.ux-tour__step').text()).toBe('2 / 2')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    await nextTick()
    expect(wrapper.find('.ux-tour__step').text()).toBe('1 / 2')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('[data-ux="tour"]').exists()).toBe(false)
    expect(wrapper.emitted('done')).toHaveLength(1)
  })

  it('storageKey 已完成 → 下次挂载自动跳过', () => {
    localStorage.setItem('tour-skip', '1')
    const wrapper = mountTour({ storageKey: 'tour-skip' })
    expect(wrapper.find('[data-ux="tour"]').exists()).toBe(false)
  })

  it('auto false → 手动 start 拉起并聚焦；无锚点 → 居中暗化卡片', async () => {
    const wrapper = mountTour({ auto: false })
    expect(wrapper.find('[data-ux="tour"]').exists()).toBe(false)

    const exposed = wrapper.vm as unknown as { start(): void }
    exposed.start()
    await nextTick()
    await nextTick()
    const tour = wrapper.find('[data-ux="tour"]')
    expect(tour.exists()).toBe(true)
    expect(tour.classes()).not.toContain('ux-tour--dim')
    expect(document.activeElement).toBe(wrapper.find('[data-ux-part="tour-card"]').element)

    wrapper.unmount()
    const noTarget = mountTour({ auto: true, steps: [{ title: '无锚点', desc: 'x' }] })
    await nextTick()
    await nextTick()
    const dim = noTarget.find('[data-ux="tour"]')
    expect(dim.exists()).toBe(true)
    expect(dim.classes()).toContain('ux-tour--dim')
    expect(dim.find('[data-ux-part="tour-spot"]').exists()).toBe(false)
    expect(dim.find('[data-ux-part="tour-card"]').classes()).toContain('ux-tour__card--centered')
  })
})
