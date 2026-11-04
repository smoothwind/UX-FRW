/**
 * 视口状态通道（docs/UxKit-移动端设计规范.md §3.4）。
 *
 * 与 data-color-mode / data-ux-fx 同构的根属性通道：
 * `data-ux-viewport="sm coarse portrait"`（当前断点档 + 粗指针 + 方向，空格分隔）。
 * CSS 用属性选择器收缩布局，e2e 用它断言；**任何组件不得自行 matchMedia**
 * （红线：视口判断唯一出口）。
 *
 * 断点登记制（§3.1）：CSS 媒体查询不能消费 CSS 变量，断点值以本常量为 JS 事实源，
 * layout.css 的 --ux-bp-* 注释与之双源同值；Playwright 等引用本常量。
 */

/** 断点登记（与 layout.css --ux-bp-* 双源同值） */
export const BP = { sm: 600, md: 960, lg: 1280 } as const

/** 视口根属性名 */
export const VIEWPORT_ATTR = 'data-ux-viewport'

/** 断点档位：sm = 手机（< BP.md），md = 平板（≥ BP.md），lg = 桌面（≥ BP.lg） */
export type ViewportTier = 'sm' | 'md' | 'lg'

export interface ViewportState {
  tier: ViewportTier
  /** 粗指针（触屏） */
  coarse: boolean
  orientation: 'portrait' | 'landscape'
}

type MediaQueryLike = {
  matches: boolean
  addEventListener?: (type: string, cb: () => void) => void
  removeEventListener?: (type: string, cb: () => void) => void
}

/** 由 ≥md / ≥lg 匹配结果解析当前档位（sm 为 <BP.md 的回落档） */
function tierFromMatches(md: boolean, lg: boolean): ViewportTier {
  if (lg) return 'lg'
  if (md) return 'md'
  return 'sm'
}

/** 单次读取当前视口状态（不发监听） */
export function resolveViewport(): ViewportState {
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const portrait = window.matchMedia('(orientation: portrait)').matches
  const w = window.innerWidth
  return {
    tier: w >= BP.lg ? 'lg' : w >= BP.md ? 'md' : 'sm',
    coarse,
    orientation: portrait ? 'portrait' : 'landscape',
  }
}

/** 把状态写为根属性值："sm coarse portrait" */
function serialize(state: ViewportState): string {
  return [state.tier, state.coarse ? 'coarse' : 'fine', state.orientation].join(' ')
}

/**
 * 启用视口通道：立即写一次根属性，然后 matchMedia 监听断点/指针/方向变化持续更新。
 * 返回取消函数（宿主卸载时调用）；重复调用前应先取消上一次。
 */
export function applyViewport(): () => void {
  const queries = {
    md: window.matchMedia(`(min-width: ${BP.md}px)`),
    lg: window.matchMedia(`(min-width: ${BP.lg}px)`),
    coarse: window.matchMedia('(pointer: coarse)'),
    portrait: window.matchMedia('(orientation: portrait)'),
  }

  const update = (): void => {
    const tier = tierFromMatches(queries.md.matches, queries.lg.matches)
    const coarse = queries.coarse.matches
    const orientation = queries.portrait.matches ? 'portrait' : 'landscape'
    document.documentElement.setAttribute(VIEWPORT_ATTR, serialize({ tier, coarse, orientation }))
  }

  update()
  const list: MediaQueryLike[] = Object.values(queries) as MediaQueryLike[]
  for (const q of list) q.addEventListener?.('change', update)

  return () => {
    for (const q of list) q.removeEventListener?.('change', update)
    document.documentElement.removeAttribute(VIEWPORT_ATTR)
  }
}
