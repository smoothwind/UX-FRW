#!/usr/bin/env node
/**
 * check-shortcuts —— UxKit 快捷键纪律校验
 *
 * S1  重复键位（错误）：同一规范键序被两个命令/组件绑定（首个独占原则）。
 * S2  保留键位（警告）：命中浏览器/系统保留键位（Ctrl+C/V/X/A/Z/Y/F/P/W/T/N、F5/F11/F12），
 *     会劫持宿主行为；确需使用可加行内 `shortcut-exempt` 豁免。
 *
 * 静态扫描 `shortcut:` / `hotkey:` 字符串字面量；运行时冲突由
 * services 的 findShortcutIssues() 兜底（动态注册只有运行时可见）。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['packages', 'apps']
const EXTS = new Set(['.vue', '.ts', '.tsx', '.js', '.mjs'])
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.vite', 'coverage'])
const EXEMPT_MARK = 'shortcut-exempt'

const MOD_ALIASES = {
  ctrl: 'Ctrl',
  control: 'Ctrl',
  shift: 'Shift',
  alt: 'Alt',
  option: 'Alt',
  meta: 'Meta',
  cmd: 'Meta',
  win: 'Meta',
}
const KEY_ALIASES = {
  esc: 'Escape',
  escape: 'Escape',
  enter: 'Enter',
  return: 'Enter',
  space: 'Space',
  tab: 'Tab',
  backspace: 'Backspace',
  delete: 'Delete',
  del: 'Delete',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
}
const MOD_ORDER = ['Ctrl', 'Shift', 'Alt', 'Meta']
const RESERVED = [
  'Ctrl+C',
  'Ctrl+V',
  'Ctrl+X',
  'Ctrl+A',
  'Ctrl+Z',
  'Ctrl+Y',
  'Ctrl+F',
  'Ctrl+P',
  'Ctrl+W',
  'Ctrl+T',
  'Ctrl+N',
  'F5',
  'F11',
  'F12',
]

function normalizeKey(raw) {
  const lower = raw.toLowerCase()
  if (KEY_ALIASES[lower]) return KEY_ALIASES[lower]
  if (raw.length === 1) return raw.toUpperCase()
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function normalize(input) {
  const parts = input.split('+').map((p) => p.trim()).filter(Boolean)
  const mods = new Set()
  let key = ''
  for (const part of parts) {
    const alias = MOD_ALIASES[part.toLowerCase()]
    if (alias) mods.add(alias)
    else key = normalizeKey(part)
  }
  const modStr = MOD_ORDER.filter((m) => mods.has(m)).join('+')
  return modStr ? `${modStr}+${key}` : key
}

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

const LITERAL_RE = /\b(?:shortcut|hotkey)\s*:\s*'([^']+)'/g

const files = SCAN_DIRS.flatMap((d) => {
  try {
    return walk(join(ROOT, d))
  } catch {
    return []
  }
})

const occurrences = []
for (const file of files) {
  let lines
  try {
    lines = readFileSync(file, 'utf8').split(/\r?\n/)
  } catch {
    continue
  }
  lines.forEach((line, i) => {
    if (line.includes(EXEMPT_MARK)) return
    LITERAL_RE.lastIndex = 0
    let m
    while ((m = LITERAL_RE.exec(line))) {
      occurrences.push({ combo: normalize(m[1]), raw: m[1], file: relative(ROOT, file), line: i + 1 })
    }
  })
}

const errors = []
const warnings = []

const byCombo = new Map()
for (const occ of occurrences) {
  byCombo.set(occ.combo, [...(byCombo.get(occ.combo) ?? []), occ])
}
for (const [combo, list] of byCombo) {
  if (list.length > 1) {
    errors.push(
      `S1  键位 ${combo} 被绑定 ${list.length} 次：\n` +
        list.map((o) => `        ${o.file}:${o.line}  '${o.raw}'`).join('\n'),
    )
  }
}
for (const occ of occurrences) {
  if (RESERVED.includes(occ.combo)) {
    warnings.push(`S2  使用保留键位 ${occ.combo}  ${occ.file}:${occ.line}`)
  }
}

if (errors.length > 0) {
  console.error(`\n✗ check-shortcuts 失败：${errors.length} 处冲突\n`)
  for (const e of errors) console.error(`  ${e}\n`)
  console.error('修复方式：为命令分配独占键位；确需复用可加行内注释 shortcut-exempt 豁免。')
  process.exit(1)
}

if (warnings.length > 0) {
  console.warn(`⚠ check-shortcuts 警告：${warnings.length} 处保留键位（不阻断）`)
  for (const w of warnings) console.warn(`  ${w}`)
}

console.log(
  `✓ check-shortcuts 通过：扫描 ${files.length} 个文件，${occurrences.length} 处快捷键声明，无重复占用`,
)
