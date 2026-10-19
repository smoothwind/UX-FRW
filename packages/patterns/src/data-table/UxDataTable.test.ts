import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import UxDataTable from './UxDataTable.vue'
import type { DataTableColumn } from '../types'

class ResizeObserverStub {
  static instances: ResizeObserverStub[] = []
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    ResizeObserverStub.instances.push(this)
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  trigger(): void {
    this.callback([], this as unknown as ResizeObserver)
  }
}

const columns: DataTableColumn[] = [
  { name: 'id', width: 80, align: 'right' },
  { name: 'score', width: 110, align: 'right' },
]

/** id 列 = 原始行号 + 1，score 列含 null（null 恒排最前） */
const rows: unknown[][] = [
  [3, 30], // index 0
  [1, 10], // index 1
  [2, null], // index 2
  [4, 20], // index 3
]

async function mountTable(props: Record<string, unknown> = {}) {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)

  const wrapper = mount(UxDataTable, {
    props: { columns, rows, rowHeight: 28, ...props },
  })

  const table = wrapper.find('[data-ux="data-table"]')
  Object.defineProperty(table.element, 'clientHeight', { value: 280, configurable: true })
  ResizeObserverStub.instances[ResizeObserverStub.instances.length - 1].trigger()
  await nextTick()
  return wrapper
}

function bodyRows(wrapper: VueWrapper) {
  return wrapper.find('[data-ux-part="table-body"]').findAll('[role="row"]')
}

function rowTexts(wrapper: VueWrapper) {
  return bodyRows(wrapper).map((row) =>
    row.findAll('[role="gridcell"]').map((cell) => cell.text()),
  )
}

describe('UxDataTable', () => {
  beforeEach(() => {
    ResizeObserverStub.instances = []
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('虚拟滚动：只渲染视口窗口，占位高度 = 行数 × 行高', async () => {
    const big = Array.from({ length: 500 }, (_, i) => [i + 1, i])
    const wrapper = await mountTable({ rows: big })

    // clientHeight 280 / 28 = 10 行可见，+1 + overscan 6*2 = 23 行窗口
    expect(bodyRows(wrapper)).toHaveLength(23)
    expect(wrapper.find('.ux-dt__spacer').attributes('style')).toContain('height: 14000px')
    // 首行从 index 0 开始
    expect(rowTexts(wrapper)[0]).toEqual(['1', '0'])
  })

  it('滚动后窗口平移，渲染行顶部偏移对齐 startIndex', async () => {
    const big = Array.from({ length: 500 }, (_, i) => [i + 1, i])
    const wrapper = await mountTable({ rows: big })
    const table = wrapper.find('[data-ux="data-table"]')

    table.element.scrollTop = 2800 // 100 行
    await table.trigger('scroll')
    await nextTick()

    // startIndex = 100 - 6(overscan) = 94 → 首行是原始第 95 行
    expect(rowTexts(wrapper)[0]).toEqual(['95', '94'])
    const firstRow = bodyRows(wrapper)[0]
    expect(firstRow.attributes('style')).toContain('top: 2632px') // 94 * 28
  })

  it('点击列头排序：数字列升/降序切换，aria-sort 同步', async () => {
    const wrapper = await mountTable()
    const scoreHeader = wrapper.findAll('[role="columnheader"]')[1]

    expect(scoreHeader.attributes('aria-sort')).toBe('none')

    await scoreHeader.trigger('click')
    expect(scoreHeader.attributes('aria-sort')).toBe('ascending')
    // 升序：null(2) 最前，然后 10(1) / 20(3) / 30(0)
    expect(rowTexts(wrapper).map((r) => r[0])).toEqual(['2', '1', '4', '3'])
    expect(scoreHeader.classes()).toContain('is-sorted')

    await scoreHeader.trigger('click')
    expect(scoreHeader.attributes('aria-sort')).toBe('descending')
    expect(rowTexts(wrapper).map((r) => r[0])).toEqual(['3', '4', '1', '2'])

    // 未排序列保持 none
    expect(wrapper.findAll('[role="columnheader"]')[0].attributes('aria-sort')).toBe('none')
  })

  it('排序后事件上报原始行号（cellContext / rowCopy）', async () => {
    const wrapper = await mountTable()
    const scoreHeader = wrapper.findAll('[role="columnheader"]')[1]
    await scoreHeader.trigger('click') // 升序：[2,null] 排第一
    await scoreHeader.trigger('click') // 降序：index 0（id=3）排第一

    const firstCell = bodyRows(wrapper)[0].findAll('[role="gridcell"]')[0]
    await firstCell.trigger('contextmenu', { clientX: 11, clientY: 22 })

    const ctx = wrapper.emitted('cellContext')?.[0][0] as {
      row: number
      col: number
      value: unknown
      x: number
      y: number
    }
    expect(ctx).toEqual({ row: 0, col: 0, value: 3, x: 11, y: 22 })

    await firstCell.trigger('dblclick')
    expect(wrapper.emitted('rowCopy')?.[0]).toEqual([0])
  })

  it('null 单元格渲染为空 + is-null 标记，对象走 JSON 序列化', async () => {
    const wrapper = await mountTable({
      rows: [
        [1, { a: 1 }], // index 0
        [2, null], // index 1
      ],
    })
    const texts = rowTexts(wrapper)
    expect(texts[0][1]).toBe('{"a":1}')
    expect(texts[1][1]).toBe('')

    const nullCell = bodyRows(wrapper)[1].findAll('[role="gridcell"]')[1]
    expect(nullCell.classes()).toContain('is-null')
  })

  it('sortable=false：列头禁用且点击不排序', async () => {
    const wrapper = await mountTable({ sortable: false })
    const headers = wrapper.findAll('[role="columnheader"]')

    for (const header of headers) {
      expect(header.attributes('disabled')).toBeDefined()
      expect(header.attributes('aria-sort')).toBeUndefined()
    }

    await headers[1].trigger('click')
    expect(headers[1].attributes('aria-sort')).toBeUndefined()
    // 保持原始顺序
    expect(rowTexts(wrapper).map((r) => r[0])).toEqual(['3', '1', '2', '4'])
  })

  it('列宽走 column.width，缺省 160', async () => {
    const wrapper = await mountTable()
    const cells = bodyRows(wrapper)[0].findAll('[role="gridcell"]')
    expect(cells[0].attributes('style')).toContain('width: 80px')
    expect(cells[1].attributes('style')).toContain('width: 110px')

    const wrapper2 = await mountTable({ columns: [{ name: 'only' }], rows: [['x']] })
    expect(
      bodyRows(wrapper2)[0].findAll('[role="gridcell"]')[0].attributes('style'),
    ).toContain('width: 160px')
  })
})
