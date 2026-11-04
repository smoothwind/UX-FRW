export interface WindowControls {
  minimize(): void
  toggleMaximize(): void
  close(): void
  isMaximized(): Promise<boolean>
  /** 订阅最大化状态变化，返回取消订阅函数 */
  onMaximizedChange(listener: (maximized: boolean) => void): () => void
}

export interface PlatformAdapter {
  /** 宿主标识：'electron' | 'tauri' | 'web' | 自定义 */
  name: string
  os?: 'win32' | 'darwin' | 'linux'
  /** 提供后 TitleBar 显示窗控按钮（frameless 模式） */
  windowControls?: WindowControls
  /** 提供后 UxSplash 收场时关闭宿主原生启动窗（Electron/Tauri）；web 无需实现 */
  closeSplash?: () => void
  /** 提供后支持按显示器摆放窗口（多显示器/混合 DPI）；web 可用 createWebWindowPlacement 占位 */
  windowPlacement?: WindowPlacement
  /** 提供后支持原生窗口材质（亚克力/Mica/模糊）；Tauri/Electron 各自实现，web 无需实现（§11.5） */
  applyWindowMaterial?(options: WindowMaterialOptions): Promise<void>
  /** 提供后宿主注册 OS 通知身份（Windows AUMID）；应在宿主启动早期调用一次（§11.6） */
  registerToastIdentity?(options: ToastIdentityOptions): Promise<void>
}

let current: PlatformAdapter | null = null

/** 注入宿主适配器（createUxKit 或 main.ts 调用）；传 null 清除 */
export function setPlatformAdapter(adapter: PlatformAdapter | null): void {
  current = adapter
}

export function getPlatformAdapter(): PlatformAdapter | null {
  return current
}

/**
 * 浏览器近似窗控（仅供演示/在浏览器中预览 frameless 壳）：
 * 最大化以全屏模拟，其余为安全空操作。
 */
export function createWebWindowControls(): WindowControls {
  return {
    minimize(): void {
      /* 浏览器无最小化能力 */
    },
    toggleMaximize(): void {
      if (document.fullscreenElement) void document.exitFullscreen()
      else void document.documentElement.requestFullscreen()
    },
    close(): void {
      window.close()
    },
    isMaximized(): Promise<boolean> {
      return Promise.resolve(!!document.fullscreenElement)
    },
    onMaximizedChange(listener: (maximized: boolean) => void): () => void {
      const handler = (): void => listener(!!document.fullscreenElement)
      document.addEventListener('fullscreenchange', handler)
      return () => document.removeEventListener('fullscreenchange', handler)
    },
  }
}

// ---------- 窗口材质与 OS 通知身份（宿主扩展位） ----------

/**
 * 原生窗口材质参数（亚克力/Mica/模糊）。宿主各自实现底层调用：
 * Tauri 走 window effects，Electron 走 setBackgroundMaterial + 透明窗口；
 * 降级路径与 DWM 圆角约束见 docs/UxKit-设计方案.md §11.5。
 */
export interface WindowMaterialOptions {
  /** 材质档位；'none' 显式关闭——不支持透明材质环境的统一降级出口 */
  effect: 'acrylic' | 'mica' | 'blur' | 'none'
  /** 材质 tint 色（CSS 颜色值）；仅 acrylic 档语义生效，宿主换算为系统 tint */
  tint?: string
  /** 深浅语义：主题切换时宿主应重新调用以同步系统材质明暗参数 */
  dark?: boolean
}

/**
 * OS 通知身份（Windows AUMID）。不注册的后果见 §11.6：
 * dev/便携构建的通知来源显示宿主进程名（如 "Windows PowerShell"），安装版静默失败。
 */
export interface ToastIdentityOptions {
  /** 应用通知标识（Windows AUMID，反向域名如 'com.example.app'） */
  id: string
  /** 通知中心展示名 */
  displayName: string
  /** 通知图标（file:/// 绝对路径或安装目录相对路径）；可省略 */
  iconUri?: string
}

// ---------- 窗口摆放（多显示器 / 混合 DPI） ----------

export interface DesiredWindowBounds {
  /** 期望逻辑宽度，默认 1280 */
  width?: number
  /** 期望逻辑高度，默认 840 */
  height?: number
  /** 最小逻辑宽度，默认 760 */
  minWidth?: number
  /** 最小逻辑高度，默认 540 */
  minHeight?: number
  /** 窗口占目标屏工作区比例上限（四周留边），默认 0.9 */
  workAreaRatio?: number
}

/** 显示器指标变化：'bounds' | 'workArea' | 'scaleFactor' | 'rotation' */
export interface DisplayMetricsChangedEvent {
  changedMetrics: string[]
}

/**
 * 按显示器摆放窗口的能力（多显示器 / 混合 DPI）。
 *
 * 语义边界（务必遵守，Electron/Tauri 主进程参考实现见 docs/window-placement.md）：
 * - 启动期摆放必须在**主进程首帧之前**完成（渲染层来不及），本契约只覆盖
 *   用户触发的重摆（如“移动到其他屏幕”）与失配自愈；
 * - 目标屏一律取**光标所在屏**，取不到回退主屏；
 * - 尺寸按目标屏 scale 换算为物理像素，钳制到 workArea × workAreaRatio；
 * - 窗口最大化/全屏时一切摆放操作应为 no-op。
 */
export interface WindowPlacement {
  /** 按光标所在显示器钳制尺寸并在 workArea 内居中 */
  placeToCursorDisplay(options?: DesiredWindowBounds): Promise<void>
  /**
   * 强制 webview 与窗口边界重新同步：以当前矩形重申一次 setBounds / set_size。
   * 这是 WebView2 混合 DPI 的特有 workaround——窗口换屏后不重算 DPI，
   * CSS 视口比窗口客户区宽，`margin: 0 auto` 的内容列会视觉偏右、右缘被裁。
   * 语义不是 resize，勿挪作他用。
   */
  resyncBounds(): Promise<void>
  /** 显示器指标变化（改缩放/插拔屏）订阅，返回取消订阅函数；宿主可不实现 */
  onDisplayMetricsChanged?(listener: (event: DisplayMetricsChangedEvent) => void): () => void
}

/**
 * 浏览器 no-op 实现：单窗口无多屏概念。
 * 桌面宿主（Electron/Tauri）必须注入真实实现，参考 docs/window-placement.md。
 */
export function createWebWindowPlacement(): WindowPlacement {
  return {
    placeToCursorDisplay: () => Promise.resolve(),
    resyncBounds: () => Promise.resolve(),
  }
}
