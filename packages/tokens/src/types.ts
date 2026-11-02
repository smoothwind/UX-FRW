export type UxTheme = 'light' | 'dark' | 'dark-silk' | 'system'
/**
 * 平台解析结果（light/dark 二元）：供 Electron nativeTheme / Tauri set_theme 等
 * 原生通道消费；dark-silk（黑暗主题，墨黑丝滑质感）解析为 dark，差异只在 Web 语义层。
 */
export type ResolvedTheme = 'light' | 'dark'

export interface ApplyThemeOptions {
  /** 主题解析后回调宿主（Electron nativeTheme / Tauri set_theme），保持原生标题栏/菜单同步 */
  syncPlatform?: (theme: ResolvedTheme) => void
  /**
   * 视觉特效列表（FX_SHEEN / FX_FROST 等）。显式传入则覆盖主题默认（dark-silk 默认 sheen）；
   * 传空数组关闭全部特效。省略时用主题默认。
   */
  fx?: readonly string[]
}
