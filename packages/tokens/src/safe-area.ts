/**
 * 安全区运行时覆写（docs/UxKit-移动端设计规范.md §3.3/§8）。
 *
 * layout.css 的 `--ux-safe-*` 默认取 env(safe-area-inset-*)，但部分安卓 WebView
 * env() 不可靠——由宿主经 PlatformAdapter.safeAreaInsets() 上报真实数值，
 * 再调本工具以内联样式覆写同名令牌（与 PreferencesService 注入偏好同机制，
 * :root 内联 style 优先级高于任何样式表）。
 */

/** 安全区四边数值（px，逻辑像素） */
export interface SafeAreaInsets {
  top: number
  right: number
  bottom: number
  left: number
}

const SIDES = ['top', 'right', 'bottom', 'left'] as const
type Side = (typeof SIDES)[number]

/** 逐边覆写 --ux-safe-*（只写提供的边；负值钳为 0） */
export function applySafeAreaInsets(insets: Partial<SafeAreaInsets>): void {
  for (const side of SIDES) {
    const value = insets[side]
    if (value === undefined || !Number.isFinite(value)) continue
    document.documentElement.style.setProperty(`--ux-safe-${side}`, `${Math.max(0, value)}px`)
  }
}

/** 摘除全部覆写，回落到样式表的 env() 取值 */
export function resetSafeAreaInsets(): void {
  for (const side of SIDES) {
    document.documentElement.style.removeProperty(`--ux-safe-${side}`)
  }
}

/** 当前生效的四边覆写值（未覆写的边返回 undefined；测试/调试用） */
export function getSafeAreaOverrides(): Partial<Record<Side, string>> {
  const out: Partial<Record<Side, string>> = {}
  for (const side of SIDES) {
    const value = document.documentElement.style.getPropertyValue(`--ux-safe-${side}`)
    if (value) out[side] = value
  }
  return out
}
