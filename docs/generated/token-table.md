<!-- 该文件由 scripts/token-table.mjs 自动生成（pnpm tokens:table），禁止手工编辑 -->
# UxKit 设计令牌参考表

> 自动生成于构建时，事实源是 `packages/tokens/src/*.css`；本文只是按「层 × 选择器」展开的只读视图。
> 消费规则（哪层给谁用、暗色只翻语义层）见 [PRINCIPLES.md](../PRINCIPLES.md) 与设计方案 §4。

合计 252 个令牌。

## Tier 1 · 基础层（primitives，业务代码禁用）

来源：`packages/tokens/src/primitives.css`（构建时解析，勿手工编辑本表）

### :root

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-gray-0` | `#ffffff` |  |
| `--ux-gray-50` | `#f6f8fa` |  |
| `--ux-gray-100` | `#eaeef2` |  |
| `--ux-gray-150` | `#d5dbe3` |  |
| `--ux-gray-200` | `#d0d7de` |  |
| `--ux-gray-300` | `#afb8c1` |  |
| `--ux-gray-400` | `#8c959f` |  |
| `--ux-gray-450` | `#646e7d` |  |
| `--ux-gray-500` | `#6a7381` |  |
| `--ux-gray-600` | `#57606a` |  |
| `--ux-gray-700` | `#424a53` |  |
| `--ux-gray-800` | `#1f2328` |  |
| `--ux-gray-900` | `#12151f` |  |
| `--ux-gray-950` | `#0d1117` |  |
| `--ux-navy-500` | `#4a5468` |  |
| `--ux-navy-600` | `#363e52` |  |
| `--ux-navy-700` | `#272e3d` |  |
| `--ux-navy-800` | `#1f2430` |  |
| `--ux-navy-850` | `#1a1f2b` |  |
| `--ux-navy-900` | `#151a24` |  |
| `--ux-navy-950` | `#10141c` |  |
| `--ux-silk-300` | `#7e828a` |  |
| `--ux-silk-500` | `#4b4f57` |  |
| `--ux-silk-600` | `#33363d` |  |
| `--ux-silk-700` | `#24262b` |  |
| `--ux-silk-800` | `#17181c` |  |
| `--ux-silk-850` | `#111215` |  |
| `--ux-silk-900` | `#0b0c0e` |  |
| `--ux-silk-950` | `#060709` |  |
| `--ux-indigo-200` | `#b6c3ff` |  |
| `--ux-indigo-300` | `#91a7ff` |  |
| `--ux-indigo-350` | `#7c93f6` |  |
| `--ux-indigo-400` | `#6680f0` |  |
| `--ux-indigo-500` | `#4c6ef5` |  |
| `--ux-indigo-600` | `#3b5bdb` |  |
| `--ux-indigo-700` | `#2f4bc9` |  |
| `--ux-indigo-800` | `#28399b` |  |
| `--ux-green-300` | `#6fd08c` |  |
| `--ux-green-500` | `#2da44e` |  |
| `--ux-green-600` | `#22823c` |  |
| `--ux-green-700` | `#146c2e` |  |
| `--ux-red-300` | `#f0666c` |  |
| `--ux-red-500` | `#e03131` |  |
| `--ux-red-600` | `#c22525` |  |
| `--ux-red-700` | `#a11d1d` |  |
| `--ux-yellow-300` | `#e8c368` |  |
| `--ux-yellow-500` | `#bf8700` |  |
| `--ux-yellow-600` | `#9a6700` |  |
| `--ux-yellow-700` | `#7a5200` |  |
| `--ux-blue-300` | `#6ea8f7` |  |
| `--ux-blue-500` | `#0969da` |  |
| `--ux-blue-600` | `#0757ba` |  |

---

## Tier 2 · 语义层（semantic，组件与业务唯一颜色层）

来源：`packages/tokens/src/semantic.css`（构建时解析，勿手工编辑本表）

### :root

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-bg` | `var(--ux-bg-base)` | 应用主表面 |
| `--ux-bg-panel` | `var(--ux-bg-panel-base)` | 侧栏/停靠面板 |
| `--ux-bg-sunken` | `var(--ux-bg-sunken-base)` | 凹陷区（输入底/槽道） |
| `--ux-bg-overlay` | `var(--ux-bg-overlay-base)` | 浮层（对话框/下拉/菜单） |
| `--ux-bg-base` | `var(--ux-gray-0)` |  |
| `--ux-bg-panel-base` | `var(--ux-gray-50)` |  |
| `--ux-bg-sunken-base` | `var(--ux-gray-100)` |  |
| `--ux-bg-overlay-base` | `var(--ux-gray-0)` |  |
| `--ux-bg-hover` | `rgba(31, 35, 40, 0.05)` |  |
| `--ux-bg-active` | `rgba(31, 35, 40, 0.09)` |  |
| `--ux-bg-selected` | `var(--ux-accent)` |  |
| `--ux-fg` | `var(--ux-gray-800)` |  |
| `--ux-fg-muted` | `var(--ux-gray-600)` |  |
| `--ux-fg-subtle` | `var(--ux-gray-450)` |  |
| `--ux-fg-on-accent` | `var(--ux-gray-0)` |  |
| `--ux-fg-inverse` | `var(--ux-gray-0)` |  |
| `--ux-border` | `var(--ux-gray-150)` |  |
| `--ux-border-strong` | `var(--ux-gray-300)` |  |
| `--ux-band-bg` | `var(--ux-band-bg-base)` |  |
| `--ux-band-bg-base` | `var(--ux-gray-50)` |  |
| `--ux-band-border` | `var(--ux-gray-150)` |  |
| `--ux-accent` | `var(--ux-indigo-600)` |  |
| `--ux-accent-hover` | `var(--ux-indigo-700)` |  |
| `--ux-accent-active` | `var(--ux-indigo-800)` |  |
| `--ux-accent-subtle` | `rgba(76, 110, 245, 0.12)` |  |
| `--ux-accent-fg` | `var(--ux-indigo-700)` |  |
| `--ux-focus-ring` | `rgba(76, 110, 245, 0.45)` |  |
| `--ux-danger` | `var(--ux-red-600)` |  |
| `--ux-danger-hover` | `var(--ux-red-700)` |  |
| `--ux-danger-subtle` | `rgba(224, 49, 49, 0.1)` |  |
| `--ux-fg-on-danger` | `var(--ux-gray-0)` |  |
| `--ux-danger-fg` | `var(--ux-red-600)` |  |
| `--ux-success` | `var(--ux-green-600)` |  |
| `--ux-success-subtle` | `rgba(45, 164, 78, 0.12)` |  |
| `--ux-fg-on-success` | `var(--ux-gray-0)` |  |
| `--ux-success-fg` | `var(--ux-green-700)` |  |
| `--ux-warning` | `var(--ux-yellow-600)` |  |
| `--ux-warning-subtle` | `rgba(191, 135, 0, 0.12)` |  |
| `--ux-fg-on-warning` | `var(--ux-gray-0)` |  |
| `--ux-warning-fg` | `var(--ux-yellow-700)` |  |
| `--ux-info` | `var(--ux-blue-600)` |  |
| `--ux-info-subtle` | `rgba(9, 105, 218, 0.1)` |  |
| `--ux-fg-on-info` | `var(--ux-gray-0)` |  |
| `--ux-info-fg` | `var(--ux-blue-600)` |  |
| `--ux-elev-1` | `0 1px 3px rgba(13, 17, 23, 0.12)` |  |
| `--ux-elev-2` | `0 4px 10px rgba(13, 17, 23, 0.14)` |  |
| `--ux-elev-3` | `0 8px 24px rgba(13, 17, 23, 0.18)` |  |
| `--ux-elev-4` | `0 16px 40px rgba(13, 17, 23, 0.24)` |  |
| `--ux-scrim` | `rgba(13, 17, 23, 0.45)` |  |

### .dark

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-bg-base` | `var(--ux-navy-900)` |  |
| `--ux-bg-panel-base` | `var(--ux-navy-850)` |  |
| `--ux-bg-sunken-base` | `var(--ux-navy-950)` |  |
| `--ux-bg-overlay-base` | `var(--ux-navy-800)` |  |
| `--ux-bg-hover` | `rgba(255, 255, 255, 0.06)` |  |
| `--ux-bg-active` | `rgba(255, 255, 255, 0.1)` |  |
| `--ux-bg-selected` | `var(--ux-indigo-350)` |  |
| `--ux-fg` | `#e6e9ef` |  |
| `--ux-fg-muted` | `#9aa3b2` |  |
| `--ux-fg-subtle` | `var(--ux-gray-400)` |  |
| `--ux-fg-on-accent` | `#10141c` |  |
| `--ux-fg-inverse` | `var(--ux-gray-900)` |  |
| `--ux-border` | `var(--ux-navy-600)` |  |
| `--ux-border-strong` | `var(--ux-navy-500)` |  |
| `--ux-band-bg-base` | `var(--ux-navy-850)` |  |
| `--ux-band-border` | `var(--ux-navy-600)` |  |
| `--ux-accent` | `var(--ux-indigo-350)` |  |
| `--ux-accent-hover` | `var(--ux-indigo-300)` |  |
| `--ux-accent-active` | `var(--ux-indigo-400)` |  |
| `--ux-accent-subtle` | `rgba(124, 147, 246, 0.16)` |  |
| `--ux-accent-fg` | `var(--ux-indigo-300)` |  |
| `--ux-focus-ring` | `rgba(124, 147, 246, 0.5)` |  |
| `--ux-danger` | `var(--ux-red-300)` |  |
| `--ux-danger-hover` | `#f4848a` |  |
| `--ux-danger-subtle` | `rgba(240, 102, 108, 0.16)` |  |
| `--ux-fg-on-danger` | `#10141c` |  |
| `--ux-danger-fg` | `var(--ux-red-300)` |  |
| `--ux-success` | `var(--ux-green-300)` |  |
| `--ux-success-subtle` | `rgba(111, 208, 140, 0.14)` |  |
| `--ux-fg-on-success` | `#10141c` |  |
| `--ux-success-fg` | `var(--ux-green-300)` |  |
| `--ux-warning` | `var(--ux-yellow-300)` |  |
| `--ux-warning-subtle` | `rgba(232, 195, 104, 0.14)` |  |
| `--ux-fg-on-warning` | `#10141c` |  |
| `--ux-warning-fg` | `var(--ux-yellow-300)` |  |
| `--ux-info` | `var(--ux-blue-300)` |  |
| `--ux-info-subtle` | `rgba(110, 168, 247, 0.14)` |  |
| `--ux-fg-on-info` | `#10141c` |  |
| `--ux-info-fg` | `var(--ux-blue-300)` |  |
| `--ux-elev-1` | `0 1px 3px rgba(0, 0, 0, 0.4)` |  |
| `--ux-elev-2` | `0 4px 10px rgba(0, 0, 0, 0.45)` |  |
| `--ux-elev-3` | `0 8px 24px rgba(0, 0, 0, 0.5)` |  |
| `--ux-elev-4` | `0 16px 40px rgba(0, 0, 0, 0.6)` |  |
| `--ux-scrim` | `rgba(0, 0, 0, 0.55)` |  |

### .dark.dark-silk

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-bg-base` | `var(--ux-silk-900)` |  |
| `--ux-bg-panel-base` | `var(--ux-silk-850)` |  |
| `--ux-bg-sunken-base` | `var(--ux-silk-950)` |  |
| `--ux-bg-overlay-base` | `var(--ux-silk-800)` |  |
| `--ux-bg-hover` | `rgba(255, 255, 255, 0.07)` |  |
| `--ux-bg-active` | `rgba(255, 255, 255, 0.12)` |  |
| `--ux-fg` | `#e8eaee` |  |
| `--ux-fg-muted` | `#9ba0a8` |  |
| `--ux-fg-subtle` | `var(--ux-silk-300)` |  |
| `--ux-fg-on-accent` | `var(--ux-silk-950)` |  |
| `--ux-fg-inverse` | `var(--ux-silk-900)` |  |
| `--ux-border` | `var(--ux-silk-600)` |  |
| `--ux-border-strong` | `var(--ux-silk-500)` |  |
| `--ux-band-bg-base` | `var(--ux-silk-850)` |  |
| `--ux-band-border` | `var(--ux-silk-600)` |  |
| `--ux-elev-1` | `0 1px 3px rgba(0, 0, 0, 0.5)` |  |
| `--ux-elev-2` | `0 4px 10px rgba(0, 0, 0, 0.55)` |  |
| `--ux-elev-3` | `0 8px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)` |  |
| `--ux-elev-4` | `0 16px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.06)` |  |
| `--ux-scrim` | `rgba(0, 0, 0, 0.62)` |  |

### [data-ux-fx~="sheen"]

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-sheen-hi` | `255 255 255` |  |
| `--ux-sheen-strength` | `1` |  |
| `--ux-sheen-canvas` | `0.04` |  |
| `--ux-sheen-panel` | `0.06` |  |
| `--ux-sheen-overlay` | `0.09` |  |
| `--ux-sheen-sunken` | `0.025` |  |

### [data-ux-fx~="metal"]

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-metal-hi` | `255 255 255` |  |
| `--ux-metal-canvas` | `0.08` |  |
| `--ux-metal-panel` | `0.06` |  |
| `--ux-metal-overlay` | `0.11` |  |
| `--ux-metal-sunken` | `0.03` |  |
| `--ux-metal-brush` | `0.05` |  |

### [data-ux-fx~="frost"]

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-frost-opacity` | `0.72` |  |
| `--ux-frost-blur` | `14px` |  |
| `--ux-frost-saturate` | `1.35` |  |

### @media (prefers-reduced-motion: reduce) → :root

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-material-tint` | `color-mix(in srgb, var(--ux-bg-overlay-base) 62%, transparent)` |  |
| `--ux-material-border` | `color-mix(in srgb, var(--ux-border) 60%, transparent)` |  |
| `--ux-material-highlight` | `color-mix(in srgb, var(--ux-gray-0) 40%, transparent)` |  |

### @media (prefers-reduced-motion: reduce) → .dark

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-material-tint` | `color-mix(in srgb, var(--ux-bg-overlay-base) 66%, transparent)` |  |
| `--ux-material-border` | `color-mix(in srgb, var(--ux-gray-0) 12%, transparent)` |  |
| `--ux-material-highlight` | `color-mix(in srgb, var(--ux-gray-0) 8%, transparent)` |  |

### @media (prefers-reduced-motion: reduce) → .dark.dark-silk

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-material-tint` | `color-mix(in srgb, var(--ux-bg-overlay-base) 60%, transparent)` |  |
| `--ux-material-border` | `color-mix(in srgb, var(--ux-silk-300) 28%, transparent)` |  |
| `--ux-material-highlight` | `color-mix(in srgb, var(--ux-gray-0) 10%, transparent)` |  |

### @media (prefers-reduced-motion: reduce) → [data-ux-material~="glass"]

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-material-blur` | `14px` |  |
| `--ux-material-saturate` | `1.35` |  |

---

## Tier 3 · 布局与尺寸（layout）

来源：`packages/tokens/src/layout.css`（构建时解析，勿手工编辑本表）

### :root

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-fs-xs` | `11px` |  |
| `--ux-fs-sm` | `12px` |  |
| `--ux-fs-md` | `12.5px` |  |
| `--ux-fs-lg` | `13px` |  |
| `--ux-fs-xl` | `14px` |  |
| `--ux-fs-display` | `18px` |  |
| `--ux-fs-icon` | `34px` |  |
| `--ux-fs-icon-sm` | `26px` |  |
| `--ux-lh-tight` | `1.3` |  |
| `--ux-lh-normal` | `1.5` |  |
| `--ux-lh-relaxed` | `1.7` |  |
| `--ux-fw-normal` | `400` |  |
| `--ux-fw-medium` | `500` |  |
| `--ux-fw-semibold` | `600` |  |
| `--ux-sp-1` | `4px` |  |
| `--ux-sp-2` | `8px` |  |
| `--ux-sp-3` | `12px` |  |
| `--ux-sp-4` | `16px` |  |
| `--ux-sp-5` | `20px` |  |
| `--ux-sp-6` | `24px` |  |
| `--ux-radius` | `6px` |  |
| `--ux-radius-sm` | `calc(var(--ux-radius) * 0.66)` |  |
| `--ux-radius-lg` | `calc(var(--ux-radius) * 1.33)` |  |
| `--ux-radius-full` | `9999px` |  |
| `--ux-titlebar-h` | `32px` |  |
| `--ux-menubar-h` | `26px` |  |
| `--ux-toolbar-h` | `42px` |  |
| `--ux-statusbar-h` | `26px` |  |
| `--ux-activitybar-w` | `48px` |  |
| `--ux-splitter-w` | `4px` |  |
| `--ux-splitter-hit` | `6px` |  |
| `--ux-panel-header-h` | `28px` |  |
| `--ux-panel-min-w` | `200px` |  |
| `--ux-panel-max-w` | `560px` |  |
| `--ux-panel-min-h` | `120px` |  |
| `--ux-panel-max-h` | `480px` |  |
| `--ux-control-h-sm` | `24px` |  |
| `--ux-control-h-md` | `28px` |  |
| `--ux-control-h-lg` | `32px` |  |
| `--ux-z-local` | `20` | 组件内部局部堆叠 |
| `--ux-z-dock` | `900` | 停靠面板/悬浮窗口 |
| `--ux-z-pop` | `960` | 普通浮层（popover/tooltip） |
| `--ux-z-top` | `999` | 顶层普通浮层 |
| `--ux-z-modal` | `2000` | 模态对话框 |
| `--ux-z-menu` | `2100` | 菜单/右键菜单（须高于对话框） |
| `--ux-z-dropdown` | `2200` | 下拉（须高于菜单） |
| `--ux-z-tour` | `2600` | 漫游引导聚光层 |
| `--ux-z-toast` | `2700` | 通知（最高，不被引导遮罩盖住） |
| `--ux-z-splash` | `2800` | 启动页（最高，盖过一切浮层） |
| `--ux-dur-fast` | `120ms` |  |
| `--ux-dur-normal` | `160ms` |  |
| `--ux-dur-slow` | `240ms` |  |
| `--ux-dur-splash` | `760ms` |  |
| `--ux-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |  |
| `--ux-ease-out-strong` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--ux-focus-width` | `2px` |  |

### :root

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-editor-font-size` | `14px` |  |
| `--ux-editor-line-height` | `1.6` |  |

### @media (pointer: coarse) → :root

| 令牌 | 值 | 备注 |
|------|----|------|
| `--ux-control-h-sm` | `36px` |  |
| `--ux-control-h-md` | `44px` |  |
| `--ux-control-h-lg` | `48px` |  |

