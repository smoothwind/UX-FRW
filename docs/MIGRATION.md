# UxKit 增量接入指南（MIGRATION.md）

> 落地：改进提案 P2-4（随 P3-1 解决设计方案 §3 目录结构中的规划占位）。
> 面向**存量应用**的渐进接入路径；workbench 型新应用可跳读「阶段 4」参考整体套壳（设计方案 §8 为目标形态）。
> 本文为该主题的单一事实源；平台层细节（多显示器 / DWM / AUMID）见设计方案 §11。

---

## 总原则

- **按依赖层级自底向上**：tokens → services / composables → components → shell / patterns。
- **每个阶段独立可停**：接入到任何一层都是稳定状态，不强制走完全程（TigerNote 至今停在阶段 1，依然是受支持的合法形态）。
- **消费者纪律越早越便宜**：令牌红线（`check-tokens` R1–R4）与文案纪律（`check-i18n`）建议随阶段 1 一并采纳——存量样式晚一天替换，裸值就多积累一天。

---

## 阶段 1 · tokens only（CSS 变量 + 主题）

**适合**：只想要统一的视觉语言与暗色能力，不引入任何运行时代码。

```bash
pnpm add @ux/tokens
```

```ts
// main.ts
import '@ux/tokens/semantic.css'
import '@ux/tokens/layout.css' // 尺寸/间距/层级令牌，按需
import { applyTheme } from '@ux/tokens'

applyTheme('dark') // 'light' | 'dark' | 'dark-silk' | 'system'
```

- 三通道同步自动完成：`data-color-mode`（Primer 惯例）+ `.dark` 类 + `color-scheme`（原生控件）。
- 存量样式逐条替换：颜色 → `--ux-fg-*` / `--ux-bg-*`；间距 → `--ux-sp-*`；控件高度 → `--ux-control-h-*`（粗指针设备自动触控档 36/44/48）。
- **验收**：页面在 light / dark 下均可读；若已采纳 CI 红线，`pnpm check:tokens` 全绿。

**Tauri 多窗口**：每窗口是独立 document，各自引入 CSS；主题状态跨窗口同步由宿主广播（Tauri event / storage 事件）后各窗口各自 `applyTheme`。

---

## 阶段 2 · composables（headless，零样式）

**适合**：已接 tokens，想复用行为逻辑而不引入组件视觉。

```bash
pnpm add @ux/composables
```

全部为 Vue 3 组合式函数，不依赖任何 `@ux/*` 组件，Vitest 全覆盖：

| composable | 职责 | 典型替代的手写代码 |
|------------|------|--------------------|
| `useDismiss` | Esc / 外点关闭（带原因区分） | 弹层的 `onDocMouseDown` / `onKeydown` 手写对 |
| `useFocusTrap` | 焦点陷阱（对话框/浮层） | 手动 Tab 循环 |
| `useHoverIntent` | 悬停意图（防误触） | setTimeout 手写防抖 |
| `useOverflowPosition` | 浮层防溢出定位 | 手写翻转逻辑 |
| `useVirtualRows` | 虚拟滚动窗口计算 | 手写 slice 区间 |
| `useTabs` / `useDockLayout` | 页签状态机 / 停靠布局 | 各自手搓 |
| `useActivityLog` | 结构化活动日志 | console 散落 |

**多窗口**：composables 状态不跨窗口（各自 Vue app 实例）；跨窗口语义（通知、命令）走阶段 3 的服务或宿主 IPC。

---

## 阶段 3 · components + services（原子组件 + 系统服务）

**适合**：开始成批替换存量控件、统一命令/偏好/通知基础设施。

```bash
pnpm add @ux/components @ux/services
```

```ts
// main.ts
import '@ux/components/styles.css'
import { UxContextMenuHost, UxToastHost } from '@ux/components'
import { createI18n, provideI18n, createPreferences, setPlatformAdapter } from '@ux/services'
```

- **组件按需引入**（SFC 可 tree-shake）；`data-ux` 稳定锚点供 e2e 使用，勿依赖样式类与文案。
- **命令式单例必须挂 Host**（应用根部挂载一次）：
  - `UxToastHost` ← `notify` / `notifyOnce` / `dismissToast`；
  - `UxContextMenuHost` ← `openContextMenu` / `openContextMenuAt`（全局拦截原生 contextmenu，红线 9）。
- **services**：
  - `createI18n` + `provideI18n`：文案单一来源（红线 16），`check-i18n` 校验各语言叶子 key 对齐；
  - `createPreferences`：单一 localStorage key + 版本号 + `migrate` 迁移链，终结偏好存储碎片化；
  - `setPlatformAdapter`：Tauri/Electron 注入 `windowControls`（frameless 窗控）、`windowPlacement`（多显示器摆放，参考 `docs/window-placement.md`）、`applyWindowMaterial`（§11.5）、`registerToastIdentity`（§11.6）；web 宿主仅需 `createWebWindowControls`。
- **PlatformAdapter 红线**（规则 12）：渲染层只认契约对象，未声明的能力 = 编译期不可用。

---

## 阶段 4 · shell / patterns（workbench 型应用）

**适合**：PDB / MdReader 型整体套壳（标题栏 + 停靠工作台 + 状态栏）。

```bash
pnpm add @ux/shell @ux/patterns
```

```ts
// main.ts
import '@ux/shell/styles.css'
import '@ux/patterns/styles.css'
import { UxAppShell, UxDockWorkbench, UxTitleBar, UxStatusBar, UxActivityBar } from '@ux/shell'
import { CommandPalette, SettingsShell, TourGuide, UxDataTable, UxSplash } from '@ux/patterns'
```

- frameless 窗控、splash 收场、停靠布局全部经 PlatformAdapter / 现成组件组合。
- **注意**：设计方案 §8 的 `createUxKit(...)` 一站式装配是**规划中的目标形态**，当前尚未实现——本阶段按上述组件自行组合即可，接口形态以各包 index 导出为准。

---

## Tauri 多窗口专项（每窗口独立 Vue app）

1. **每窗口独立 document**：CSS 引入、Host 挂载、i18n / preferences 实例各自独立。
2. **偏好跨窗口一致**：`createPreferences` 用同一个 localStorage key（同源共享），各窗口实例读同一份数据；写入方广播 storage 事件即可对端刷新。
3. **平台适配每窗口注入**：`setPlatformAdapter` 在每个窗口的 main.ts 各调一次。
4. **主题 / 语言跨窗口同步**：宿主广播（Tauri event）或 storage 事件 + 各窗口 `applyTheme` / `i18n.setLocale`。
5. **平台踩坑**见设计方案 §11：`dragDropEnabled` 不必关（UxTree 已指针兜底，§11.1）；DWM 圆角与亚克力经 `applyWindowMaterial`（§11.5）；通知身份注册（§11.6）；窗口位置落盘前坐标校验（§11.7）。

---

## 案例：TigerNote（首个真实消费者）

- **实际接入**：阶段 1（tokens only）——便签卡片 / 抽屉面板大量消费 `--ux-fg-*`、`--ux-accent-*`、`--ux-control-h-*` 语义令牌。
- **反哺**：改进提案 P1–P3 的全部证据来源；P1-1 表单控件组、P2-2 OS 集成模式（§11.5–11.7）均源自其踩坑与手搓替代。
- **建议路线**：阶段 2 优先 `useDismiss` + `useFocusTrap`（替换 `NoteCard.vue` 手写的弹层关闭逻辑）；阶段 3 优先 `UxCheckbox` / `UxSwitch`（替换 `DrawerWindow.vue` 手搓玻璃复选框；glass 变体为 P1-3 晋升候选，流程见设计方案 §9 与 CONTRIBUTING.md）。
