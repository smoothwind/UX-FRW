# UxKit 统一交互框架设计方案

> 来源：对 `D:\CodeRepos\PersonalDb`（Tauri 2 + Vue 3 + Element Plus 多数据库客户端）与 `D:\CodeRepos\MdReader`（Electron/Tauri 双端 + Vue 3 全自研 Markdown 工具）的深度调研，结合业界成熟方案（Microsoft Fluent 2、shadcn/shadcn-vue、VSCode Workbench、GitHub Primer、reka-ui）提炼而成。
>
> 目标：成为后续所有桌面软件开发直接复用的交互框架（组件库），避免两个项目中已经出现的重复造轮子与设计漂移。

---

## 一、两项目 UX 共性提炼（证据 → 原则）

### 1.1 两项目已经各自验证过、值得固化为规范的模式

| # | 模式 | PersonalDb 证据 | MdReader 证据 | 业界同源 |
|---|------|----------------|--------------|---------|
| 1 | **令牌驱动的主题系统** | `--el-*` 变量 + 少量 `--pd-*` 令牌，`html.dark` 切换 | `tokens.css` 三层令牌 + `data-theme` 翻转 + CI 强制校验 | shadcn 语义 token、Fluent 2 token |
| 2 | **暗色只翻转语义层** | `:root` 与 `html.dark` 各一套语义变量 | 仅 `:root[data-theme='dark']` 内翻转 9 个语义变量 | shadcn `.dark` 覆盖 |
| 3 | **命令即一切入口** | Ctrl+K 命令面板 + 快捷键注册表 + 菜单 | `menuActions` 路由表（缺面板入口） | VSCode ICommandService |
| 4 | **能力驱动 UI** | 后端下发 `KindInfo` 能力位，前端按能力显隐事务/会话按钮 | Tauri 端能力降级（无静默 PDF → 降级打印） | VSCode when 子句 |
| 5 | **错误即动作** | 错误条按类型给「重连/重试」按钮；通知可点击重连 | 保存失败必 notify，错误日志落盘 | GitHub/Linear 恢复型错误设计 |
| 6 | **全局禁用原生右键，自绘菜单** | 树/页签/单元格三处自绘（重复 3 次=反面教材） | `ContextMenu.vue` 单组件（正确示范） | 全部现代桌面应用 |
| 7 | **三态完备**（loading/empty/error） | 统一 `EmptyState` 组件 + v-loading + 错误条 | 文件树/标签栏空态 + busy 态 | 设计系统基线要求 |
| 8 | **破坏性操作防护** | 确认对话框 | 武装式二次点击（3 秒复位）+ Promise 化确认框 | macOS/Windows HIG |
| 9 | **竞态防护 runSeq** | 请求序列号作废过期响应（停止按钮自增） | — | abortable fetch 标准姿势 |
| 10 | **工作台式布局** | 标题栏+菜单+工具栏+四区停靠+状态栏+悬浮层 | TabBar+侧栏+主区+状态栏+浮动 TOC | VSCode/Obsidian/Typora |
| 11 | **快捷键双 scope** | global/editor 两级，用户可覆盖，CM6 动态生效 | 系统菜单注册 + 渲染层补充 | VSCode keybinding contexts |
| 12 | **漫游引导** | driver.js + `data-tour` 锚点 + 剔除不可见锚点 | 手写聚光遮罩 + 键盘导航 | Onboarding 最佳实践 |
| 13 | **设置页双栏结构** | 左分类导航+右内容，改完即生效+预设方案 | 同结构 + footnote「即时生效无需保存」 | VSCode Settings |
| 14 | **平台适配层单接口** | Tauri invoke 封装 1:1 命令 | `window.mdreader.*` 单一契约 + 三端 CI 校验 | dependency inversion |
| 15 | **偏好即时生效** | applyTheme/applyUi 直改 DOM | CSS 变量注入字号行高 | 现代应用惯例 |

### 1.2 两项目共同的痛点（组件库要解决的直接动机）

| 痛点 | PersonalDb | MdReader | UxKit 对策 |
|------|-----------|----------|-----------|
| 按钮样式碎片化 | 依赖 EP 默认样式 | **10 处**视觉一致却各自实现（`.tb-btn/.pf-btn/.mm-btn/...`） | 唯一 `UxButton` |
| 右键菜单重复实现 | **3 次**拷贝式实现，无键盘导航、无防溢出 | 1 处（已是组件） | 唯一 `UxContextMenu`（含键盘导航+防溢出） |
| 令牌体系形同虚设 | tokens.css 仅 8 个变量，魔法数散落 | CI 强制校验（正确示范） | 三层令牌 + check-tokens CI |
| z-index 绕过令牌 | — | 确认框内联 `z-index:2400` 突破令牌 | 语义 z 阶梯 + lint 规则 |
| 偏好存储碎片化 | 9 个 localStorage key + 5 个后端 JSON | 6+ 个 localStorage key | `PreferencesService` 单入口 + 版本化迁移 |
| 巨型组件 | QueryTabPane 2700 行 / ConnectionTree 1528 行 | EditorPane 1343 行 | headless 逻辑抽 composables，组件只管视图 |
| 无障碍不成体系 | frameless 窗控无 aria-label、无 focus trap | 有 role 但无 focus trap/aria-live | 组件内置 a11y 基线 |
| 缺命令面板 | 有（Ctrl+K） | 无 | `CommandPalette` 模式组件 |
| 快捷键无冲突检测 | 靠前置拦截硬解 | 无检测 | `ShortcutService` 注册时冲突告警 + CI 校验 |

---

## 二、业界方案借鉴要点

| 方案 | 借鉴点 | 应用到 UxKit |
|------|-------|-------------|
| **Microsoft Fluent 2** | 4px 间距网格；字号阶梯（caption 12 / body 14 / subtitle 16 / title 20+）；阴影四级 elevation（2/4/8/16px）；圆角 2/4/6/8 与 Windows 11 一致；Mica/Acrylic 表面分层思想 | 尺寸令牌档位、`--ux-elev-*` 阴影阶梯、表面层级（app/panel/overlay 三层表面） |
| **shadcn / shadcn-vue** | 语义 token **bg/foreground 成对**约定（`primary`/`primary-foreground`）；圆角单一来源 `--radius` 派生 `--radius-sm/md/lg`；"组件即源码，样式全走 token"；headless 思想 | 令牌命名法、圆角派生公式、组件消费规则（只准用语义层） |
| **VSCode Workbench** | 命令注册表统一菜单/快捷键/命令面板/右键菜单四类入口；keybinding 的 `when` 上下文；workbench 停靠布局（活动栏/侧栏/编辑区/面板/状态栏） | `CommandService`（`when` 表达式承载"能力驱动 UI"）、`DockWorkbench` |
| **GitHub Primer** | 中性灰 12 级 + 语义色浅深双套（Primer color modes）；`data-color-mode="dark"` 切换 | 中性色阶取值参考、暗色对比度校验方法 |
| **reka-ui（radix-vue）** | headless 组件把焦点陷阱、键盘导航、ARIA、受控/非受控做扎实；行为与视觉彻底分离 | 不引入运行时依赖，但**照抄其行为规格**（Dialog focus trap、Menu 键盘导航、Popover 定位翻转） |

---

## 三、UxKit 总体架构

```
┌─────────────────────────────────────────────────────────┐
│  业务应用（PersonalDb / MdReader / 未来新项目）              │
├─────────────────────────────────────────────────────────┤
│  @ux/patterns   复合模式：CommandPalette / SettingsShell  │
│                 EmptyState / ErrorState / TourGuide       │
├─────────────────────────────────────────────────────────┤
│  @ux/shell      布局壳：AppShell / TitleBar /              │
│                 DockWorkbench / StatusBar                 │
├─────────────────────────────────────────────────────────┤
│  @ux/components 原子组件：Button / Input / Dialog / Menu   │
│                 Toast / Tabs / Tree / DataTable / ...     │
├─────────────────────────────────────────────────────────┤
│  @ux/services   系统服务：Command / Shortcut / Preferences │
│                 / I18n / Platform / Notify                │
├─────────────────────────────────────────────────────────┤
│  @ux/composables headless 逻辑（无 UI，可单测）：           │
│                 useFocusTrap / useOverflowPosition /      │
│                 useDockLayout / useRunSeq / ...           │
├─────────────────────────────────────────────────────────┤
│  @ux/tokens     设计令牌（三层 CSS 变量 + TS 导出 + 类型）   │
└─────────────────────────────────────────────────────────┘
     技术基座：Vue 3.5+ / TypeScript strict / CSS Variables / Vitest
     运行壳：Tauri 2 或 Electron（PlatformAdapter 抹平差异）
```

**依赖方向铁律**：上层可依赖下层，下层禁止反向依赖；`composables` 与 `tokens` 不依赖 Vue 组件体系（composables 可用 `@vue/reactivity`），保证可测试性与未来跨框架可能。

### Monorepo 结构

```
D:\CodeRepos\UX-FRW\            ← 仓库名即 UX-FRW（UxKit）
├── pnpm-workspace.yaml
├── package.json
├── packages/
│   ├── tokens/                 @ux/tokens
│   │   ├── src/
│   │   │   ├── primitives.css      # Tier1 基础层（仅内部消费）
│   │   │   ├── semantic.css        # Tier2 语义层（:root + .dark 两套）
│   │   │   ├── layout.css          # 布局/尺寸/层级令牌
│   │   │   ├── index.ts            # TS 导出（token 名常量 + 读取函数）
│   │   │   └── types.ts
│   │   └── package.json
│   ├── composables/            @ux/composables（headless，零样式）
│   ├── services/               @ux/services（命令/快捷键/偏好/i18n/平台适配）
│   ├── components/             @ux/components（原子组件，样式只消费语义令牌）
│   ├── shell/                  @ux/shell（依赖 components + services）
│   └── patterns/               @ux/patterns（依赖以上全部）
├── apps/
│   └── playground/             组件文档站（VitePress 或 Vite 演示壳）
├── scripts/
│   ├── check-tokens.mjs        # R1 禁裸 hex / R2 间距走令牌 / R3 禁字面量 z-index/圆角/字号/阴影
│   ├── check-i18n.mjs          # zh-CN / en 叶子 key 对齐
│   ├── check-shortcuts.mjs     # 快捷键冲突检测（含与浏览器/编辑器保留键位比对）
│   └── check-commands.mjs      # 命令引用完整性（组件里用到的 commandId 必须已注册或声明）
└── docs/
    ├── PRINCIPLES.md           # UX 设计规范（本文第五节扩展版）
    └── MIGRATION.md            # 两项目迁移指引
```

---

## 四、设计令牌体系（@ux/tokens）

### 4.1 三层结构（MdReader 已验证 + shadcn 命名法）

```
Tier 1 基础层 primitives   --ux-gray-0…950 / --ux-indigo-500 / --ux-green-600 ...
                           ↑ 只允许 semantic.css 消费，业务代码禁用
Tier 2 语义层 semantic     --ux-fg / --ux-fg-muted / --ux-fg-on-accent
                           --ux-bg / --ux-bg-panel / --ux-bg-overlay / --ux-bg-sunken
                           --ux-border / --ux-border-strong
                           --ux-accent / --ux-accent-hover / --ux-accent-active
                           --ux-danger / --ux-danger-fg / --ux-success / --ux-warning
                           --ux-focus-ring
                           ↑ 组件与业务唯一允许消费的颜色层；.dark 只翻转这一层
Tier 3 组件层 component    --ux-btn-height / --ux-input-height / --ux-tab-height ...
                           ↑ 仅组件库内部使用，由语义层组合而来
```

**关键约定（继承 shadcn）：**
- 表面/前景成对：`--ux-accent` 必搭配 `--ux-fg-on-accent`，杜绝"配色对"缺失。
- 圆角单一来源：`--ux-radius: 6px`，派生 `--ux-radius-sm: calc(var(--ux-radius) * 0.66)`（≈4px）、`--ux-radius-lg: calc(var(--ux-radius) * 1.33)`（≈8px）、`--ux-radius-full: 9999px`。
- 阴影四级 elevation（Fluent 对齐）：`--ux-elev-1`(悬浮提示) / `--ux-elev-2`(下拉/弹层) / `--ux-elev-3`(对话框) / `--ux-elev-4`(拖拽中的窗口)。
- 暗色对比度硬指标：正文 ≥ 4.5:1，UI 组件边界 ≥ 3:1（WCAG 1.4.3 / 1.4.11），`data-color-mode` 切换并同步 `color-scheme`。

### 4.2 尺寸令牌（合并两项目实际用值，消除魔法数）

| 类别 | 令牌 | 值 | 备注 |
|------|------|----|----|
| 字号 | `--ux-fs-xs / sm / md / lg / xl / display` | 11 / 12 / 12.5 / 13 / 14 / 18 px | 收编 PDB 散落的 10.5~13px 五档 |
| 间距 | `--ux-sp-1 … --ux-sp-6` | 4 / 8 / 12 / 16 / 20 / 24 px | 4px 网格（Fluent） |
| 行高 | `--ux-lh-tight / normal / relaxed` | 1.3 / 1.5 / 1.7 | |
| 窗体 | `--ux-titlebar-h` 32 / `--ux-menubar-h` 26 / `--ux-toolbar-h` 42 / `--ux-statusbar-h` 26 px | | 直接来自 PDB 实测值 |
| 面板 | `--ux-panel-header-h` 28 / `--ux-panel-min-w` 200 / `--ux-panel-max-w` 560 px | | PDB 停靠面板实测 |
| z 阶梯 | `--ux-z-local` 20 → `z-dock` 900 → `z-pop` 960 → `z-top` 999 → `z-modal` 2000 → `z-menu` 2100 → `z-dropdown` 2200 → `z-tour` 2600 | | MdReader 阶梯原样采纳；新增浮层必须登记新档，禁止内联数字 |
| 动效 | `--ux-dur-fast` 120ms / `--ux-dur-normal` 160ms / `--ux-ease-out` | | 全局动效时长；`prefers-reduced-motion` 下一律禁用 |

### 4.3 主题切换机制（两项目方案的并集）

```ts
// @ux/tokens 的 applyTheme：一套代码同时兼容三种运行壳
function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const resolved = theme === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' : theme
  document.documentElement.classList.toggle('dark', resolved === 'dark')          // PDB 惯例
  document.documentElement.dataset.colorMode = resolved                            // Primer 惯例
  document.documentElement.style.colorScheme = resolved                            // 原生控件跟随
  platform.setNativeTheme(theme)   // Electron: nativeTheme.themeSource / Tauri: set_theme
}
```

JS 需要主题色的场景（图表/画布）**运行时读令牌**（`getComputedStyle`），禁止 JS 分支硬编码——MdReader 已验证的规则。

### 4.4 选中态令牌分层（控件级 vs 行级）

| 层级 | 场景 | 底色 | 前景 | 理由 |
|------|------|------|------|------|
| 控件级 | 按钮 / 页签 / 分段控件等整块控件被选中 | `--ux-bg-selected`（实心主色） | `--ux-fg-on-accent` | 面积小、文字短，实心主色强化状态且不影响阅读 |
| 行级 | 表格行 / 树节点 / 列表项 / 列表选项（`*__row`、`tr`、`role=row|option|treeitem|menuitem`） | `--ux-accent-subtle` | `--ux-accent-fg` | 面积大，实心主色会压过内容；subtle 底 + 深色前景才有 AA 对比度 |

- **参照实现**：`UxTree` 行选中（`.ux-tree__row.is-selected`）与 `UxSegmented` 选项（`.ux-seg__item.is-active`）都是 subtle 底 + `--ux-accent-fg`；行级选中不铺实心主色是既有惯例。
- **强制**：`check-tokens` 的 **R4** 按选择器判定——行级选择器上出现 `background: var(--ux-bg-selected)` 直接失败（`tokens-exempt` 可豁免，仅限命名含 `row` 但确属控件级的特例）。
- **对比度**：行级前景必须用 `--ux-accent-fg`（浅色 indigo-700 / 暗色 indigo-300），保证 subtle 底上 ≥4.5:1；实心主色底必须配 `--ux-fg-on-accent`，禁止用 `--ux-fg` 等正文色。

---

## 五、UX 设计规范（PRINCIPLES.md 骨架，16 条硬规则）

1. **令牌优先**：一切颜色/字号/间距/圆角/阴影/层级来自语义令牌；`check-tokens` CI 强制（R1 禁裸 hex、R2 间距走令牌、R3 禁字面量 z/圆角/字号/阴影）。数据可视化等"数据配色"用 `tokens-exempt` 注释豁免。
2. **命令驱动**：任何可触发动作（菜单项/工具栏按钮/快捷键/右键菜单项/命令面板条目）必须注册为 `Command { id, title, icon?, shortcut?, when?, run() }`；UI 控件只负责触发命令，不自带逻辑。→ 一处注册，四类入口同时可用（VSCode 模式，根治 PDB 三处菜单重复与 MdReader 无面板问题）。
3. **能力驱动显隐**：控件可用性由 `when` 表达式（能力上下文）决定，不做硬编码 if；宿主能力变化 → 命令自动启停 → UI 自动刷新（PDB KindInfo 模式泛化）。
4. **错误即动作**：错误呈现必须附带恢复动作（重试/重连/查看日志/复制详情）；同类错误 `notifyOnce` 5 秒窗口去重；错误细节可展开可复制。
5. **三态完备**：任何数据区域必须显式处理 loading（骨架屏或 spinner）、empty（EmptyState：图标+标题+提示+主行动作）、error（ErrorState：错误+动作）。禁止空白一片。
6. **破坏性操作双保险**：不可逆操作用 Promise 化确认框（Esc=取消、Enter=确认主按钮）或武装式二次点击（3 秒复位）；"保存链路零容忍"——任一保存失败则停留不退出（MdReader 规则）。
7. **竞态防护**：一切可重复发起的异步操作（搜索/执行/翻页）必须走 `useRunSeq` 或 AbortController，过期响应静默丢弃。
8. **键盘完备**：所有浮层（菜单/命令面板/对话框）支持 ↑↓ 导航、Enter 确认、Esc 关闭、Home/End 跳转、首字母跳转；`Ctrl+K` 永远保留给命令面板；Esc 关闭一切浮层。注册时冲突检测 + CI 校验。
9. **右键菜单统一**：全局拦截原生 contextmenu，一律用 `UxContextMenu`（Teleport+防溢出+键盘导航+danger 项红色）；菜单项同样来自命令注册表。
10. **无障碍基线**：对话框 focus trap + aria-modal；通知 aria-live="polite"；图标按钮必须有 aria-label（不只 title）；frameless 窗控按钮 aria-label 必填；全组件键盘可达。
11. **偏好即时生效**：设置改完即生效（无保存按钮），UI 上注明"本页改动即时生效"；"需重启"类设置必须单独分区并明确提示。
12. **平台适配单接口**：渲染层只认 `platform.*` 一个契约对象（`window.appApi.*`），Electron preload 与 Tauri adapter 提供同签名实现；CI 校验三端命令一致性（MdReader check-commands 模式）。
13. **图标语义唯一（红线）**：同一图标在同一应用内**只能绑定一个语义**，禁止不同语义共用同一图标；反之一个语义也只允许一个图标。"放大镜"只能表示查找，不得兼作预览；"保存/应用/提交"必须用不同图标，不得共用软盘。落地：图标注册表（沿用 PDB 的 `obj-*` 对象 / `act-*` 动作 / `st-*` 状态三类命名）+ 单一映射出口，iconId ↔ 语义一对一，CI `check-icons` 校验唯一性。
14. **禁止易困惑图标（红线）**：不得使用语义反转、文化歧义或与平台惯例冲突的图标。具体禁例：
    - `×` 仅表示关闭/清除；**删除必须用垃圾桶 + danger 色**，禁止用 `×` 承担删除语义（与关窗/关页签混淆）；
    - 箭头语义不得混用：`▸` 只作展开/折叠，`→` 只作前进/跳转，禁止一箭两义；
    - `+` 只作新增，`−` 只作移除/缩出，不得借用为其他含义；
    - 淘汰隐喻不得承担新义（软盘只能=保存，信封只能=消息）；
    - 图标不可达语义时必须图标+文字并列（工具栏图标必须配 tooltip 且 aria-label 必填，见规则 10）；
    - 近形图标（复制/层叠、星标/收藏类）禁止在同屏承担不同语义，必要时换形或加角标区分。
15. **快捷键唯一占用**：同一键位只准绑定一个命令（首个独占；冲突时相关命令自动挂起，命令面板仍可运行）；输入框/编辑器聚焦时默认不触发，需 `allowInInput` 显式放行；避开浏览器/系统保留键位（Ctrl+C/V/X/A/Z/Y/F/P/W/T/N、F5/F11/F12）。落地：`ShortcutController` 运行时命序归一化 + 冲突检测 + 用户改键覆盖，`check-shortcuts` CI 静态扫描。
16. **文案单一来源**：所有面向用户的文案走 i18n key，禁止硬编码散落各处；同一 locales 目录下各语言包叶子 key 完全对齐（禁缺 key / 多 key）。落地：`createI18n`（点分查找 + 插值 + 回落链）+ `check-i18n` CI 校验。

---

## 六、各包详细设计

### 6.1 @ux/composables（headless 逻辑，Vitest 全覆盖）

| composable | 职责 | 提炼来源 |
|-----------|------|---------|
| `useFocusTrap(el)` | 焦点陷阱 + Tab 循环 + 关闭后焦点归还 | 两项目缺口（reka-ui 行为规格） |
| `useOverflowPosition(anchor, popper)` | 浮层定位 + 边缘翻转 + 视口钳制 + 翻转偏移 | MdReader placeBar / ContextMenu 定位 |
| `useHoverIntent(target, bar, {enterDelay:120, hideDelay:200, corridor:14})` | 悬浮意图 + 保持区走廊 | MdReader EditorPane 精华 |
| `useRunSeq()` | 请求序列号，`isStale(seq)` 判断 | PDB |
| `useDockLayout()` | 四区停靠状态机：面板位置/尺寸/拖拽交换/悬浮几何/z 层叠/最小化条，localStorage 防抖持久化（M4 已落地：归属/尺寸/开合/让位/lastZone/拖拽交换/悬浮几何+置焦/最小化层叠/持久化） | PDB `layout.ts`（312 行完整状态机） |
| `useTabs()` | 页签数组 + activeId + dirty + 恢复快照（IndexedDB KV）+ 中键关闭 + 拖拽排序（M4 已落地：headless 状态机 + 快照导入导出 API，介质由业务决定；dedupe 去重激活/close 邻位激活/cycle 循环/move 下标修正/max 上限+guardClose 守卫） | 两项目 TabBar 合并 |
| `useDragSort(list)` | HTML5 DnD 封装：drag-over 插入指示线 + drop 校验后置（防守式：allow 恒真 + 落点校验 + 循环防护） | PDB 树拖拽经验 + MdReader 标签排序 |
| `useConfirm()` | Promise 化确认框，`{ok, cancel}` 语义，Esc=cancel | MdReader |
| `useNotify()` | toast 队列 + `notifyOnce(key, 5s)` 去重 + 点击回调 + aria-live | PDB notify.ts |
| `useTour()` | `data-tour` 锚点 + 聚光遮罩（`box-shadow: 0 0 0 9999px`）+ 卡片定位翻转 + 键盘导航 + 剔除不可见锚点 | 两项目引导合并 |
| `useTocObserver()` | MutationObserver + 防抖提取标题 + 滚动定位 | MdReader |
| `useSearchText(root, scroller)` | TreeWalker 查找 + 三模式（大小写/整词/正则）+ 倒序批量替换 | MdReader useSearch |
| `usePreferences()` | 见 PreferencesService | 两项目存储碎片化的终结者 |

### 6.2 @ux/services

**CommandService（框架的心脏）**

```ts
interface Command {
  id: string                    // 'file.save' / 'conn.new' / 'view.toggleTheme'
  title: string                 // i18n key
  icon?: IconName               // obj-/act-/st- 分类命名
  shortcut?: string             // 'Ctrl+S'，注册到 ShortcutService
  when?: (ctx: Capabilities) => boolean   // 能力驱动显隐
  category?: string             // 命令面板分组
  danger?: boolean              // 右键菜单红色项
  run: () => void | Promise<void>
}

const cmd = useCommandService()
cmd.register({ id: 'conn.reconnect', title: 'common.reconnect', shortcut: 'Ctrl+R',
               when: c => c.hasConnection && c.lostIds.length > 0, run: reconnect })
// 菜单/工具栏/右键/面板全部渲染自同一注册表
```

**ShortcutService**
- 键序归一化（`Ctrl+Shift+T` 规范大小写与顺序）；双 scope（global / 编辑器局部）；编辑器聚焦时 global 中"非输入类"命令照常生效（PDB 的 Ctrl+K 硬解问题由此根治：命令面板是命令，天然最高优先级）。
- 用户覆盖存储于 PreferencesService；注册冲突即时告警 + CI 静态校验。

**PreferencesService（终结存储碎片化）**
- 单一 localStorage key（`uxkit.prefs.v1`）+ 版本号 + `migrate(v, prefs)` 迁移链；按域分组（appearance/editor/shortcuts/…）；变更即 apply（applyTheme/applyUi 模式）；敏感信息一律不走此处。

**I18nService**
- vue-i18n 组合式；zh-CN 默认 + en；`check-i18n` CI 对齐叶子 key；组件库自带文案与业务文案分命名空间。

**PlatformAdapter（双端契约）**

```ts
interface Platform {
  readonly kind: 'electron' | 'tauri'
  setNativeTheme(t: 'light'|'dark'|'system'): void
  onMenuAction(cb: (id: string) => void): Unsubscribe
  dragDropEnabled(flag: boolean): void      // Windows/WebView2 特例：禁原生拖放防吞 HTML5 DnD
  openExternal(url: string): void
  logError(e: unknown): void                // 落盘 userData/logs/
  // ... 全部能力显式声明，未声明的能力 = 编译期不可用
}
```

### 6.3 @ux/components（原子组件清单，全部样式仅消费语义令牌）

| 组件 | 关键规格 |
|------|---------|
| `UxButton` | variant: `primary / secondary / ghost / danger`；size: `sm(24) / md(28) / lg(32)`；`:loading` 内建；icon-only 必须传 aria-label（类型强制） |
| `UxInput / UxTextarea / UxSelect / UxSwitch / UxCheckbox / UxSlider` | 统一 28px 高度、focus ring 走 `--ux-focus-ring`、错误态 + 描述文案插槽 |
| `UxDialog` | 内建 focus trap、aria-modal、Esc 关闭、遮罩点击可配置、Promise 化 `open()` 返回结果（脑图窗口模式） |
| `UxContextMenu` | 单例（`openContextMenu(e, items)` / `openContextMenuAt(x, y, items)`）+ Teleport + 防溢出 + 右键/Shift+F10 触发 + ↑↓/←→/Home/End/Enter/Space/Esc/首字母导航 + 分隔线/danger/disabled + 子菜单/复选/单选/分组标题（`menuitemcheckbox`/`menuitemradio`）；内容驱动自命令数组（详见 §6.6） |
| `UxMenuBar` | 工具菜单栏（`role=menubar`）：roving tabindex + ←→ 切顶级项 + ↓/↑/Enter/Space 展开子菜单 + 首字母跳转 + 与命令注册表联动（详见 §6.6） |
| `UxTooltip` ✅ | 120ms hover 意图延迟 + 焦点即显 + Esc 关闭 + `useOverflowPosition` 视口翻转；`role=tooltip` + `aria-describedby`；图标按钮配套 |
| `UxSegmented` ✅ | 分段单选：`role=radiogroup` + roving tabindex + ←→/↑↓/Home/End；size `sm/md`；禁用项跳过；选中=主色淡底（提炼自 PersonalDb SPEC-UI-24/27/28） |
| `UxBadge / UxChip` ✅ | 计数/圆点角标（`max` 封顶、可包裹触发元素）；状态胶囊（`tone` + `dot`，`*-subtle` 底） |
| `UxDropdown` ✅ | 菜单按钮（APG menubutton）：`aria-haspopup=menu` + `aria-expanded`；点击 / ↓ / Enter / Space 打开，Esc 关闭并归还焦点，Tab 只进出一次，外部点击关闭，`checkable` 项激活不关闭；复用 `MenuPanel`（全类型项 + 子菜单），定位 `useOverflowPosition`，层级 `--ux-z-dropdown`；`v-model:open` 可选受控（详见 §6.6） |
| `UxPopover` ✅ | 通用锚定浮层（非菜单类）：默认插槽=触发元素（点击开合，`trigger="manual"` 纯 API）+ `#content` 插槽；`useOverflowPosition` 视口翻转 + 钳制 + `matchTriggerWidth`；外部点击 / Esc 关闭（可分别开关）；`role`/`ariaLabel`/`focusOnOpen`；`v-model:open` 可选受控 + expose `open()/close()/toggle()` |
| `UxToastHost` | aria-live、四语义色、可点击动作按钮、notifyOnce 集成 |
| `UxTabs` | role=tablist、dirty 圆点、中键关闭、拖拽排序、溢出滚动；页签状态三态 `status`（on/lost 红/off 灰化）+ `subtitle` 双行 + `accent` 标识色点（SPEC-UI-22）；`#actions` 插槽在页签栏右侧追加动作区（页签列表/分屏控件图标化 `act-split` / `act-split-stack` / `act-unsplit`，SPEC-UI-27） |
| `UxTree` | 懒加载 + 搜索过滤 + 右键菜单集成 + 状态角标 + 拖拽（防守式校验） |
| `UxDataTable` | **单一实现双模式**：行数 ≤600 全渲染 / >600 自动虚拟滚动（同一套 API，终结 PDB 双表格路径）；列宽拖拽、列显隐、列值筛选、右键菜单、单元格复制 |
| `UxTabList` ✅ | 页签列表 popover（供页签栏 `#actions` 使用）：过滤输入 + 选项（accent 色点 / icon / title / subtitle / close 按钮）+ 当前项高亮 + ↑↓/Enter/Esc + `useOverflowPosition` 视口翻转（SPEC-UI-27） |
| `UxSplitter` | 面板间分隔条，双击复位 |
| `UxIcon` | lucide 全集 + 自绘扩展（`obj-* / act-* / st-*` 三类命名 + 单一映射出口）；**语义唯一注册表**：iconId ↔ 语义一对一，同名禁二义、同义禁双形（红线 13/14 的执行点），`check-icons` CI 校验 |
| `UxSpinner / UxSkeleton` | loading 两形态 |
| `UxKbd` | 快捷键展示（命令面板/菜单/tooltip 通用） |

### 6.4 @ux/shell（工作台布局壳）

```
┌────────────── AppShell ──────────────────────────────┐
│ TitleBar 32px（frameless：拖拽区 + 窗控 + 品牌区，     │
│            窗控按钮 aria-label 必填；非 frameless 时   │
│            自动退化为普通工具栏——兼容 MdReader 模式）  │
├──────────────────────────────────────────────────────┤
│ MenuBar / Toolbar（插槽，内容驱动自命令注册表子集）      │
├──────┬───────────────────────────────────┬───────────┤
│ Dock │        Center（页签工作区）         │   Dock    │
│ Left │  UxTabs + SplitPane（分屏 20-80%） │   Right   │
├──────┴───────────────────────────────────┴───────────┤
│ Dock Bottom（日志/终端类面板，120-480px）               │
├──────────────────────────────────────────────────────┤
│ StatusBar 26px（左：状态摘要 / 右：徽标+动作）           │
└──────────────────────────────────────────────────────┘
```

- `DockWorkbench`：面板可拖入四区交换位置（拖拽虚线遮罩+边缘热区）、双击面板头停靠⇄悬浮、悬浮层可最小化收进层叠条；状态由 `useDockLayout` 持有。
- M4 已落地：`UxAppShell`（titlebar/menubar/body/statusbar 插槽）、`UxTitleBar`（窗控自 `PlatformAdapter.windowControls`）、`UxActivityBar`、`UxDockWorkbench`（统一面板渲染 + 拖拽遮罩：边缘热区停靠 / 中央悬浮，VSCode 约定）、`UxPanel`（可拖拽头部 + 停靠⇄悬浮/最小化/关闭）、`UxFloatPanel`（标题栏拖动 + 右下 resize + z 置焦）、`UxStatusBar`、`UxSplitter`（指针拖拽 + 键盘 ←↑↓→/Home/End，`role=separator`）；生命周期含面板归属/尺寸/开合/让位/`lastZone`/拖拽交换（交换语义）/悬浮几何/最小化层叠/防抖持久化。
- P1 补充（提炼自 PersonalDb SPEC-UI-24/25/26）：功能带令牌 `--ux-band-bg` / `--ux-band-border`（菜单栏/标题栏/工具栏/页签栏/面板头/状态栏统一带底 + 边线，「带=chrome、内容=画布」层次）；`UxPanelToolbar` 三段式（`#lead` 视图切换 / `#monitor` 监视过滤 / `#actions` 动作状态 + `.ux-sep`/`.ux-spacer` 原子类）；`UxActivityBar` 增加 `badge`（未读徽标）/`pinned`（常驻主区）/`item.active`（多面板可见），Rail 承担「面板开关 + 唤回」语义（点击事件由宿主 `useDockLayout.toggle` 承接）。
- 启动白屏对策（PDB 验证）：可选 Splash 窗口 + `app_ready` 切换，封装为 `createUxKit()` 的选项。
- **稳定标注**（便于用户描述定位 / 引导锚点 / E2E 选择器）：所有布局壳与模式组件根带 `data-ux="<part>"`（如 `appshell`/`titlebar`/`activitybar`/`dock`/`panel`/`panel-toolbar`/`float`/`splitter`/`splitpane`/`tabs`/`statusbar`/`empty`/`error`/`settings`/`tour`/`data-table`），关键子区域带 `data-ux-part="<zone>"`（如 `titlebar-left`/`titlebar-right`/`window-controls`/`menubar`/`dock-left`/`dock-right`/`dock-bottom`/`dock-center`/`drop-overlay`/`floats`/`minimize-stack`/`panel-head`/`panel-body`/`toolbar-lead`/`toolbar-monitor`/`toolbar-actions`/`statusbar-left`/`statusbar-right`/`pane-first`/`pane-second`/`settings-nav`/`settings-content`/`table-head`/`table-body`），页签额外带 `data-ux-tab-id`。值稳定且语义化，TourGuide `target` 可直接引用，业务无需自建 `data-tour` 锚点。
- 重型面板一律 `defineAsyncComponent`，构建层分包。

### 6.5 @ux/patterns（复合模式组件）

| 模式 | 规格 |
|------|------|
| `CommandPalette` | Ctrl+K（ShortcutService 保留键）；渲染自命令注册表 + 宿主注入的动态条目（如"全部连接"）；模糊过滤 + ↑↓/Enter + 底部 UxKbd 提示条 |
| `EmptyState` | icon + title + hint + action 插槽；全应用唯一空态组件，禁止散写 |
| `ErrorState` | 错误信息 + 分类动作（重试/重连/复制详情/查看日志），连接类错误启发式识别（PDB looksLikeConnError）；`summary` 一行可操作摘要 + 原始详情默认折叠·可展开（原始文本入日志，SPEC-CONN-1） |
| `SettingsShell` | 左分类导航（aria-current）+ 右内容卡片 + footnote「即时生效」提示 + 响应式窄屏横排；预设方案机制 |
| `TourGuide` | 聚光遮罩 + 卡片智能定位 + 键盘导航 + localStorage 记忆 + 不可见锚点剔除；`auto=false` 支持纯按钮触发；锚点默认复用组件稳定标注（`data-ux` / `data-ux-part`） |
| `LogPanel` ✅ | 活动日志：级别过滤（全部/错误/警告/信息，复用 UxSegmented）+ 计数 chip + 自动滚动（上翻暂停）+ 行展开完整详情 + 清空；数据由 `useActivityLog` 环形缓冲提供（SPEC-UI-23 日志面板） |
| `WelcomePane` | 1-2-3 步骤引导卡（首启无数据时） |
| `AppMenuBridge` | Electron/Tauri 原生菜单 ⇄ 命令注册表双向桥接（菜单触发命令；命令的 shortcut 变化回写菜单显示） |

### 6.6 菜单系统设计规范（右键菜单 / 工具菜单栏）

> 依据：WAI-ARIA APG **Menu & Menubar Pattern**、Windows/Fluent「Menus vs Context menus」区分、VS Code 菜单分组约定；落地约束见红线 2（命令驱动）、8（键盘完备）、9（右键菜单统一）、10（无障碍）、13/14（图标语义）、16（文案单一来源）。

#### 6.6.1 两类菜单的边界

| 维度 | 工具菜单（菜单栏 / 下拉 / 菜单按钮） | 右键菜单（上下文菜单） |
|------|--------------------------------------|------------------------|
| 宿主 | 命令元素本身（按钮/菜单栏，无其他主职责） | 有主职责的元素（树/表格/画布/文本/页签） |
| 触发 | 左键点击（菜单栏 / menubutton） | 右键 / 长按 / `Shift+F10` / 菜单键 |
| 语义角色 | `menubar`；由 button 弹出时为 `menu` | `menu` |
| 定位 | 锚定宿主，`bottom-start`；菜单栏固定顶部 | 鼠标坐标（`clientX/Y`）；贴边翻转 |
| 层级令牌 | `--ux-z-dropdown` | `--ux-z-menu` |
| 持久性 | 菜单栏常驻可见 | 瞬时，随交互关闭 |

原则：**能在界面直接提供的常用命令不再塞进菜单**；菜单只收纳次级/低频命令（Windows 约定）。

#### 6.6.2 触发与关闭

- **右键**：一律 `preventDefault()` 拦截原生菜单（红线 9）；宿主 `@contextmenu` → `openContextMenu(e, items)`，仅坐标场景（虚拟滚动/画布）用 `openContextMenuAt(x, y, items)`。
- **键盘等效**：`Shift+F10` / `ContextMenu` 键触发时，以当前焦点元素矩形定位，聚焦首个可选项。
- **关闭**：点击外部 / `Esc` / 选中项执行 / 窗口失焦 / 宿主滚动；统一由 `useDismiss` 处理。`Esc` 后焦点归还触发宿主。
- **打开即聚焦**：菜单渲染后 `nextTick` 聚焦，默认高亮首个可选项（APG）。

#### 6.6.3 键盘映射（APG 对齐）

| 键 | `menu`（下拉 / 右键） | `menubar`（顶级） | `submenu`（子级） |
|----|----------------------|-------------------|-------------------|
| ↑ / ↓ | 上/下一项（循环） | 打开子菜单→末/首项 | 上/下一项（循环） |
| → | 有子菜单→展开首项；无→移到下一顶级菜单项 | 下一顶级项（循环） | 展开子菜单首项 / 移到下一顶级项 |
| ← | 有子菜单→回父级；否则无操作 | 上一顶级项（循环） | 关闭子菜单→回父项 |
| Enter / Space | 执行项 / 打开子菜单 | 打开子菜单 | 执行 / 展开子菜单 |
| Home / End | 首 / 末项 | 首 / 末顶级项 | 首 / 末项 |
| A–Z | 首字母跳转（不循环） | 同 | 同 |
| Esc | 关闭 + 焦点归还宿主 | 关闭 + 焦点归还宿主 | 关闭子菜单 + 回父项 |

补充（APG 细节）：`menubar`/`menu` 内 **Tab 只进出一次**（不作项间移动，离开即关闭全部子菜单）；子菜单项与父项通过 `aria-haspopup`/`aria-expanded` 关联；鼠标 hover 打开子菜单仅在「已有子菜单打开」时生效（全部关闭时须点击展开，避免屏幕放大器误触），且经 `useHoverIntent` 延迟走廊（~120ms）切换 / 收起。

#### 6.6.4 菜单项数据模型（`MenuItem`）

```ts
type MenuItemKind = 'item' | 'separator' | 'label' | 'checkbox' | 'radio' | 'submenu'

interface MenuItem {
  type?: MenuItemKind          // 缺省 'item'
  id?: string
  label?: string
  icon?: IconId
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  separator?: boolean          // 兼容旧写法，等价 type:'separator'
  checked?: boolean            // checkbox / radio 选中态
  group?: string               // radio 分组
  items?: MenuItem[]           // submenu 子项
  run?: () => void
}

interface MenuBarItem { id?: string; label: string; icon?: IconId; disabled?: boolean; items?: MenuItem[]; run?: () => void }
```

- `menuItemKind(item)` 归一化：显式 `type` 优先，其次 `separator: true`，再按「有 `items` 即 `submenu`」，否则 `item`。
- 菜单源支持 **数组或 getter**（`openContextMenu(e, () => items.value)`）：getter 形式下 `checkbox`/`radio` 勾选随状态实时刷新。
- `checkbox`/`radio` 激活后**不关闭菜单**（APG），`aria-checked` 同步，选中项以 `act-check` 标记。
- 命令驱动（红线 2）：应用可按命令注册表映射生成 `MenuItem[]`（label/icon/shortcut/danger 同源），组件层不反向依赖 services。

#### 6.6.5 无障碍（红线 10）

| 元素 | 角色 / 属性 |
|------|-------------|
| 菜单容器 | `role="menu"` / `role="menubar"` + `aria-label` / `aria-labelledby`；竖向菜单栏 `aria-orientation="vertical"` |
| 普通项 | `role="menuitem"` |
| 复选 / 单选 | `role="menuitemcheckbox"` / `role="menuitemradio"` + `aria-checked` |
| 禁用项 | `aria-disabled="true"`（**保留可聚焦**，APG 约定：读屏用户靠焦点发现禁用项） |
| 子菜单父项 | `aria-haspopup="menu"` + `aria-expanded="true|false"` |
| 分隔线 | `role="separator"`（不可聚焦） |
| 焦点管理 | roving tabindex：仅一项 `tabindex="0"`（首个 / 上次聚焦），其余 `-1` |

#### 6.6.6 视觉规格（全部走语义令牌）

| 项 | 规格 |
|----|------|
| 表面 | `--ux-bg-overlay` + `--ux-elev-2` + `--ux-radius-md` + 1px `--ux-border` |
| 最小 / 最大宽度 | 180 / 320px（长文本截断 + `title` 全文） |
| 项命中高度 | 24px；内边距纵向 `--ux-sp-1`、横向 `--ux-sp-2` |
| 图标槽 | 16px，固定宽度，`--ux-fg-muted`（语义唯一，红线 13） |
| 快捷键列 | 右对齐，`UxKbd` 风格，`--ux-fg-subtle`；显示命令**当前**绑定（随改键刷新） |
| 子菜单箭头 | chevron-right（`act-chevron-right`，需登记），右端固定 |
| hover / 选中行 | `--ux-bg-hover`；复选/单选选中项以 `act-check` 标记（非换色） |
| 危险项 | 文本与图标 `--ux-danger`；删除**必须垃圾桶图标 + danger**（红线 14） |
| 禁用项 | `--ux-fg-subtle`，不响应 hover / click |
| 分隔线 | 1px `--ux-border`，纵向 `--ux-sp-1` 外边距 |

#### 6.6.7 内容与分组

- **顺序**：常用在前；破坏性命令置于末尾，删除项**垫底并用分隔线隔开**（Windows 约定）。
- **分组**：同类命令相邻，组间分隔线或 `label` 分组标题；组过大时收敛进子菜单（VS Code 约定）。
- **上下文相关性**：与目标无关的命令**直接不出现**；"常用但当前不可用"（剪切/复制/粘贴）以 disabled 展示（APG 工具栏/菜单约定）。
- **子菜单**：最多 2 级；父项右侧 chevron；优先右侧 `top-start` 定位，右缘不足翻转左侧；hover 意图延迟（`useHoverIntent` 走廊 ~120ms）。
- **文本单一来源**：label 一律 i18n key（红线 16），与命令 title 同源。

#### 6.6.8 与命令注册表的关系（红线 2）

```
Command { id, title, icon?, shortcut?, when?, category?, danger?, run }
        │
        ├── 工具菜单栏项   （command 引用）
        ├── 右键菜单项     （command 引用 / 内联 run 用于纯视图动作）
        ├── 命令面板条目
        └── 快捷键绑定
```

一处注册，四类入口同时可用；`when(ctx)` 为假 → 项隐藏；`when` 为真但业务态不可用 → `disabled`。

#### 6.6.9 禁止事项

- ❌ 自绘多套右键菜单（PDB 历史教训：三处重复）——必须走 `openContextMenu` 单入口。
- ❌ 菜单项内嵌业务逻辑、绕开命令注册表，破坏单一来源。
- ❌ 用 `×` 表示删除（红线 14）；用菜单承载设置页/对话框级别的复杂表单。
- ❌ 内联 `z-index` 绕过 `--ux-z-menu` / `--ux-z-dropdown`。
- ❌ 顶级子菜单「hover 即开」（全部关闭时应点击展开）。
- ❌ 子菜单嵌套超过 2 级。

#### 6.6.10 落地状态

- ✅ **已实现**（`@ux/components`）：`MenuPanel`（可复用菜单层）+ `UxContextMenuHost`（单例 `openContextMenu` / `openContextMenuAt`，支持数组或 getter 菜单源）+ `UxMenuBar`（`role=menubar`，roving tabindex + ←→ 切顶级项）；全类型项 `item/separator/label/checkbox/radio/submenu`（含二级子菜单、`menuItemKind` 自动判子菜单）；`role=menu/menubar/menuitem/menuitemcheckbox/menuitemradio/separator`、`aria-checked`/`aria-haspopup`/`aria-expanded`/`aria-disabled`（禁用项仍可聚焦）；↑↓/←→/Home/End/Enter/Space/Esc/首字母；hover 跟随（已有菜单展开时）；防溢出定位（视口翻转 + 钳制）；`danger`/`disabled`/快捷键列；Esc 分层关闭 + 焦点归还；`act-chevron-right` 图标（30 个）。
- ✅ **验证**：上下文菜单全类型渲染 + 键盘导航 + 子菜单层级 + 复选/单选实时勾选且不关闭 + 禁用项可聚焦；菜单栏 ←→ 单步切换 + ↓ 进入下拉 + 二级子菜单 + Enter 选中关闭 + Esc 关闭。
- ✅ **菜单纪律与交互强化**：`check-commands`（C1 命令引用完整性 + C2 PlatformAdapter 契约比对）已接入 `pnpm check`；子菜单 hover 意图延迟走廊（`useHoverIntent` ~120ms，双向延迟切换 / 收起，跨越项不闪切）；`Shift+F10` / 菜单键显式绑定（原生事件优先，下一拍未见原生则在聚焦元素上兜底合成 `contextmenu`，仍走「单入口」）。
- ⬜ **待补齐**：菜单项 `{ command }` 引用命令注册表的内置映射（当前由应用层按注册表映射生成 `MenuItem[]`，组件层不反向依赖 services，见 §6.6.4）。

---

## 七、质量保障（CI 四件套 + 测试）

| 脚本 | 规则 |
|------|------|
| `check-tokens` ✅ | R1 禁裸 hex（`tokens-exempt` 豁免）；R2 间距 >4px 必须走 `--ux-sp-*`；R3 禁字面量 z-index/圆角/字号/阴影；R4 行级选择器（`*__row`/`tr`/`role=row|option|treeitem|…`）禁 `--ux-bg-selected`，选中态只准 `--ux-accent-subtle` + `--ux-accent-fg` |
| `check-i18n` ✅ | zh-CN/en 叶子 key 递归对齐，缺失即失败 |
| `check-shortcuts` ✅ | 注册表内冲突检测 + 与保留键位表（浏览器/Ctrl+K 命令面板/编辑器惯例）比对 |
| `check-commands` | 模板/代码中引用的 `command:xxx` 必须在注册表或声明文件中存在；PlatformAdapter 契约两端签名比对 |
| `check-icons` ✅ | 图标注册表一对一映射校验：同一 iconId 绑定多个语义、或同一语义注册多个 iconId 即失败；易困惑组合黑名单（`×` 绑定删除、箭头双义等）直接拦截（红线 13/14） |
| 测试 | composables 单测覆盖（`useDockLayout`/`useTabs`/`useFocusTrap` 等）；原子组件渲染 + 交互测试（@vue/test-utils）；a11y 断言（role/aria-label 存在性）。覆盖率阈值锁定在 `vitest.config.ts`（statements/lines/branches/functions），低于阈值 CI 失败；shell / patterns 组件全部补盲 |
| `changesets` ✅ | `@ux/*` 版本号与 CHANGELOG 单一来源：`pnpm changeset` 记录改动并随功能提交；`master` 推送后 `release.yml` 自动开「版本 PR」，合并即完成发版（`updateInternalDependencies: patch` 联动内部依赖；`@ux/playground` 忽略；npm 发布需另配 `NPM_TOKEN`） |
| 体积红线 | `scripts/size-report.mjs --check`：gzip 总量超 `scripts/size-budget.json` 预算 + 2KB 余量即失败；膨胀合理时 `--update` 刷新基准并随 PR 评审 |
| 无障碍（axe-core）✅ | `e2e/a11y.spec.ts` 对浅色主页面 / 组件分区、暗色组件分区、命令面板跑 axe，阻断 serious/critical 违规；令牌按 WCAG AA（≥4.5:1）校准 `--ux-fg-subtle`、`--ux-*-fg`、`--ux-accent-fg` |
| E2E（Playwright）✅ | 真实浏览器验证单元测试覆盖不到的行为：分区切换 / 主题·语言持久化 / Ctrl+K 命令面板 / 菜单按钮与页签方向键 / 浮层开合与外部点击 / 对话框焦点陷阱 / 10 万行虚拟滚动与排序 / 首次访问导览。选择器一律用 `data-ux`、`data-ux-part` 锚点（不依赖样式类与文案）；config 以 `storageState` 预置导览完成标记，导览行为单独覆盖 |

---

## 八、使用方式（目标形态）

```ts
// 新项目 main.ts —— 十行接入
import { createUxKit } from '@ux/shell'
import '@ux/tokens/semantic.css'

const ux = createUxKit({
  platform: tauriAdapter,            // 或 electronAdapter
  i18n: { locales: { 'zh-CN': zhCN, en } },
  commands: registerAppCommands,     // 应用命令注册（菜单/快捷键/面板自动就绪）
  prefs: { version: 1, migrate: [] },
  shell: { frameless: true, splash: true },
})
ux.mount('#app')
```

```vue
<!-- 业务组件：只组合，不造轮子 -->
<UxDataTable :rows="rows" virtual auto-height @row-context-menu="openCellMenu" />
<UxButton variant="primary" :loading="running" command="query.run">运行</UxButton>
```

---

## 九、落地路线图

| 里程碑 | 内容 | 验收标准 |
|--------|------|---------|
| **M1 令牌** | @ux/tokens 三层令牌 + playground 骨架 + check-tokens | 亮暗双主题 playground 可切换，CI 红/绿生效 |
| **M2 原子组件** | Button/Input/Dialog/ContextMenu/Tooltip/Toast/Icon/Kbd + focus trap/防溢出 composables | playground 全组件演示；键盘可完整操作 |
| **M3 服务层** | ✅ Command/Shortcut/Preferences/I18n + CommandPalette | Ctrl+K 打开面板、改快捷键即时生效、冲突告警 |
| **M4 布局壳** | ✅ AppShell/TitleBar/DockWorkbench/Panel/FloatPanel/ActivityBar/StatusBar/UxTabs/UxSplitPane/UxSplitter + `useDockLayout`（停靠/交换/悬浮/最小化层叠）+ `useTabs` + `PlatformAdapter` | 拖拽换区（边缘热区+遮罩）/双击停靠⇄悬浮/浮窗拖动·resize·最小化条/页签（键盘·中键·右键·拖拽排序·上限）/分屏 20%–80%/状态持久化 全部演示通过 |
| **M5 模式组件** | ✅ EmptyState/ErrorState/SettingsShell/TourGuide/UxDataTable + `useVirtualRows` + `looksLikeConnError` | 三态完备演示；10 万行虚拟滚动流畅（26 行 DOM）、排序/右键/双击复制、Tour 键盘+记忆 全部通过 |
| **M6 迁移试点** | MdReader 接入 UxKit（替换 10 处按钮样式、ContextMenu、TourGuide、TabBar） | 功能等价 + 包体积不增 |
| **M7 完整迁移** | PersonalDb 接入（EP 渐进替换：先 Dialog/Toast/ContextMenu，后表格与树） | 视觉统一到 UxKit 令牌 |

---

## 十、风险与对策

| 风险 | 对策 |
|------|------|
| 组件库功能被单一业务拉偏 | playground 是唯一验收场景；业务特有能力（如 DB 连接树）留在业务侧，框架只提供 UxTree/UxDataTable 原语 |
| 自研 Dialog/Menu 的焦点/键盘细节遗漏 | 逐条对照 reka-ui 行为规格实现 + 交互测试用例化 |
| 双壳（Electron/Tauri）差异扩大 | PlatformAdapter 契约测试 + check-commands 三端比对 |
| 令牌规则被绕过（历史教训：内联 z-index、魔法数） | check-tokens 进 CI 主路径，不豁免主分支合并 |
| EP 渐进替换期视觉双轨 | M7 期间允许 EP 存在但样式经 overrides.css 桥接到 UxKit 令牌，设最终删除期限 |
