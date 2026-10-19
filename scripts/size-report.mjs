#!/usr/bin/env node
/**
 * size-report —— 统计各包 dist 产物尺寸（raw / gzip），作为 M6「包体积不增」验收基线工具。
 * 用法：先 pnpm build，再 pnpm size。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const ROOT = process.cwd()
const PACKAGES_DIR = join(ROOT, 'packages')

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
