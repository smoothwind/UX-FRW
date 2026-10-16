#!/usr/bin/env node
/**
 * check-i18n —— UxKit 国际化一致性校验
 *
 * I1  同一 locales 目录内的所有 locale 文件，叶子 key 集合必须完全一致
 *     （禁止某个语言缺 key 或多 key）。
 * 约定：语言包放在任意包的 locales 目录下，文件名为 <locale>.json（如 zh-CN.json / en.json）。
 * 无 locales 目录时直接通过（渐进式接入）。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['packages', 'apps']
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.vite', 'coverage'])

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
    } else if (name.endsWith('.json')) {
      out.push(full)
    }
  }
  return out
}

function leaves(node, prefix = '', out = []) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) leaves(value, path, out)
    else out.push(path)
  }
  return out
}

const files = SCAN_DIRS.flatMap((d) => {
  try {
    return walk(join(ROOT, d))
  } catch {
    return []
  }
})

const groups = new Map()
for (const file of files) {
  const dir = dirname(file)
  if (!dir.endsWith(`${sep}locales`) && !dir.endsWith('/locales')) continue
  const locale = file.slice(file.lastIndexOf(sep) + 1, -'.json'.length)
  if (!groups.has(dir)) groups.set(dir, [])
  groups.get(dir).push({ locale, file })
}

if (groups.size === 0) {
  console.log('✓ check-i18n 通过：未发现 locales 目录（跳过）')
  process.exit(0)
}

const errors = []
let localeCount = 0

for (const [dir, entries] of groups) {
  if (entries.length < 2) {
    const only = entries[0]
    errors.push(
      `I1  ${relative(ROOT, dir)} 只有 ${only.locale} 一个语言包，至少需要两个语言才能校验一致性`,
    )
    continue
  }
  const parsed = entries.map((e) => {
    localeCount++
    let json
    try {
      json = JSON.parse(readFileSync(e.file, 'utf8'))
    } catch (error) {
      errors.push(`I1  ${relative(ROOT, e.file)} JSON 解析失败：${error.message}`)
      json = {}
    }
    return { locale: e.locale, keys: new Set(leaves(json)) }
  })

  const union = new Set()
  for (const p of parsed) for (const k of p.keys) union.add(k)

  for (const p of parsed) {
    const missing = [...union].filter((k) => !p.keys.has(k))
    if (missing.length > 0) {
      errors.push(
        `I1  ${relative(ROOT, dir)} / ${p.locale} 缺少 ${missing.length} 个 key：\n` +
          missing.map((k) => `        ${k}`).join('\n'),
      )
    }
  }
}

if (errors.length > 0) {
  console.error(`\n✗ check-i18n 失败：${errors.length} 处不一致\n`)
  for (const e of errors) console.error(`  ${e}\n`)
  console.error('修复方式：补齐缺失的 key，确保所有语言包叶子 key 完全对齐。')
  process.exit(1)
}

console.log(`✓ check-i18n 通过：${groups.size} 组、${localeCount} 个语言包，key 完全对齐`)
