#!/usr/bin/env node
/**
 * check-tokens —— UxKit 令牌纪律校验（源自 MdReader scripts/check-tokens.mjs 实践）
 *
 * R1  禁止裸颜色字面量（hex / rgb() / rgba() / hsl() / hsla()）。
 *     设计令牌包（packages/tokens）除外；文件级或行级 `tokens-exempt` 注释可豁免
 *     （用于图表/画布等"数据配色"场景）。
 * R2  margin/padding/gap 禁止 px 字面量，必须使用 --ux-sp-*（0 / var() / calc() 除外）。
 * R3  z-index / border-radius / font-size / box-shadow 禁止字面量，必须使用令牌。
 * R3+ 断点登记（移动端规范 §3.1）：媒体查询中的宽度字面量只允许是登记值
 *     （--ux-bp-sm/md/lg = 600/960/1280，或其 max-width 等价写法 599.98/959.98/1279.98）
 *     与 0px；layout.css 是登记处。其余宽度断点 = 违规，行级 `tokens-exempt` 豁免。
 * R4  行级选中禁止铺实心主色：行/列表项/表格行（`*__row` / `tr` / `role=row|option|treeitem|…`）
 *     只用 `--ux-accent-subtle` 底 + `--ux-accent-fg` 字；`--ux-bg-selected`（实心主色）
 *     保留给控件级选中（按钮/页签/分段控件）。对齐 UxTree / UxSegmented 既有惯例。
 * R5  backdrop-filter 禁止裸值（blur()/saturate() 等），必须消费 --ux-material-* /
 *     --ux-frost-* 材质与特效令牌（改进提案 P2-1 修订版，设计方案 §4.5）。
 * R6  触控目标（移动端规范 §3.2/§10）：`pointer: coarse` 作用域内 height 禁止
 *     24/28/32px 桌面档字面量回潮，必须消费 --ux-control-h-* / --ux-row-h 触控档。
 *
 * 实现要点：先剥离 var(...) 引用，再对剩余字面量判定，避免变量引用被误报。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['packages', 'apps']
const EXTS = new Set(['.vue', '.css', '.scss', '.ts', '.tsx', '.js', '.mjs'])
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.vite', 'coverage'])
const EXEMPT_MARK = 'tokens-exempt'

const VAR_RE = /var\([^()]*(?:\([^()]*\)[^()]*)*\)/g
const KEYWORD_VALUES = /^(none|inherit|unset|initial|auto|revert|0|0px|\s)*$/i

function stripVars(text) {
  return text.replace(VAR_RE, ' ')
}

function hasNonZeroPx(text) {
  const matches = text.match(/(\d+(?:\.\d+)?)px/gi) ?? []
  return matches.some((m) => parseFloat(m) !== 0)
}

const SPACING_PROP_RE =
  /\b(margin|padding|gap)(?:-(?:top|right|bottom|left|block|block-start|block-end|inline|inline-start|inline-end))?\s*:\s*([^;}]+)/gi

const SIZE_PROP_RE =
  /\b(z-index|border-radius|font-size|box-shadow)\s*:\s*([^;}]+)/gi

/* R5：backdrop-filter 只准消费 --ux-material-* / --ux-frost-*（var() 引用先剥离再判定） */
const BACKDROP_PROP_RE = /(?:-webkit-)?backdrop-filter\s*:\s*([^;}]+)/gi

const R1_RE = /#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(\s*[^)]*\)/

const rules = [
  {
    code: 'R1',
    label: 'R1 裸颜色字面量',
    test: (code) => R1_RE.test(code),
  },
  {
    code: 'R2',
    label: 'R2 间距必须走令牌',
    test: (code) => {
      SPACING_PROP_RE.lastIndex = 0
      let m
      while ((m = SPACING_PROP_RE.exec(code))) {
        const value = stripVars(m[2])
        if (hasNonZeroPx(value)) return true
      }
      return false
    },
  },
  {
    code: 'R3',
    label: 'R3 层级/圆角/字号/阴影必须走令牌',
    test: (code) => {
      SIZE_PROP_RE.lastIndex = 0
      let m
      while ((m = SIZE_PROP_RE.exec(code))) {
        const value = stripVars(m[2]).trim()
        if (!value) continue
        if (KEYWORD_VALUES.test(value)) continue
        return true
      }
      return false
    },
  },
  {
    code: 'R5',
    label: 'R5 背板模糊必须走材质/特效令牌',
    test: (code) => {
      BACKDROP_PROP_RE.lastIndex = 0
      let m
      while ((m = BACKDROP_PROP_RE.exec(code))) {
        const value = stripVars(m[2]).trim()
        if (!value || KEYWORD_VALUES.test(value)) continue
        // 剥掉 var() 后残留 blur()/saturate() 等裸函数 = 绕过材质通道的裸值
        if (/(blur|saturate|brightness|contrast)\s*\(/i.test(value)) return true
      }
      return false
    },
  },
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(full, out)
    } else if (EXTS.has(name.slice(name.lastIndexOf('.')))) {
      out.push(full)
    }
  }
  return out
}

function isTokensPackage(file) {
  const rel = relative(ROOT, file)
  return rel.startsWith(`packages${sep}tokens`) || rel.startsWith('packages/tokens')
}

/* ---------- R4：行级选中禁用实心主色 ---------- */

const BG_DECL_RE = /background(?:-color)?\s*:\s*([^;}]+)/gi
const ROWISH_RE = /(__row\b|[-_]row\b|\btr\b|\brole=["']?(row|option|treeitem|menuitem|menuitemcheckbox|menuitemradio|listitem)["']?\]?)/i
const SELECTED_RE = /(is-selected|aria-selected|aria-checked)/i
const CONTROLISH_RE = /(__btn\b|\bbtn\b|__chip\b|\bchip\b|\bbadge\b|\bswitch\b|\bradio\b|__tab\b|\btoggle\b|\bcheckbox\b)/i

/** 抽取 .vue 的 <style> 内容；非样式区域替换为等量换行，保证行号与原文件一致 */
function extractStyleText(content, file) {
  if (!file.endsWith('.vue')) return content
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi
  let out = ''
  let last = 0
  let m
  const blank = (text) => text.replace(/[^\n]/g, '')
  while ((m = re.exec(content))) {
    out += blank(content.slice(last, m.index)) + m[1]
    last = m.index + m[0].length
  }
  return out + blank(content.slice(last))
}

function isRowSelectionSelector(selector) {
  const sel = selector.replace(/\s+/g, ' ').trim()
  if (!sel) return false
  if (CONTROLISH_RE.test(sel) && !ROWISH_RE.test(sel)) return false
  if (ROWISH_RE.test(sel)) return true
  return SELECTED_RE.test(sel) && !CONTROLISH_RE.test(sel)
}

/** 单遍扫描样式块：跟踪选择器栈，命中 `background: var(--ux-bg-selected)` 即按选择器判定 */
function checkRowSelection(content, file) {
  const css = extractStyleText(content, file)
  const hits = []
  const stack = []
  let buf = ''
  let line = 1
  let declLine = 1
  for (let i = 0; i < css.length; i++) {
    const ch = css[i]
    if (ch === '\n') line++
    if (ch === '{') {
      stack.push(buf.trim())
      buf = ''
      declLine = line
    } else if (ch === '}') {
      if (buf.trim()) hits.push({ selector: stack.join(' '), decl: buf, line: declLine })
      buf = ''
      stack.pop()
      declLine = line
    } else {
      buf += ch
    }
  }
  return hits
    .filter((hit) => {
      BG_DECL_RE.lastIndex = 0
      let m
      let usesSolid = false
      while ((m = BG_DECL_RE.exec(hit.decl))) {
        if (m[1].includes('--ux-bg-selected')) usesSolid = true
      }
      return usesSolid && isRowSelectionSelector(hit.selector)
    })
    .map((hit) => ({
      line: hit.line,
      selector: hit.selector.replace(/\s+/g, ' ').trim(),
      text: hit.decl.replace(/\s+/g, ' ').trim(),
    }))
}

/* ---------- R3+ 断点登记 / R6 触控目标（块级媒体查询上下文扫描） ---------- */

/** 断点登记值：layout.css --ux-bp-* 与 @ux/tokens BP 双源同值（改登记必同步此处） */
const BP_REGISTERED = [600, 960, 1280]
/** 媒体查询允许的宽度字面量：登记值 + 其 max-width 等价写法（-0.02 防区间重叠）+ 0px */
const BP_ALLOWED_PX = new Set([
  '0px',
  ...BP_REGISTERED.flatMap((v) => [`${v}px`, `${(v - 0.02).toFixed(2)}px`]),
])

const MEDIA_WIDTH_PX_RE = /\(\s*(?:min|max)-width\s*:\s*([\d.]+px)\s*\)/gi
const COARSE_MEDIA_RE = /pointer\s*:\s*coarse/i
const HEIGHT_DECL_RE = /(?:^|[;{\s])height\s*:\s*([^;}]+)/gi
/** 桌面档控件/行高字面量（触控档切档后禁止回潮） */
const DESKTOP_CTRL_PX_RE = /\b(?:24|28|32)(?:\.\d+)?px\b/

/**
 * 单遍扫描样式块，跟踪 @media 栈：
 * - R3+：任何 @media 条件中的宽度字面量必须 ∈ 断点登记白名单（§3.1）；
 * - R6：祖先链含 pointer: coarse 的声明块里，height 禁桌面档字面量（§3.2/§10）。
 */
function checkResponsive(content, file) {
  const css = extractStyleText(content, file)
  const hits = []
  const stack = [] // { media?: '@media 条件'（@media 块）；sel?: 选择器（样式规则块） }
  let buf = ''
  let line = 1
  let declLine = 1
  for (let i = 0; i < css.length; i++) {
    const ch = css[i]
    if (ch === '\n') line++
    if (ch === '{') {
      const head = buf.trim()
      buf = ''
      declLine = line
      if (head.startsWith('@media')) {
        MEDIA_WIDTH_PX_RE.lastIndex = 0
        let m
        while ((m = MEDIA_WIDTH_PX_RE.exec(head))) {
          if (!BP_ALLOWED_PX.has(m[1].toLowerCase())) {
            hits.push({ line: declLine, kind: 'R3+', text: head })
          }
        }
        stack.push({ media: head })
      } else {
        stack.push({ sel: head })
      }
    } else if (ch === '}') {
      const top = stack[stack.length - 1]
      if (buf.trim() && top?.sel) {
        const selChain = stack
          .filter((e) => e.sel)
          .map((e) => e.sel)
          .join(' ')
        const inCoarse = stack.some((e) => e.media && COARSE_MEDIA_RE.test(e.media))
        if (inCoarse) {
          HEIGHT_DECL_RE.lastIndex = 0
          let m
          while ((m = HEIGHT_DECL_RE.exec(buf))) {
            if (DESKTOP_CTRL_PX_RE.test(stripVars(m[1]))) {
              hits.push({ line: declLine, kind: 'R6', text: `${selChain} { height: … }` })
            }
          }
        }
      }
      buf = ''
      stack.pop()
      declLine = line
    } else {
      buf += ch
    }
  }
  return hits
}

const files = SCAN_DIRS.flatMap((d) => {
  try {
    return walk(join(ROOT, d))
  } catch {
    return []
  }
})

const violations = []

for (const file of files) {
  if (isTokensPackage(file)) continue
  let lines
  try {
    lines = readFileSync(file, 'utf8').split(/\r?\n/)
  } catch {
    continue
  }
  const fileExempt = lines[0]?.includes(EXEMPT_MARK)

  lines.forEach((line, i) => {
    if (fileExempt || line.includes(EXEMPT_MARK)) return
    const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
    for (const rule of rules) {
      if (rule.test(code)) {
        violations.push({ file: relative(ROOT, file), line: i + 1, rule: rule.code, label: rule.label, text: line.trim() })
      }
    }
  })

  if (!fileExempt) {
    let content
    try {
      content = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const hit of checkRowSelection(content, file)) {
      if (lines[hit.line - 1]?.includes(EXEMPT_MARK)) continue
      violations.push({
        file: relative(ROOT, file),
        line: hit.line,
        rule: 'R4',
        label: 'R4 行级选中禁用实心主色（改用 --ux-accent-subtle + --ux-accent-fg）',
        text: `${hit.selector} { ${hit.text} }`,
      })
    }
    for (const hit of checkResponsive(content, file)) {
      if (lines[hit.line - 1]?.includes(EXEMPT_MARK)) continue
      violations.push({
        file: relative(ROOT, file),
        line: hit.line,
        rule: hit.kind,
        label:
          hit.kind === 'R3+'
            ? 'R3+ 媒体查询宽度字面量须为断点登记值（--ux-bp-* 600/960/1280 或 599.98/959.98/1279.98 等价写法）'
            : 'R6 触控档（pointer: coarse）height 禁 24/28/32px 字面量，改用 --ux-control-h-* / --ux-row-h',
        text: hit.text,
      })
    }
  }
}

if (violations.length > 0) {
  console.error(`\n✗ check-tokens 失败：${violations.length} 处违规\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}] ${v.label}`)
    console.error(`    ${v.text}\n`)
  }
  console.error('修复方式：改用 var(--ux-*) 令牌；确属数据配色可加行内注释 tokens-exempt 豁免。')
  console.error('规则依据：红线 1（令牌优先）— docs/UxKit-设计方案.md §5 规则 1；速查与 CI 对照见 docs/PRINCIPLES.md。')
  if (violations.some((v) => v.rule === 'R4')) {
    console.error('R4：行级选中（*__row / tr / role=row|option|treeitem|…）请改用 --ux-accent-subtle 底 + --ux-accent-fg 字。')
  }
  if (violations.some((v) => v.rule === 'R3+')) {
    console.error('R3+：断点登记制（移动端规范 §3.1）——新增断点先登记 layout.css --ux-bp-* 与 @ux/tokens BP，媒体查询只写登记值；确需例外加行内 tokens-exempt。')
  }
  if (violations.some((v) => v.rule === 'R6')) {
    console.error('R6：触控目标（移动端规范 §3.2/§10）——coarse 作用域内高度声明消费 --ux-control-h-* / --ux-row-h，禁止桌面档字面量。')
  }
  process.exit(1)
}

console.log(`✓ check-tokens 通过：扫描 ${files.length} 个文件，令牌纪律合规`)
