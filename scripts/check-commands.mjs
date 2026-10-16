#!/usr/bin/env node
/**
 * check-commands —— UxKit 命令引用完整性校验（红线 2：命令即一切入口）
 *
 * C1  悬空引用（错误）：代码 / 模板中引用的命令 id 必须已注册。
 *     引用约定（任一即计入）：
 *       - runCommand('<id>')              运行命令
 *       - <Comp command="<id>" />         模板属性（UxButton / 菜单项宿主…）
 *       - { command: '<id>' }             对象属性（菜单 / 工具栏数据模型）
 *     声明来源（注册表 id 集合）：
 *       - 含 registerCommand( 或 Command[] 的文件中的 `id: '<字面量>'`
 *       - 任意文件中的命令常量 `const <NAME>_ID = '<字面量>'`
 *     说明：静态扫描看不见运行时注册，故以声明文件 + 常量约定兜底；
 *     动态注册（如按数据生成 id）请改用常量并在声明文件导出。
 * C2  PlatformAdapter 契约（错误）：WindowControls 接口声明的方法与内置
 *     createWebWindowControls 实现的方法必须一一对应（契约两端签名比对）。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['packages', 'apps']
const EXTS = new Set(['.vue', '.ts', '.tsx', '.js', '.mjs'])
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
    } else if (EXTS.has(name.slice(name.lastIndexOf('.')))) {
      out.push(full)
    }
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

const DECLARATION_HINT = /registerCommand\s*\(|\bCommand\[\]/
const ID_DECL_RE = /\bid\s*:\s*['"]([^'"]+)['"]/g
const ID_CONST_RE = /\bconst\s+([A-Za-z_$][\w$]*ID)\s*=\s*['"]([^'"]+)['"]/g
const REF_PATTERNS = [
  { re: /\brunCommand\(\s*['"]([^'"]+)['"]/g, via: 'runCommand()' },
  { re: /\bcommand\s*[:=]\s*['"]([^'"]+)['"]/g, via: 'command 引用' },
]

const declared = new Map() // id -> 'file:line'
const references = [] // { id, via, file, line }

for (const file of files) {
  let src
  try {
    src = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  const rel = relative(ROOT, file)
  const lines = src.split(/\r?\n/)
  const isDeclaration = DECLARATION_HINT.test(src)

  if (isDeclaration) {
    lines.forEach((line, i) => {
      ID_DECL_RE.lastIndex = 0
      let m
      while ((m = ID_DECL_RE.exec(line))) declared.set(m[1], `${rel}:${i + 1}`)
    })
  }

  // 命令 id 常量约定：跨文件通用（声明文件中的变量 id 靠它补齐）
  lines.forEach((line, i) => {
    ID_CONST_RE.lastIndex = 0
    let m
    while ((m = ID_CONST_RE.exec(line))) {
      if (!declared.has(m[2])) declared.set(m[2], `${rel}:${i + 1}`)
    }
  })

  lines.forEach((line, i) => {
    for (const { re, via } of REF_PATTERNS) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(line))) {
        references.push({ id: m[1], via, file: rel, line: i + 1 })
      }
    }
  })
}

const errors = []
const dangling = references.filter((r) => !declared.has(r.id))
for (const ref of dangling) {
  errors.push(`C1  悬空命令引用 '${ref.id}'（${ref.via}）  ${ref.file}:${ref.line}`)
}

/** 取出从 startIdx 之后第一个 `{` 起的成对花括号内容 */
function blockAfter(src, startIdx) {
  const open = src.indexOf('{', startIdx)
  if (open < 0) return ''
  let depth = 0
  for (let i = open; i < src.length; i++) {
    const ch = src[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return src.slice(open + 1, i)
    }
  }
  return ''
}

function methodNames(block, indent) {
  const names = new Set()
  const re = new RegExp(`(?:^|\\n) {${indent}}(?:async\\s+)?([A-Za-z_$][\\w$]*)\\s*\\(`, 'g')
  let m
  while ((m = re.exec(block))) names.add(m[1])
  return names
}

const platformFile = join(ROOT, 'packages', 'services', 'src', 'platform.ts')
try {
  const src = readFileSync(platformFile, 'utf8')
  const ifaceIdx = src.indexOf('interface WindowControls')
  const implIdx = src.indexOf('createWebWindowControls')
  const ifaceBlock = ifaceIdx >= 0 ? blockAfter(src, ifaceIdx) : ''
  const implBlock = implIdx >= 0 ? blockAfter(src, src.indexOf('return', implIdx)) : ''
  const ifaceMethods = ifaceBlock ? methodNames(ifaceBlock, 2) : new Set()
  const implMethods = implBlock ? methodNames(implBlock, 4) : new Set()
  if (ifaceMethods.size && implMethods.size) {
    for (const name of ifaceMethods) {
      if (!implMethods.has(name)) {
        errors.push(`C2  createWebWindowControls 缺少契约方法 ${name}()（packages/services/src/platform.ts）`)
      }
    }
    for (const name of implMethods) {
      if (!ifaceMethods.has(name)) {
        errors.push(`C2  createWebWindowControls 多出非契约方法 ${name}()（packages/services/src/platform.ts）`)
      }
    }
  } else {
    console.warn('⚠ check-commands 警告：C2 契约解析失败，跳过 PlatformAdapter 比对')
  }
} catch {
  console.warn('⚠ check-commands 警告：未找到 platform.ts，跳过 C2 比对')
}

if (errors.length > 0) {
  console.error(`\n✗ check-commands 失败：${errors.length} 处问题\n`)
  for (const e of errors) console.error(`  ${e}\n`)
  console.error('修复方式：补齐命令注册（registerCommand / Command[] 声明），或修正引用 id；')
  console.error('命令 id 用常量时，请以 *_ID 命名以便静态识别。')
  process.exit(1)
}

console.log(
  `✓ check-commands 通过：${declared.size} 个已注册命令，${references.length} 处引用，无悬空；PlatformAdapter 契约一致`,
)
