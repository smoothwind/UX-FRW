#!/usr/bin/env node
/**
 * check-tokens —— UxKit 令牌纪律校验（源自 MdReader scripts/check-tokens.mjs 实践）
 *
 * R1  禁止裸颜色字面量（hex / rgb() / rgba() / hsl() / hsla()）。
 *     设计令牌包（packages/tokens）除外；文件级或行级 `tokens-exempt` 注释可豁免
 *     （用于图表/画布等"数据配色"场景）。
 * R2  margin/padding/gap 禁止 px 字面量，必须使用 --ux-sp-*（0 / var() / calc() 除外）。
 * R3  z-index / border-radius / font-size / box-shadow 禁止字面量，必须使用令牌。
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
}

if (violations.length > 0) {
  console.error(`\n✗ check-tokens 失败：${violations.length} 处违规\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}] ${v.label}`)
    console.error(`    ${v.text}\n`)
  }
  console.error('修复方式：改用 var(--ux-*) 令牌；确属数据配色可加行内注释 tokens-exempt 豁免。')
  process.exit(1)
}

console.log(`✓ check-tokens 通过：扫描 ${files.length} 个文件，令牌纪律合规`)
