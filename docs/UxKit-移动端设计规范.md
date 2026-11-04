# UxKit 移动端设计规范（规划稿）

> 规划日期：2026-11-04
> 状态：**规划（待评审）**
> 定位：UxKit 是「统一桌面交互框架」，本规范定义同一套令牌 / 组件 / 布局壳**响应式收缩到手机与平板 WebView** 的适配轨道。核心主张：**移动不是第二套组件库，而是语义令牌在窄视口 + 粗指针下的取值切换与交互范式映射**。
> 编号协调：`UxKit-改进提案.md` P2-1 已为玻璃检查保留 CI R5，本规范占用 R6（触控目标），互不冲突。
> 宿主假设：优先场景是 WebView 内嵌（Tauri iOS/Android、Electron 不适用移动、纯移动浏览器），桌面工作台形态完全不受影响。

---

## 一、定位与边界

| 策略 | 内容 |
|---|---|
| **同一代码库** | 组件不 fork 移动版；适配发生在「令牌取值切换（CSS）+ 行为映射（JS）+ 壳层收缩（Vue）」三层，与 dark-silk 主题 / fx 特效同构——都是 html 根属性驱动的横切通道 |
| **渐进增强** | 桌面形态是默认且完整形态；移动适配只允许**收缩**（隐藏窗控、单窗格化），禁止为移动在桌面端引入额外视觉 |
| **工具型应用优先** | 首个目标消费者是 TigerNote 类便签/工具应用（表单 + 列表 + 浮层），不追求复杂生产率工作台在手机上的完整体验 |

**明确不做**：原生组件重写；触屏优先重新设计桌面端；双击/悬停等桌面范式的「移动等价物」全覆盖（无消费需求不做）。

---

## 二、现状盘点（移动就绪度基线，2026-11-04 实测）

| 维度 | 现状 | 移动差距 |
|---|---|---|
| 控件高度 | `--ux-control-h-sm/md/lg = 24/28/32px` | 全部低于触控基线（44px，见 §9） |
| 字号 | `--ux-fs-xs~xl = 11~14px` | 移动正文过小；输入框 <16px 触发 iOS 聚焦自动放大 |
| hover 依赖 | 按钮/输入/菜单项/分段/药丸 hover 态、UxTabs hover 才现关闭钮、UxTooltip 120ms hover 触发、子菜单 hover 走廊（useHoverIntent） | 无 hover 设备上这些交互全部失效，需逐项映射（§4） |
| 触控感知 | 仅 `UxTree.vue` 一处 `pointerType === 'touch'` 守卫（拖拽起手） | 右键菜单、拖拽排序、悬浮窗拖动均无触控路径 |
| 响应式断点 | 全仓仅 1 处：`SettingsShell` 窄屏（≤720px）分类导航横排 | 无统一断点体系，720px 为孤例 |
| 视口/安全区 | 无 safe-area、viewport、pointer 令牌；`windowPlacement` 契约面向桌面多显示器 | 刘海屏/底部手势条会遮挡内容 |
| 平台契约 | `PlatformAdapter = windowControls / closeSplash / windowPlacement`（全桌面能力） | 无触感、返回键、软键盘 inset 能力 |
| E2E 设备矩阵 | 仅 `Desktop Chrome` 项目 | 零移动视口/触摸覆盖 |
| 动效可访问性 | `prefers-reduced-motion` 在 4 处样式 + UxSplash 组件内正确降级 | ✅ 已达标，移动端直接受益 |

> 结论：令牌与组件的语义分层质量高（改令牌即可全局切换），这是移动适配成本低的基础；但**输入范式是纯桌面的**，壳层无收缩路径，这两块是规划主体。

---

## 三、令牌层扩展（@ux/tokens）

### 3.1 断点登记制

CSS 媒体查询**不能消费 CSS 变量**（`@media (max-width: var(--x))` 无效），断点必须双源登记：

```css
/* layout.css 新增 */
:root {
  --ux-bp-sm: 600px;   /* 手机横排及以上（窄屏收缩边界） */
  --ux-bp-md: 960px;   /* 平板竖排及以上（双栏可用边界） */
  --ux-bp-lg: 1280px;  /* 桌面工作台完整形态边界 */
}
```

- TS 常量同源导出（`export const BP = { sm: 600, md: 960, lg: 1280 }`），供 JS 判断与 Playwright 配置引用；
- 现有 720px 孤例**登记为历史特例**，限期迁移到 `--ux-bp-sm`（600px）；
- CI 约束（R3 扩展）：媒体查询中的宽度字面量只允许出现在 `layout.css` 登记处与白名单（0、-1px 这类非断点值不受限）。

### 3.2 触控目标令牌（coarse 指针一档切换）（已落地：`packages/tokens/src/layout.css`）

组件继续消费 `--ux-control-h-*`，**取值由根属性切换**——组件零改动：

```css
/* semantic.css 或独立 media.css：粗指针下整档提升 */
@media (pointer: coarse) {
  :root {
    --ux-control-h-sm: 36px;
    --ux-control-h-md: 44px;   /* 触控基线，见 §9 决策 */
    --ux-control-h-lg: 48px;
    --ux-row-h: 40px;          /* 列表/表格行高（桌面 26px） */
  }
}
```

实施注意：`UxDataTable` 虚拟滚动（`useVirtualRows`）依赖**固定行高**，行高令牌切换时组件需重算窗口（监听令牌值变化或由 viewport 通道触发 remeasure——已有 ResizeObserver，需补行高变化路径）。

### 3.3 安全区令牌

```css
:root {
  --ux-safe-top: env(safe-area-inset-top, 0px);
  --ux-safe-right: env(safe-area-inset-right, 0px);
  --ux-safe-bottom: env(safe-area-inset-bottom, 0px);
  --ux-safe-left: env(safe-area-inset-left, 0px);
}
```

配套要求：宿主页面 `<meta name="viewport" content="..., viewport-fit=cover">`；壳层（§5）的底栏/顶栏消费这些令牌。部分 Android WebView `env()` 不可靠——由 §8 的 `safeAreaInsets` 宿主上报兜底（运行时覆写同名令牌，与 PreferencesService 注入偏好同一机制）。

### 3.4 视口状态通道 `data-ux-viewport`

与 `data-color-mode` / `data-ux-fx` 同构的根属性通道，空格分隔：

```
data-ux-viewport="sm coarse portrait"
```

由 `applyViewport()`（tokens 包，与 `applyTheme` 并列）维护：`matchMedia` 监听断点 + `(pointer: coarse)` + `(orientation)`，rAF 节流写根属性。CSS 用属性选择器收缩布局（§5），e2e 用它断言。**任何组件不得自行 matchMedia**（红线：视口判断唯一出口）。

### 3.5 字号与输入缩放

- `pointer: coarse` 下 `--ux-fs-md: 14px`、正文区 ≥15px；
- **输入类控件字号 16px 硬基线**（触控下）：`--ux-input-fs: 16px`——低于 16px 的输入框聚焦时 iOS WebView 自动放大页面，视觉补丁不可靠，直接提字号；
- `touch-action: manipulation` 加于全部可交互控件基类，消除双击缩放延迟（现代 WebView 已无 300ms 点击延迟，但双击缩放仍会吞快速连点）。

---

## 四、输入范式映射（全组件通用基线）

| 桌面范式 | 移动映射 | 落点 |
|---|---|---|
| hover 悬停态 | `:active` 按下态（视觉同 hover 值） | 样式层：hover 规则并列 `:active` |
| hover 才浮现的操作（页签关闭钮、行内动作） | **常显**（缩小尺寸不缩语义） | UxTabs / 列表行 |
| 右键 / `Shift+F10` | **长按 350ms** → `openContextMenuAt(x, y)`；触发瞬间轻触感（§8 haptics） | ContextMenuHost 触发器扩展 |
| hover 走廊（useHoverIntent / 子菜单） | coarse 下跳过延迟直开；子菜单二级改为**点击展开/收起**（不跟随指针） | MenuPanel |
| UxTooltip（hover 120ms） | coarse 下**禁用浮层**；信息不丢（aria-label 已必填，红线 10/14） | UxTooltip 内部守卫 |
| 键盘快捷键 | 手势 + 常驻入口（命令面板按钮，见 §5） | 壳层 |
| HTML5 DnD（页签排序/树拖拽/面板拖动） | 长按拾起 + Pointer Events 拖拽（UxTree 已有 touch 守卫先例，泛化为通用 `useDragPointer`？——实施期评审，先逐组件内建） | tabs / tree / panel |
| 双击（面板头停靠⇄悬浮、行复制） | 保留双击；移动下这些操作同时提供显式按钮（双击是加速器不是唯一路径） | panel / data-table |
| Esc 关闭浮层 | 系统返回手势/返回键（§8 onBack → Esc 语义）+ 浮层自身关闭钮 | services + 宿主 |
| 滚轮滚动 | 原生触摸滚动；浮层内 `overscroll-behavior: contain` 防滚动穿透 | 样式层统一 |

长按细节（决策 D-3）：阈值 350ms；长按期间移动 >10px 判定为滚动意图并取消；可选中文本区域（`user-select: text`）不触发长按菜单，避免与系统文本选择冲突；触发后若位置有锚点元素则按元素语义（同右键），否则按坐标。

---

## 五、布局壳收缩（@ux/shell）

| 壳 | ≤ sm（手机） | md~lg（平板→桌面） |
|---|---|---|
| `UxAppShell` | titlebar / menubar 插槽**隐藏**（系统状态栏/导航接管），内容区消费 `--ux-safe-top/bottom` | 不变 |
| `UxActivityBar` | 转为**底部导航条**：高 56px + safe-bottom，≥5 项折叠进「更多」sheet；语义不变（`aria-pressed`/badge/pinned 全保留） | ≥ md 回到左侧 Rail 48px |
| `UxDockWorkbench` | **单窗格栈**：一次只渲染活跃面板，切换走底部导航；停靠/悬浮/拖拽禁用（`useDockLayout` 提供 compact 只读模式，持久化布局仍兼容读回） | 不变 |
| `UxFloatPanel` | 退化为**全屏 sheet**（关闭钮 + 返回手势关闭）；拖动/resize 禁用 | 不变 |
| `UxTitleBar` | 窗控隐藏（`windowControls` 不注入即已隐藏，天然兼容） | 不变 |
| `UxStatusBar` | 隐藏，关键状态并入面板工具栏 | 不变 |
| `UxSplitter` / `UxSplitPane` | 不渲染（单列） | 不变 |
| `UxTabs` | 页签栏横滑（scroll-snap）、关闭钮常显（36px 命中区）、长按页签出编排菜单（复用现有右键编排项） | 不变 |
| 命令面板入口 | 底部导航条右侧常驻搜索钮（Ctrl+K 语义的触达替代） | 不变 |

实现载体：壳组件模板内 `data-ux-viewport` 属性选择器收缩 + 少量 `v-if`（compact 模式由注入的 viewport 响应式状态驱动，禁止组件内裸 matchMedia，见 §3.4）。

---

## 六、原子组件适配矩阵（@ux/components，16 个）

| 组件 | 适配 | 动作 |
|---|---|---|
| `UxButton` | 高度随 `--ux-control-h-*` 自动提升；**命中区补贴**：视觉不足 44×44 时伪元素扩展命中区（视觉不变） | 改样式层，全组件复用的通用机制 |
| `UxInput` | 16px 输入字号（§3.5）；`visualViewport` 键盘弹出时滚动定位到可见区 | 改样式 + 输入聚焦逻辑 |
| `UxDialog` | ≤sm 变 **bottom sheet**：贴底 + 圆角顶 + safe-bottom；保留 focus trap / Esc（返回键）语义；**不做下滑关闭**（误滑率高，关闭走按钮/返回） | 布局收缩，行为不变 |
| `UxTooltip` | coarse 禁用浮层 | 内部守卫 |
| `UxContextMenuHost` | 长按触发（§4）；二级子菜单移动端改为分组展开或全屏推入（实施期二选一） | 触发器扩展 |
| `UxPopover` | 防溢出已有 ✓；键盘 inset 变化时重算锚定 | 补 viewport 重算 |
| `UxToastHost` | coarse 下默认 **top**（避开底部手势条）+ safe-top | 位置令牌切换 |
| `UxSegmented` / `UxFilterChips` | 高度自动提升；容器横滑（不换行挤压） | 样式层 |
| `UxTree` | 长按节点菜单（右键路径已有）；展开箭头命中区 ≥36px；拖拽触控路径（§4） | 中等改动 |
| `UxMenuBar` | 移动不适用（宿主导航接管）；不强改 | 声明边界即可 |
| `UxDropdown` | 高度提升即兼容 | 零改动 |
| `UxBadge` / `UxChip` / `UxKbd` / `UxIcon` | 不变（Kbd 移动端文案由 i18n 层处理快捷键可隐藏——宿主决策） | 零改动 |

---

## 七、复合模式适配（@ux/patterns，9 个）

| 模式 | 适配 |
|---|---|
| `CommandPalette` | 移动全屏化 + 输入框 16px——命令面板是快捷键范式的核心替代，移动端价值更高 |
| `UxDataTable` | ≤sm 推荐**卡片列表降级模板**（主行 + 展开详情，虚拟滚动保留）；排序/右键动作并入卡片长按菜单 |
| `SettingsShell` | 已有 720px 窄屏横排 ✓（迁移到统一断点即可） |
| `TourGuide` | 聚光遮罩保留，步骤卡片贴底 + safe-bottom |
| `UxSplash` | 居中窗体天然适配 ✓（已在桌面验证，移动仅缩小尺寸档） |
| `EmptyState` / `ErrorState` / `LogPanel` / `UxConfigList` | 间距/高度随令牌提升，无结构性改动 |

---

## 八、服务层移动契约（PlatformAdapter 扩展）

沿用 `closeSplash?` / `windowPlacement?` 的模式——**全部可选、web 端 no-op 兜底、check-commands 契约比对扩展**：

```ts
export interface HapticsAdapter {
  /** impact: 'light' | 'medium' | 'heavy'；notify: 'success' | 'warning' | 'error' */
  impact(style: 'light' | 'medium' | 'heavy'): void
  notify(type: 'success' | 'warning' | 'error'): void
}

export interface PlatformAdapter {
  // ...现有 windowControls / closeSplash / windowPlacement
  /** 移动端：触感反馈（长按菜单、下拉刷新完成、破坏性操作确认） */
  haptics?: HapticsAdapter
  /** 移动端：系统返回（Android 返回键/手势）→ 注入方映射到 Esc 语义；返回取消函数 */
  onBack?(handler: () => void): () => void
  /** 移动端：软键盘 inset 变化（WebView env()/visualViewport 不可靠时宿主上报） */
  onKeyboardInset?(listener: (height: number) => void): () => void
  /** 移动端：可靠的安全区数值（兜底 §3.3 env() 失效场景，运行时覆写令牌） */
  safeAreaInsets?(): Promise<{ top: number; right: number; bottom: number; left: number }>
}
```

- `haptics` 缺失时长按菜单静默跳过触感（非阻断依赖）；
- `onBack` 语义 = 「关闭最上层浮层，无浮层则上报宿主决定是否退出」——与 Esc 栈共用同一控制器；
- Tauri 移动端：haptics 走官方插件、返回键走 `onBackPressed` 拦截；Electron 不实现（桌面）。

---

## 九、无障碍与动效基线

| 项 | 决策 |
|---|---|
| 触控目标尺寸 | WCAG 2.2 **2.5.8 AA 最低 24px / 2.5.5 AAA 44px**；iOS HIG 44pt、Material 48dp。**UxKit 取 44px 为 md 基线**（§3.2），sm 档 36px 仅限密集工具场景且需命中区补贴补足 44×44（决策 D-1） |
| focus ring | coarse 下 `:focus-visible` 天然不触发（触摸不产生键盘焦点环），键盘外接时仍保留完整 ring——零改动，靠现有令牌 |
| reduced-motion | 已达标（4 处样式 + UxSplash），移动端直接继承；新增的 sheet/底部导航动效**必须**走 `--ux-dur-*` 令牌并在 reduce 下禁用 |
| 对比度 | 主题令牌已按 AA 校准（e2e axe 守护），移动不改配色——黑暗主题 dark-silk 在 OLED 移动屏上是天然增益 |
| 读屏 | 移动 VoiceOver/TalkBack 走同一 aria 体系（role/aria-* 全保留），e2e 不重复覆盖（宿主验收） |

---

## 十、质量门禁与测试

**CI 红线扩展**（check-tokens）：

- **R6（触控目标）**：`pointer: coarse` 作用域内可交互元素高度声明必须消费 `--ux-control-h-*` / `--ux-row-h` 触控档，禁止 24/28/32px 字面量回潮；
- **R3 扩展（断点登记）**：媒体查询宽度字面量只允许出现在 `layout.css` 登记处（§3.1）；
- 改进提案 P2-1 保留 R5（玻璃），与本规范编号已协调，落地顺序不分先后。

**E2E 设备矩阵**（零额外安装成本——chromium 自带移动模拟）：

- `playwright.config.ts` 增加 `mobile` project：`devices['iPhone 13']`（缺口屏验证 safe-area）+ `devices['Pixel 7']`（Android 返回键路径），`hasTouch: true`；
- 新增 `e2e/mobile.spec.ts`：底部导航切换 / 长按右键菜单 / Dialog bottom sheet + 返回关闭 / 输入聚焦不缩放（16px）/ 横竖屏旋转冒烟；
- 现有 30 用例不动（桌面形态回归保障）。

**体积红线**：移动适配新增 CSS/JS 计入现有 `size-budget.json`，超预算走 `pnpm size --update` 评审流程（既有纪律，不新增机制）。

---

## 十一、落地路线图（M9 移动轨道，三步）

| 步骤 | 内容 | 验收 |
|---|---|---|
| **M9a 令牌与基线** | 断点/触控/安全区令牌 + `applyViewport()` + `data-ux-viewport` 通道 + R3 扩展 + R6 + 本规范冻结 | playground 加移动演示页：三断点/coarse 切换可视化；check 门禁扩展生效 |
| **M9b 组件适配第一批** | 命中区补贴机制、按钮/输入/Dialog sheet/长按菜单/Tooltip 降级、Toast top、`mobile.spec.ts` | iPhone 13 + Pixel 7 模拟器全绿；桌面 30 e2e 不回归 |
| **M9c 壳层收缩** | ActivityBar→底部条、DockWorkbench compact、FloatPanel sheet、Tabs 触控编排、PlatformAdapter 移动四契约 + TigerNote 试点 | TigerNote 手机端接入走查（便签列表 + 抽屉 + 编辑器）；windowPlacement 桌面路径零影响 |

依赖关系：M9a 是纯 tokens/services 层改动，可与改进提案 P1-1（表单控件）**并行**——表单控件直接按本规范带触控档交付，避免二次返工。

---

## 十二、决策记录

| # | 决策 | 理由与备选 |
|---|---|---|
| D-1 | 触控基线 **44px**（非 48dp） | 与 iOS HIG 一致、对桌面 32px lg 档跃升最小；Material 48dp 作为 lg 触控档保留。24px AA 仅作为命中区补贴的合法下限，不作为体验基线 |
| D-2 | 断点**双源登记制**（CSS 令牌 + TS 常量 + CI 白名单），不引 PostCSS custom media | 仓库无 CSS 预处理管线，为 3 个值引入构建链不值；登记制 + CI 是现有红线治理的自然延伸 |
| D-3 | 长按阈值 **350ms** + 移动取消 + 文本选择区豁免 | 平衡误触与响应（系统长按选词 ~500ms 之前触发）；阈值进令牌便于宿主调校 |
| D-4 | Dialog 用 bottom sheet **不做下滑关闭** | 误滑率与焦点管理复杂度高；关闭按钮 + 返回手势已覆盖退出语义，符合「破坏性操作双保险」精神 |
| D-5 | 视口判断**唯一出口** `data-ux-viewport` 通道，组件禁裸 matchMedia | 与 `applyTheme`/`data-ux-fx` 同构；散落 matchMedia 是响应式不可测的根因 |
| D-6 | 移动轨道**不设独立发布物**，随各包正常版本化 | 移动是令牌/组件的内在维度，不是新包；changesets 流程零改动 |
