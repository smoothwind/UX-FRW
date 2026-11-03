import type { ApplyThemeOptions, ResolvedTheme, UxTheme } from './types'

export type { ApplyThemeOptions, ResolvedTheme, UxTheme } from './types'

/** 文档根元素上的主题标记（Primer 约定） */
export const THEME_ATTR = 'data-color-mode'
/** 暗色类名（Element Plus/主流库约定，双通道兼容） */
export const DARK_CLASS = 'dark'
/** 黑暗主题类名（叠加在 .dark 之上，仅覆盖表面基色/文本/边框/阴影） */
export const SILK_CLASS = 'dark-silk'

/** 视觉特效标记：data-ux-fx = 空格分隔的效果列表（sheen/frost 等见 semantic.css 特效层） */
export const FX_ATTR = 'data-ux-fx'
/** 背景丝光特效名（表面 = 顶部丝光渐变 + 主题基色，对所有主题生效） */
export const FX_SHEEN = 'sheen'
/** 磨砂玻璃特效名（浮层半透明 + backdrop blur，组件以 data-ux-fx-surface 标注） */
export const FX_FROST = 'frost'
/** 金属质感特效名（表面 = 镜面高光 + 拉丝纹理 + 主题基色） */
export const FX_METAL = 'metal'

/** 主题切换过渡标记（样式见 semantic.css；切换瞬间设置，超时摘除） */
export const THEME_TRANSITION_ATTR = 'data-theme-transition'
/** 主题过渡窗口时长：与 --ux-dur-slow 对齐 */
export const THEME_TRANSITION_MS = 240

let themeTransitionTimer: ReturnType<typeof setTimeout> | undefined

/** 跟随系统偏好时监听的媒体查询 */
const SYSTEM_QUERY = '(prefers-color-scheme: dark)'

/** 主题定义：宿主可遍历生成主题菜单/命令，无需自行维护清单 */
export interface UxThemeDef {
  id: UxTheme
  /** 英文兜底文案（宿主应经 i18n 覆盖） */
  label: string
  /** 解析后是否为暗色（system 跟随系统，此处为默认估计，实际以 resolveTheme 运行时结果为准） */
  dark: boolean
}

/**
 * 内置主题清单，与 resolveTheme/applyTheme 同源维护：新增主题值须同步更新这三处。
 * 顺序即宿主菜单/命令的建议展示顺序（system 置尾）。
 */
export const UX_THEMES: readonly UxThemeDef[] = [
  { id: 'light', label: 'Light', dark: false },
  { id: 'dark', label: 'Dark', dark: true },
  { id: 'dark-silk', label: 'Dark Silk', dark: true },
  { id: 'system', label: 'System', dark: false },
]

export function resolveTheme(theme: UxTheme): ResolvedTheme {
  if (theme === 'system') return window.matchMedia(SYSTEM_QUERY).matches ? 'dark' : 'light'
  return theme === 'light' ? 'light' : 'dark'
}

/**
 * 应用主题到文档根元素。
 * 三通道同步：data-color-mode（Primer）+ .dark 类（EP/主流库约定）+ color-scheme（原生控件）。
 * dark-silk 在 dark 基础上叠加 SILK_CLASS，并默认携带 sheen 视觉特效（FX_ATTR）；
 * 其余主题不附带特效——宿主可对任意主题自行追加 FX_ATTR 启用 sheen。
 * options.fx 显式传入时覆盖主题默认（dark-silk 默认 [sheen]）。
 * 切换瞬间设置 THEME_TRANSITION_ATTR，全元素颜色按 --ux-dur-slow 过渡，超时摘除。
 */
export function applyTheme(theme: UxTheme, options: ApplyThemeOptions = {}): ResolvedTheme {
  const resolved = resolveTheme(theme)
  const silk = theme === 'dark-silk'
  const effects = options.fx ?? (silk ? [FX_SHEEN] : [])
  const root = document.documentElement
  root.setAttribute(THEME_TRANSITION_ATTR, '')
  root.setAttribute(THEME_ATTR, silk ? 'dark-silk' : resolved)
  root.classList.toggle(DARK_CLASS, resolved === 'dark')
  root.classList.toggle(SILK_CLASS, silk)
  if (effects.length > 0) {
    root.setAttribute(FX_ATTR, effects.join(' '))
  } else {
    root.removeAttribute(FX_ATTR)
  }
  root.style.colorScheme = resolved
  window.clearTimeout(themeTransitionTimer)
  themeTransitionTimer = setTimeout(() => {
    root.removeAttribute(THEME_TRANSITION_ATTR)
    themeTransitionTimer = undefined
  }, THEME_TRANSITION_MS)
  options.syncPlatform?.(resolved)
  return resolved
}

/** 监听系统主题变化，仅在用户选择 system 时回调 resolved 结果 */
export function watchSystemTheme(cb: (resolved: ResolvedTheme) => void): () => void {
  const mql = window.matchMedia(SYSTEM_QUERY)
  const handler = (): void => cb(resolveTheme('system'))
  mql.addEventListener('change', handler)
  return () => mql.removeEventListener('change', handler)
}

/** 运行时读取令牌值（图表/画布等 JS 场景专用，禁止 JS 分支硬编码颜色） */
export function getToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** token 名常量：避免业务代码中出现魔法字符串 */
export const tokenNames = {
  fs: {
    xs: '--ux-fs-xs',
    sm: '--ux-fs-sm',
    md: '--ux-fs-md',
    lg: '--ux-fs-lg',
    xl: '--ux-fs-xl',
    display: '--ux-fs-display',
  },
  sp: {
    1: '--ux-sp-1',
    2: '--ux-sp-2',
    3: '--ux-sp-3',
    4: '--ux-sp-4',
    5: '--ux-sp-5',
    6: '--ux-sp-6',
  },
  z: {
    local: '--ux-z-local',
    dock: '--ux-z-dock',
    pop: '--ux-z-pop',
    top: '--ux-z-top',
    modal: '--ux-z-modal',
    menu: '--ux-z-menu',
    dropdown: '--ux-z-dropdown',
    tour: '--ux-z-tour',
    toast: '--ux-z-toast',
  },
  color: {
    accent: '--ux-accent',
    bg: '--ux-bg',
    fg: '--ux-fg',
    border: '--ux-border',
    danger: '--ux-danger',
    success: '--ux-success',
    warning: '--ux-warning',
    info: '--ux-info',
  },
} as const
