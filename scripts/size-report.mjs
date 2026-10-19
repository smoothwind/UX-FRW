#!/usr/bin/env node
/**
 * size-report —— 统计各包 dist 产物尺寸（raw / gzip），作为 M6「包体积不增」验收基线工具。
 * 用法：先 pnpm build，再 pnpm size。
 *   --check   体积超出预算（scripts/size-budget.json + 余量）时 exit 1
 *   --update  以当前产物刷新预算基准
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const PACKAGES_DIR = join(ROOT, 'packages')
const BUDGET_PATH = join(ROOT, 'scripts', 'size-budget.json')
/** 允许的 gzip 波动余量（含平台差异），超出须 --update 显式扩容 */
const ALLOWANCE = 2048

const args = new Set(process.argv.slice(2))

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

const rows = []
let totalRaw = 0
let totalGzip = 0

for (const name of readdirSync(PACKAGES_DIR)) {
  const dist = join(PACKAGES_DIR, name, 'dist')
  let files
  try {
    files = walk(dist)
  } catch {
    continue
  }
  for (const file of files) {
    const raw = statSync(file).size
    const gzip = gzipSync(readFileSync(file)).length
    totalRaw += raw
    totalGzip += gzip
    rows.push({
      file: `${name}/dist/${file.slice(dist.length + 1)}`,
      raw,
      gzip,
    })
  }
}

const fmt = (n) => `${(n / 1024).toFixed(2)} kB`
const pad = (s, n) => String(s).padEnd(n)

console.log('\nUxKit 产物体积（pnpm build 后）\n')
console.log(`${pad('文件', 44)}${pad('raw', 12)}gzip`)
console.log('-'.repeat(68))
for (const r of rows) {
  console.log(`${pad(r.file, 44)}${pad(fmt(r.raw), 12)}${fmt(r.gzip)}`)
}
console.log('-'.repeat(68))
console.log(`${pad('合计', 44)}${pad(fmt(totalRaw), 12)}${fmt(totalGzip)}\n`)

const saveBudget = () => {
  writeFileSync(BUDGET_PATH, `${JSON.stringify({ totalGzip }, null, 2)}\n`)
  console.log(`预算已更新：totalGzip=${totalGzip} → ${relative(ROOT, BUDGET_PATH)}`)
}

let budget
try {
  budget = JSON.parse(readFileSync(BUDGET_PATH, 'utf8'))
} catch {
  budget = null
}

if (args.has('--update')) {
  saveBudget()
} else if (args.has('--check')) {
  if (!budget || typeof budget.totalGzip !== 'number') {
    console.error(`未找到预算基准，请先运行 pnpm size --update（${relative(BUDGET_PATH)}）`)
    process.exit(1)
  }
  const over = totalGzip - budget.totalGzip
  if (over > ALLOWANCE) {
    console.error(
      `体积红线超限：gzip ${fmt(over - ALLOWANCE)} 超出预算 ${fmt(budget.totalGzip)} + 余量 ${fmt(ALLOWANCE)}。` +
        '确认合理后运行 pnpm size --update 扩容基准。',
    )
    process.exit(1)
  }
  console.log(`体积红线通过：gzip ${fmt(totalGzip)} ≤ 预算 ${fmt(budget.totalGzip)} + 余量 ${fmt(ALLOWANCE)}`)
}
