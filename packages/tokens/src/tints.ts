/**
 * 着色表面色板（tinted surface palette，改进提案 P2-3 设计评审先行）。
 *
 * 设计约定（事实源：docs/UxKit-设计方案.md §4.6）：
 * - token 层只定义**结构**（--ux-tint-{name}-surface / -deep / -fg / -opaque），
 *   色值由消费者经 registerTint() 运行时注入——业务配色不落样式文件，
 *   不绕过 CI R1「裸色值禁止」与「dark 适配仅限 semantic.css」两条红线。
 * - 注册时强制 AA 校验：fg 对 surface / deep / opaque 三对均需 ≥ 4.5:1（WCAG 2.1 AA）。
 * - 未注册的 tint 消费回退：`var(--ux-tint-x-surface, var(--ux-bg-panel))` 惯例。
 */

export interface TintDefinition {
  /** 常规表面（便签/卡片底色） */
  surface: string
  /** 深色变体（按下态 / 凹陷区 / 页脚） */
  deep: string
  /** 正文前景色（对 surface / deep / opaque 均需 AA） */
  fg: string
  /** 不透明副选/强调底（选中态 chip 等） */
  opaque: string
}

export interface TintContrastCheck {
  /** 校验对，如 "fg vs surface" */
  pair: string
  /** 对比度比值（保留 2 位小数） */
  ratio: number
  /** 是否达到 AA（≥4.5:1） */
  pass: boolean
}

export interface TintContrastReport {
  ok: boolean
  checks: TintContrastCheck[]
}

const HEX_RE = /^#(?:([0-9a-fA-F]{3})|([0-9a-fA-F]{6}))$/

/** 解析 hex（#rgb / #rrggbb）为 0~1 线性化前的 sRGB 分量 */
function parseHex(hex: string): [number, number, number] {
  const m = hex.trim().match(HEX_RE)
  if (!m) throw new Error(`无法解析颜色（仅支持 #rgb / #rrggbb）：${hex}`)
  const h = m[1] ?? m[2]
  const full =
    m[1]
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number]
}

/** WCAG 相对亮度 */
function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 对比度（1~21，保留 2 位小数） */
export function tintContrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
  return Math.round(ratio * 100) / 100
}

/** AA 阈值（WCAG 2.1 普通文本） */
export const TINT_AA_RATIO = 4.5

/**
 * 校验一组 tint 定义：fg 对 surface / deep / opaque 三对均需 ≥ AA。
 * 报告 always 全量返回（不短路），便于一次看到所有不达标对。
 */
export function checkTintContrast(tint: TintDefinition): TintContrastReport {
  const checks: TintContrastCheck[] = (
    [
      ['fg vs surface', tint.fg, tint.surface],
      ['fg vs deep', tint.fg, tint.deep],
      ['fg vs opaque', tint.fg, tint.opaque],
    ] as const
  ).map(([pair, fg, bg]) => {
    const ratio = tintContrast(fg, bg)
    return { pair, ratio, pass: ratio >= TINT_AA_RATIO }
  })
  return { ok: checks.every((c) => c.pass), checks }
}

/** 已注册的 tint 名（供调试与文档工具枚举） */
const registered = new Set<string>()
let styleEl: HTMLStyleElement | null = null

/**
 * 注册一组着色表面：生成 `--ux-tint-{name}-surface/-deep/-fg/-opaque` 四个 CSS 变量。
 * - light / dark 各一套（dark 缺省复用 light——仅当浅深两套都达 AA 时才建议省略）；
 * - validate（默认 true）不达标直接抛错，错误信息携带各对比对数值；
 * - 同名重复注册覆盖（热更新/主题编辑器场景）。
 */
export function registerTint(
  name: string,
  light: TintDefinition,
  dark?: TintDefinition,
  options?: { validate?: boolean },
): void {
  const validate = options?.validate ?? true
  if (validate) {
    const report = checkTintContrast(light)
    if (!report.ok) {
      throw new Error(
        `tint "${name}"（light）未达 AA 4.5:1：` +
          report.checks
            .filter((c) => !c.pass)
            .map((c) => `${c.pair} = ${c.ratio}`)
            .join('；'),
      )
    }
    if (dark) {
      const darkReport = checkTintContrast(dark)
      if (!darkReport.ok) {
        throw new Error(
          `tint "${name}"（dark）未达 AA 4.5:1：` +
            darkReport.checks
              .filter((c) => !c.pass)
              .map((c) => `${c.pair} = ${c.ratio}`)
              .join('；'),
        )
      }
    }
  }

  const varName = (suffix: string): string => `--ux-tint-${name}-${suffix}`
  const block = (t: TintDefinition): string =>
    [
      `${varName('surface')}: ${t.surface}`,
      `${varName('deep')}: ${t.deep}`,
      `${varName('fg')}: ${t.fg}`,
      `${varName('opaque')}: ${t.opaque}`,
    ].join('; ')

  const css = dark
    ? `:root { ${block(light)} }\n.dark { ${block(dark)} }\n`
    : `:root { ${block(light)} }\n`

  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.setAttribute('data-ux-tints', '')
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = css
  registered.add(name)
}

/** 测试/热重载用：清空全部注册 */
export function resetTints(): void {
  registered.clear()
  if (styleEl) {
    styleEl.remove()
    styleEl = null
  }
}

/** 枚举已注册 tint 名 */
export function listTints(): string[] {
  return [...registered]
}
