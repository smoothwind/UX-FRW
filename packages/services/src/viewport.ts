/**
 * viewport.ts — 渲染视口健康自检（dev 诊断）。
 *
 * 背景：多显示器/混合 DPI 下，主进程窗口摆放若缺少“按屏钳制 + show 后重申”，
 * WebView2 会出现窗口几何与渲染视口失配——CSS 视口比窗口客户区宽，
 * `margin: 0 auto` 的内容列视觉偏右、右缘被裁，用户感知为“UI 排版 bug”，
 * 实际根因在主进程。本模块在开发期把这类问题提前暴露为 console 告警。
 */

export interface ViewportHealthReport {
  /** 无任何 issue 时为 true */
  healthy: boolean
  /** CSS 布局视口宽度（window.innerWidth） */
  innerWidth: number
  /** 窗口外框宽度（浏览器进程上报的真实窗口尺寸） */
  outerWidth: number
  /** 文档客户区宽度（扣除滚动条） */
  clientWidth: number
  /** 渲染缩放比 */
  devicePixelRatio: number
  /** 发现的问题描述；空数组 = 健康 */
  issues: string[]
}

/**
 * 单次自检。启发式判定（均为 dev 提示，不作运行时依据）：
 * - innerWidth > outerWidth：渲染视口比窗口还宽 → 窗口几何与渲染层失配
 *   （混合 DPI 换屏后未重算的典型症状，检查主进程摆放/重申逻辑）；
 * - innerWidth > clientWidth：文档存在水平溢出（横向滚动条/超宽元素），属前端布局问题；
 * - devicePixelRatio 非法：渲染缩放信息异常。
 */
export function checkViewportHealth(): ViewportHealthReport {
  const innerWidth = window.innerWidth
  const outerWidth = window.outerWidth
  const clientWidth = document.documentElement.clientWidth
  const devicePixelRatio = window.devicePixelRatio
  const issues: string[] = []
  if (outerWidth > 0 && innerWidth > outerWidth + 1) {
    issues.push(
      `[viewport-health] 渲染视口(${innerWidth}px)比窗口(${outerWidth}px)还宽：` +
        '窗口几何与渲染层失配（混合 DPI 典型症状），请检查主进程窗口摆放/resyncBounds 逻辑',
    )
  }
  // 经典滚动条常态占 ~15-17px（innerWidth 含滚动条、clientWidth 不含），留 20px 容差，
  // 扣除后仍超宽才判定为真实水平溢出
  if (innerWidth > clientWidth + 20) {
    issues.push(
      `[viewport-health] 文档存在水平溢出：innerWidth(${innerWidth}) > clientWidth(${clientWidth})，` +
        '请检查超宽元素/滚动容器（属前端布局问题，与窗口无关）',
    )
  }
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) {
    issues.push(`[viewport-health] devicePixelRatio 非法：${devicePixelRatio}`)
  }
  return {
    healthy: issues.length === 0,
    innerWidth,
    outerWidth,
    clientWidth,
    devicePixelRatio,
    issues,
  }
}

export interface ViewportHealthWatchOptions {
  /** 额外轮询间隔 ms（resize 监听始终开启）；0 或缺省表示不轮询 */
  intervalMs?: number
  /**
   * 自定义上报；缺省 console.warn。仅在新问题签名首次出现时触发，
   * 第一参数为新增问题，第二参数为完整报告。
   */
  onReport?: (freshIssues: string[], report: ViewportHealthReport) => void
}

/**
 * 安装持续自检：resize 后延迟一帧复查（WM_DPICHANGED 后布局可能晚于事件），
 * 同一问题签名只告警一次，恢复健康后重置签名。返回卸载函数。
 */
export function installViewportHealthWatch(options: ViewportHealthWatchOptions = {}): () => void {
  const { intervalMs = 0 } = options
  const onReport =
    options.onReport ?? ((fresh: string[]) => console.warn(fresh.join('\n')))
  const seen = new Set<string>()
  let timer: ReturnType<typeof setInterval> | null = null
  let frame = 0

  function run(): void {
    const report = checkViewportHealth()
    const fresh = report.issues.filter((issue) => !seen.has(issue))
    for (const issue of report.issues) seen.add(issue)
    if (report.issues.length === 0) seen.clear()
    else if (fresh.length > 0) onReport(fresh, report)
  }

  function onResize(): void {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(run)
  }

  window.addEventListener('resize', onResize)
  if (intervalMs > 0) timer = setInterval(run, intervalMs)
  run()

  return () => {
    window.removeEventListener('resize', onResize)
    if (timer !== null) clearInterval(timer)
    cancelAnimationFrame(frame)
    seen.clear()
  }
}
