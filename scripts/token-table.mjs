#!/usr/bin/env node
/**
 * token 参考表自动生成（改进提案 P3-3，token 表构建产物零手工）。
 *
 * 扫描 @ux/tokens 三个 CSS 源文件中的 `--ux-*` 自定义属性，
 * 按文件 + 选择器上下文生成分组 Markdown 表写入 docs/generated/token-table.md。
 * 该文件为构建产物，禁止手工编辑（首行有警示）；重新生成：`pnpm tokens:table`。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = [
  ['primitives.css', 'Tier 1 · 基础层（primitives，业务代码禁用）'],
  ['semantic.css', 'Tier 2 · 语义层（semantic，组件与业务唯一颜色层）'],
  ['layout.css', 'Tier 3 · 布局与尺寸（layout）'],
]
const OUT = join(ROOT, 'docs', 'generated', 'token-table.md')

const VAR_RE = /^\s*(--ux-[\w-]+)\s*:\s*([^;]+);(.*)$/
const SEL_RE = /^([^/{]+)\{?\s*$/

/** 解析单个 CSS 文件：返回 [{ selector, vars: [{name, value, note}] }] */
function parseFile(file) {
  const lines = readFileSync(join(ROOT, 'packages', 'tokens', 'src', file), 'utf8').split(/\r?\n/)
  const groups = []
  let current = null
  let selector = '(文件顶层)'
  let atRule = null
  let depth = 0

  for (const line of lines) {
    const varMatch = line.match(VAR_RE)
    if (depth > 0 && varMatch) {
      if (!current) groups.push((current = { selector, vars: [] }))
      // 行尾注释（如 /* 说明 */）作为备注；tokens-exempt 与生成无关
      const note = (varMatch[3].match(/\/\*\s*(.*?)\s*\*\//) ?? [])[1] ?? ''
      current.vars.push({ name: varMatch[1], value: varMatch[2].trim(), note })
      continue
    }
    const open = line.includes('{')
    const close = line.includes('}')
    if (open) {
      const selMatch = line.match(SEL_RE)
      const inner = selMatch ? selMatch[1].trim() : selector
      selector = inner.startsWith('@') ? inner : atRule ? `${atRule} → ${inner}` : inner
      if (inner.startsWith('@')) atRule = inner
      if (!current) groups.push((current = { selector, vars: [] }))
      else if (current.selector !== selector) groups.push((current = { selector, vars: [] }))
      depth++
    } else if (close && depth > 0) {
      depth--
      if (depth === 0) {
        current = null
        atRule = null
        selector = '(文件顶层)'
      }
    }
  }
  return groups.filter((g) => g.vars.length > 0)
}

let total = 0
const sections = []

for (const [file, title] of SRC) {
  const groups = parseFile(file)
  let body = `## ${title}\n\n来源：\`packages/tokens/src/${file}\`（构建时解析，勿手工编辑本表）\n`
  for (const g of groups) {
    body += `\n### ${g.selector}\n\n| 令牌 | 值 | 备注 |\n|------|----|------|\n`
    for (const v of g.vars) {
      body += `| \`${v.name}\` | \`${v.value}\` | ${v.note} |\n`
      total++
    }
  }
  sections.push(body)
}

const header = `<!-- 该文件由 scripts/token-table.mjs 自动生成（pnpm tokens:table），禁止手工编辑 -->
# UxKit 设计令牌参考表

> 自动生成于构建时，事实源是 \`packages/tokens/src/*.css\`；本文只是按「层 × 选择器」展开的只读视图。
> 消费规则（哪层给谁用、暗色只翻语义层）见 [PRINCIPLES.md](../PRINCIPLES.md) 与设计方案 §4。

合计 ${total} 个令牌。

`

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, header + sections.join('\n---\n\n') + '\n', 'utf8')
console.log(`✓ token 参考表已生成：docs/generated/token-table.md（${total} 个令牌）`)
