#!/usr/bin/env node
/**
 * check-icons —— UxKit 图标纪律校验（红线 13 / 14 的 CI 执行点）
 *
 * 红线 13 禁止不同语义使用相同图标：
 *   C1  同一 iconId 只能有一个语义（注册表 key 唯一，JSON 天然保证，仅校验语义列唯一）
 *   C2  禁止同形异义：任意两个图标的 paths 完全相同即失败（相同图形绑定了不同语义）
 *   C3  禁止同义双形：任意两个图标的 semantic 完全相同即失败（一个语义用了两个图标）
 *
 * 红线 14 禁止易困惑图标（方向性黑名单）：
 *   C4  act-close 的语义必须是"关闭/清除"，禁止承担删除语义
 *   C5  "删除/移除数据"语义必须用 act-delete（垃圾桶），禁止借用 ×/其他图标
 *   C6  "查找/搜索"语义必须用 act-search；"保存"语义必须用 act-save
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const REGISTRY = join(here, '..', 'packages', 'components', 'src', 'icon', 'registry.json')

const VALID_CATEGORIES = new Set(['obj', 'act', 'st'])

const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'))
const entries = Object.entries(registry)
const errors = []

// C1：category 合法性 + semantic 存在
for (const [id, entry] of entries) {
  if (!VALID_CATEGORIES.has(entry.category)) {
    errors.push(`C1  ${id}: category 非法（${entry.category}），应为 obj/act/st`)
  }
  if (!entry.semantic || !entry.semantic.trim()) {
    errors.push(`C1  ${id}: 缺少 semantic 语义描述`)
  }
  if (!Array.isArray(entry.paths) || entry.paths.length === 0) {
    errors.push(`C1  ${id}: 缺少 paths`)
  }
}

// C2：同形异义（paths 完全相同）
const byShape = new Map()
for (const [id, entry] of entries) {
  const key = JSON.stringify(entry.paths)
  if (!byShape.has(key)) byShape.set(key, [])
  byShape.get(key).push(id)
}
for (const ids of byShape.values()) {
  if (ids.length > 1) {
    errors.push(`C2  同形异义：${ids.join(' / ')} 使用了完全相同的图形（红线 13）`)
  }
}

// C3：同义双形（semantic 相同）
const bySemantic = new Map()
for (const [id, entry] of entries) {
  const key = entry.semantic.trim()
  if (!bySemantic.has(key)) bySemantic.set(key, [])
  bySemantic.get(key).push(id)
}
for (const [semantic, ids] of bySemantic.entries()) {
  if (ids.length > 1) {
    errors.push(`C3  同义双形："${semantic}" 被 ${ids.join(' / ')} 重复绑定（红线 13）`)
  }
}

// C4–C6：方向性黑名单
const close = registry['act-close']
if (close && !/关闭|清除/.test(close.semantic)) {
  errors.push(`C4  act-close 语义应为"关闭/清除"，当前为"${close.semantic}"（红线 14）`)
}
for (const [id, entry] of entries) {
  const s = entry.semantic
  if (/删除/.test(s) && !/delete|trash/.test(id)) {
    errors.push(`C5  "${s}" 语义必须用 act-delete（垃圾桶），当前 id=${id}（红线 14）`)
  }
  if (/查找|搜索/.test(s) && !/search/.test(id)) {
    errors.push(`C6  "${s}" 语义必须用 act-search，当前 id=${id}（红线 14）`)
  }
  if (/保存/.test(s) && !/save/.test(id)) {
    errors.push(`C6  "${s}" 语义必须用 act-save，当前 id=${id}（红线 14）`)
  }
}

if (errors.length > 0) {
  console.error(`\n✗ check-icons 失败：${errors.length} 处违规\n`)
  for (const e of errors) console.error(`  ${e}\n`)
  process.exit(1)
}

console.log(`✓ check-icons 通过：${entries.length} 个图标，语义/形状均唯一且无易困惑项`)
