# UX-FRW / UxKit

统一桌面交互框架（组件库）。提炼自 `PersonalDb` 与 `MdReader` 两个桌面项目验证过的 UX 模式，
结合业界方案（Fluent 2 / shadcn / VSCode Workbench / Primer）设计。

完整设计方案见 [docs/UxKit-设计方案.md](docs/UxKit-设计方案.md)。

在线预览（playground 由 GitHub Actions 发布到 Pages）：<https://smoothwind.github.io/UX-FRW/>

## 包结构（依赖单向：上层 → 下层）

| 包 | 职责 | 状态 |
|----|------|------|
| `@ux/tokens` | 三层设计令牌（primitives / semantic / layout）+ TS 主题工具 | ✅ M1 |
| `@ux/composables` | headless 逻辑（useFocusTrap / useOverflowPosition / useDismiss / useDockLayout） | ✅ M2/M4 |
| `@ux/services` | Command / Shortcut / Preferences / I18n / Platform | ✅ M3/M4 |
| `@ux/components` | 原子组件（Button / Input / Dialog / ContextMenu / Toast / Icon…） | ✅ M2 |
| `@ux/shell` | 工作台布局壳（AppShell / TitleBar / DockWorkbench / Panel / FloatPanel / ActivityBar / StatusBar / Splitter） | ✅ M4 |
| `@ux/patterns` | 复合模式（CommandPalette / EmptyState / ErrorState / SettingsShell / TourGuide / UxDataTable） | ✅ M3/M5 |

`apps/playground`：组件演示与验收场景（check-tokens 的管辖范围）。

## 快速开始

```bash
pnpm install
pnpm dev              # 启动 playground（令牌 / 原子组件 / 系统服务 / 布局壳 四 Tab）
pnpm check            # 全部红线校验（下面四项串联）
pnpm check:tokens     # 令牌纪律：R1 禁裸色值 / R2 间距走令牌 / R3 禁字面量 z/圆角/字号/阴影
pnpm check:icons      # 图标纪律：语义/形状唯一 + 易困惑组合黑名单
pnpm check:shortcuts  # 快捷键：键位唯一占用（错误）+ 保留键位（警告）
pnpm check:i18n       # 国际化：同目录所有语言包叶子 key 完全对齐
pnpm check:commands   # 命令：引用完整性（悬空 id）+ PlatformAdapter 契约两端比对
pnpm typecheck        # vue-tsc 全量类型检查（packages + playground）
pnpm test             # vitest 单元测试（headless 逻辑 + 系统服务）
pnpm build            # 各包 lib 构建（dist/：ESM + d.ts，vue/@ux/* 外置）
pnpm size             # dist 产物体积报告（M6「包体积不增」基线工具）
```

## 已交付组件与 API

| 组件 / 函数 | 说明 |
|-------------|------|
| `UxIcon` | 语义唯一图标（`obj-* / act-* / st-*` 注册表，30 个起步）；`label` 供读屏 |
| `UxButton` | variant：primary/secondary/ghost/danger；size：sm/md/lg；`:loading`；仅图标必须给 `label` |
| `UxInput` | 自动 `id` + `label` 关联；`hint`/`error`/`disabled` 态；`aria-invalid` |
| `UxKbd` | 快捷键展示 |
| `UxSegmented` | 分段单选：`role=radiogroup` + roving tabindex + ←→/↑↓/Home/End；size `sm/md`；禁用项跳过；选中主色淡底 |
| `UxTooltip` | 120ms hover 延迟 + 焦点即显 + Esc 关闭 + 视口翻转；`role=tooltip` + `aria-describedby` |
| `UxBadge` / `UxChip` | 计数/圆点角标（`max` 封顶、可包裹触发元素）；状态胶囊（`tone` + `dot`） |
| `UxDialog` | `v-model:open`；focus trap + Esc + 遮罩 + aria-modal + 焦点归还 |
| `UxContextMenuHost` + `openContextMenu(e, items)` / `openContextMenuAt(x, y, items)` | 单例右键菜单：`role=menu/menuitem/menuitemcheckbox/menuitemradio/separator`；全类型项 `item/separator/label/checkbox/radio/submenu`（二级子菜单）；防溢出定位 + ↑↓/←→/Home/End/Enter/Space/Esc/首字母 + hover 跟随；危险项/禁用项（仍可聚焦）；菜单源可为数组或 getter（复选/单选实时勾选）。规范见 [§6.6](docs/UxKit-设计方案.md) |
| `UxMenuBar` | 工具菜单栏：`role=menubar` + roving tabindex + ←→ 切顶级项 + ↓/Enter/Space 展开 + Home/End/首字母；下拉复用 `MenuPanel`（含子菜单/复选/单选）；Esc 关闭并归还焦点 |
| `UxToastHost` + `notify()` / `notifyOnce(key, ...)` | aria-live 通知 + 5 秒去重 + 可点击动作 |
| `useFocusTrap` / `useOverflowPosition` / `useDismiss` / `useHoverIntent` | headless 逻辑，可独立用于任意浮层（`useHoverIntent`：hover 意图延迟走廊 ~120ms） |
| `CommandPalette`（patterns） | Ctrl+K 命令面板：注册表实时联动 + 过滤 + ↑↓/Enter/Esc + combobox aria |
| `registerCommand` / `runCommand` / `getAvailableCommands`（services） | 命令注册表：`when` 能力驱动显隐、`danger`、`category` |
| `shortcuts`（ShortcutController） | 键序归一化 + `allowInInput` + 用户改键覆盖 + 冲突检测 + 录制暂停 |
| `createPreferences`（services） | 版本化偏好存储：单 key + 迁移链 + 防抖持久化 + 缺省兜底 |
| `createI18n` / `provideI18n` / `useI18n` / `tryUseI18n`（services） | 轻量 i18n：点分查找 + `{name}` 插值 + 回落链，CI 对齐校验 |
| `useDockLayout`（composables） | 停靠状态机：面板归属/尺寸/开合/让位/`lastZone` + 拖拽换区（交换语义）+ 悬浮几何/置焦/最小化层叠 + 防抖持久化 |
| `useTabs`（composables） | 页签状态机：open（dedupe 去重激活）/close（邻位激活）/closeOthers·Left·Right·All/cycle 循环切换/move 拖拽排序/快照导入导出；`max` 上限 + `onLimit` + `guardClose` 守卫 |
| `UxAppShell` | 应用骨架：titlebar / menubar / body / statusbar 插槽，垂直满高布局 |
| `UxTitleBar` | 32px 标题栏：拖拽区 + 窗控按钮（自 `PlatformAdapter.windowControls`，含最大化态切换） |
| `UxActivityBar` | 活动栏/Rail：图标项 + 选中态（主色图标 + 淡主色底 + 左缘 2px 指示条）+ 隐藏态压暗 + `aria-pressed`；`badge` 未读徽标、`pinned` 常驻主区（tooltip 追加）、`item.active` 多面板可见；语义标签必填 |
| `UxPanelToolbar` | 面板工具栏三段式：`#lead`（视图切换）｜`.ux-sep`｜`#monitor`（监视/过滤）｜`.ux-spacer`｜`#actions`（动作/状态）；`role=toolbar` + `aria-label`；`--ux-band-bg` 带底 |
| `UxDockWorkbench` | 停靠工作区：`layout` + `panels` + activity / panel / center 插槽；自动分隔条 + VSCode 风格拖拽遮罩（边缘停靠 / 中央悬浮）+ 浮动层 + 最小化层叠条 |
| `UxPanel` | 面板容器：可拖拽头部（HTML5 DnD / 指针）+ 停靠⇄悬浮 / 最小化 / 关闭按钮 |
| `UxFloatPanel` | 悬浮窗：绝对定位 + 标题栏指针拖动 + 右下 resize 手柄 + z 置焦 |
| `UxStatusBar` | 26px 状态栏：左/右插槽 |
| `UxTabs` | 页签栏：tablist/tab 语义 + 中键关闭 + dirty 圆点（hover 换关闭钮）+ 拖拽排序（插入指示线）+ 右键批量关闭 + ←→/Home/End/Delete 键盘；`item.status` 三态（on/lost 红/off 灰化）+ `subtitle` 双行 + `accent` 标识色点 + `#actions` 右侧动作区插槽（页签列表/分屏控件，图标化） |
| `UxSplitPane` | 分屏容器：`v-model:ratio`（默认 20%–80% 钳制）+ 第一/第二窗格插槽，复用 UxSplitter（指针+键盘） |
| `UxTabList` | 页签列表 popover（页签栏动作区）：过滤输入 + 选项（标识色点/图标/标题/副标题/关闭）+ 当前项高亮；↑↓/Enter/Esc + 视口翻转定位 |
| `EmptyState`（patterns） | 全应用唯一空态：icon + title + hint + action 插槽 + compact 尺寸 |
| `ErrorState`（patterns） | `role=alert`；`looksLikeConnError` 启发式自动区分 重试/重连；`summary` 一行可操作摘要 + 原始详情折叠展开；复制详情（clipboard+toast）；可选查看日志 |
| `SettingsShell`（patterns） | 左分类导航（`aria-current` + ↑↓/Home/End）+ 右内容插槽 + footnote「即时生效」；窄屏横排 |
| `TourGuide`（patterns） | 聚光遮罩（锚点外扩 6px）+ 无锚点整屏暗化居中；不可见锚点剔除；←→/Enter/Esc；storageKey 记忆；expose `start()`；`auto=false` 关闭自动启动（纯按钮触发） |
| `UxDataTable`（patterns） | 10 万行虚拟滚动（useVirtualRows 固定行高窗口）；表头排序（null 恒排首、保持原始行号、`aria-sort`）；单元格右键坐标 + 双击复制行 |
| `useVirtualRows`（composables） | 固定行高虚拟窗口：overscan + ResizeObserver 视口测量 + rAF 滚动节流 |
| `useActivityLog`（composables） | 活动日志环形缓冲（会话内存）：`limit` 上限、`unreadErrors` 未读错误累计、`markOpened` 清零、`clear`；配 `LogPanel` |
| `LogPanel`（patterns） | 活动日志面板：级别过滤（全部/错误/警告/信息）+ 计数 chip + 自动滚动（上翻暂停）+ 行展开完整详情 + 清空 |
| `openContextMenuAt(x, y, items)`（components） | 坐标版右键菜单（虚拟滚动/画布场景） |
| 稳定标注 `data-ux` / `data-ux-part` / `data-ux-tab-id`（shell + patterns） | 所有布局壳/模式组件根与关键区域带稳定语义属性，作为 TourGuide 锚点、E2E 选择器与「用户描述定位」的统一约定（如 `[data-ux="titlebar"]`、`[data-ux-part="dock-left"]`、`[data-ux-part="statusbar-right"]`） |
| `UxSplitter` | 分隔条：指针拖拽（4px 宽 + 6px 命中区）+ 键盘（←↑↓→ / Shift 加速 / Home / End）+ `role=separator` |
| `setPlatformAdapter` / `getPlatformAdapter` / `createWebWindowControls`（services） | 宿主适配：注入 Electron/Tauri 窗控；内置浏览器模拟适配器供预览 |

> 图标按钮配套约定：仅图标按钮必须给 `label`（aria，红线 14），并建议用 `UxTooltip` 补充文字说明；截断文本用 `UxTooltip` 呈现全文。
>
> 功能带（chrome）约定：菜单栏 / 标题栏 / 工具栏 / 页签栏 / 面板头 / 状态栏统一 `background: var(--ux-band-bg)` + 边线 `var(--ux-band-border)`，形成「带=chrome、内容=画布」层次语言（提炼自 PersonalDb SPEC-UI-25）；面板内工具栏用 `UxPanelToolbar`（lead/monitor/actions 三段），段间竖线用 `.ux-sep`、弹性占位用 `.ux-spacer`。

## 设计红线（CI 强制）

**令牌纪律**（check-tokens）：

1. 颜色只准用语义层：`var(--ux-fg)`、`var(--ux-accent)`…（禁止 hex/rgb 字面量）
2. 间距只用 `--ux-sp-1…6`（4px 网格）
3. z-index / 圆角 / 字号 / 阴影只用令牌；新增浮层层级必须在 `packages/tokens/src/layout.css` 登记新档
4. 暗色适配只允许发生在 `semantic.css` 的 `.dark` 块内
5. 数据配色（图表/画布）用行内注释 `tokens-exempt` 豁免

**图标纪律**（check-icons，随 UxIcon 落地）：

6. **禁止不同语义使用相同图标**——iconId ↔ 语义一对一注册（`obj-*` 对象 / `act-*` 动作 / `st-*` 状态），放大镜只能=查找，软盘只能=保存
7. **禁止易困惑图标**——`×` 只作关闭/清除（删除必须垃圾桶+danger 色）、箭头不得一箭两义、`+/-` 只作增减、近形图标禁止同屏异义；图标达意不足必须配文字 tooltip + aria-label

**快捷键纪律**（check-shortcuts，随服务层落地）：

8. **同一键位只准绑定一个命令**（首个独占；冲突时相关命令自动挂起，命令面板仍可运行）；输入框/编辑器聚焦时默认不触发，需 `allowInInput` 显式放行；避开浏览器/系统保留键位（Ctrl+C/V/X/A/Z/Y/F/P/W/T/N、F5/F11/F12）

**国际化纪律**（check-i18n）：

9. 同一 locales 目录下所有语言包的叶子 key **完全对齐**（禁缺 key / 多 key）；所有面向用户的文案一律走 i18n key，禁止散落硬编码

## 菜单设计规范（右键菜单 / 工具菜单）

依据 WAI-ARIA APG **Menu & Menubar Pattern** 与 Windows/Fluent「Menus vs Context menus」约定，完整规范见 [设计文档 §6.6](docs/UxKit-设计方案.md)。

**边界**：工具菜单（菜单栏/下拉/菜单按钮）宿主是命令元素本身、左键触发、锚定宿主、层级 `--ux-z-dropdown`；右键菜单宿主是有主职责的元素、右键/`Shift+F10`/菜单键触发、按坐标定位、层级 `--ux-z-menu`。

**关键规则**：

1. **单入口**：全局拦截原生 `contextmenu`（`preventDefault`），一律 `openContextMenu` / `openContextMenuAt`（红线 9）。
2. **命令驱动**：菜单项引用命令注册表（`{ command }`）或内联 `run`（纯视图动作）；label/icon/shortcut/when/danger 取自注册表，一处注册、四类入口一致（红线 2）。
3. **键盘完备**：`menu` ↑↓ 循环、`menubar` ←→ 切顶级项、子菜单 ←→ 进出、Enter/Space 执行或展开、Home/End 首末、A–Z 首字母、Esc 关闭并归还焦点（红线 8）。
4. **无障碍**：`role=menu|menubar|menuitem|menuitemcheckbox|menuitemradio|separator`；禁用项 `aria-disabled` 仍可聚焦；子菜单父项 `aria-haspopup`+`aria-expanded`；容器 `aria-label`（红线 10）。
5. **分组与顺序**：常用在前、破坏性垫底并加分隔线；无关命令直接隐藏，常用不可用项 disabled 展示（APG）。
6. **子菜单**：最多 2 级，父项 chevron-right，右缘不足翻转左侧，hover 走廊延迟。
7. **视觉**：全走语义令牌（`--ux-bg-overlay`/`--ux-elev-2`/`--ux-radius-md`），图标 16px 语义唯一、快捷键列右对齐、删除必须垃圾桶 + danger（红线 13/14）。

**当前状态**：`MenuPanel` + `UxContextMenuHost`（单例，含全类型项/子菜单/复选/单选/组标题、数组或 getter 菜单源）与 `UxMenuBar`（`role=menubar`）已交付并验证；`check-commands`（命令引用完整性 + PlatformAdapter 契约）、子菜单 `useHoverIntent` 延迟走廊（~120ms）、`Shift+F10` / 菜单键显式绑定（原生优先 + 兜底合成）均已落地。菜单项 `{ command }` 内置映射仍由应用层按注册表生成 `MenuItem[]`（组件层不反向依赖 services）。

## 主题切换

```ts
import { applyTheme, getToken } from '@ux/tokens'

applyTheme('dark')                       // 三通道同步：data-color-mode + .dark + color-scheme
applyTheme('system', { syncPlatform })   // 跟随系统，并回写 Electron nativeTheme / Tauri set_theme
getToken('--ux-accent')                  // JS 场景运行时读令牌（图表/画布），禁止 JS 硬编码颜色
```
