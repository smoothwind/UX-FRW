# UxKit 改进提案（P1–P3）

> 提案日期：2026-11-02
> 状态：**已评审**（2026-11-02，逐项处置见「优先级总表·评审处置」列与文末「评审结论」；三处过时事实已批注修正）
> 证据来源：TigerNote（Tauri 2 桌面便签，首个真实消费者）接入反馈 + 仓库现状盘点
> 范围说明：分发闭环（npm 发布 / version PR 停摆 / file: 依赖脆弱性，原 P0）单独跟踪，本提案不含

---

## 背景

UxKit 目前处于「M5 后、M6/M7 前」的预采纳状态：规格与实现齐备度较高（16 组件 + 12 shell + 7 patterns + 8 composables），但尚未被任何真实应用完整消费。TigerNote 已以 `@ux/tokens`（file: 依赖）接入，并在抽屉面板/便签卡片中大量使用 `--ux-fg-*`、`--ux-accent-*`、`--ux-control-h-*`、`--ux-radius*` 语义 token。本提案归纳接入过程中暴露的缺口与踩坑，按 P1（组件缺口）/ P2（实战经验反哺）/ P3（文档与治理）三档组织。

---

## P1 · 组件缺口（高优先：第一个消费者即撞上）

### P1-1 表单控件组补齐（§6.3 已规格未实现）

**现状**：`UxCheckbox / UxSwitch / UxSelect / UxTextarea / UxSlider` 在 §6.3 组件清单中有规格，但 `packages/components` 中不存在；除 `UxInput` 外没有任何表单控件。

**证据**：TigerNote 抽屉的分类树筛选需要复选框，最终手搓了玻璃风复选框（`DrawerWindow.vue` 内 `.tree-check` 系列 + 原生 input 定制），并把「复选框风格统一」作为显式用户需求提出。这是桌面应用最高频的缺失轮子。

**建议**：
- 按 §6.3 规格补齐，优先级：`UxCheckbox` → `UxSwitch` → `UxSelect` → `UxTextarea` → `UxSlider`
- 每个控件遵循现有模式：headless 行为放 `@ux/composables`，样式只用语义 token（CI R1–R3 约束）
- 提供 `data-ux` 稳定锚点与键盘可达性规格（对齐 §6.6 菜单系统的 APG 对齐标准）

### P1-2 缺失的 composables（§6.1 列 13 个仅实现 8 个）

**现状**：`useRunSeq / useDragSort / useConfirm / useNotify / useTour / useTocObserver / useSearchText` 已规格未实现（notify/tour 目前以组件形态存在）。

**证据**：TigerNote 的删除确认、提醒弹层（datetime-local + 重复周期选择 + 确定/清除）均为自行实现；`useDismiss`/`useFocusTrap` 因仅接入 tokens 而未能复用，便签弹层的 Esc/外点关闭逻辑重复手写（`NoteCard.vue` 的 `onDocMouseDown`/`onKeydown`）。

**建议**：优先补 `useConfirm`（Promise 式确认 API，供无 shell 的轻量窗口使用）与 `useNotify`（与 `ToastHost` 解耦的命令式入口）；其余按 M6/M7 需求排序。

### P1-3 建立「消费者模式晋升」流程

**现状**：框架的组件/模式全部来自 PersonalDb/MdReader 两个源头项目（§1.1），缺少从新消费者反向沉淀的通道。

**建议**：
- 在 §9 路线图增加「consumer-proven → @ux/patterns」晋升流程：消费者应用中验证过的模式，经评审后升格为框架模式组件
- 首个候选：TigerNote 的**玻璃复选框**（glass 变体）与**提醒徽标 + 弹层**（`NoteCard.vue` 已实现，含 `prefers-reduced-motion` 降级）——可作为 `UxCheckbox` glass 变体与 §6.5 新 pattern 的输入

---

## P2 · 实战经验反哺（TigerNote 踩坑沉淀）

### P2-1 材质/玻璃 token 层缺失

**现状**：三层 token（primitives / semantic / layout）没有「材质」维度。`--ux-bg/panel/overlay` 为不透明语义色，silk 主题的 sheen fx 是主题内特例。

**证据**：TigerNote 为玻璃材质自造了完整平行层 `--tn-glass-*`（blur/saturate/border/highlight/sheen/aurora/shadow，见 `theme.css`），且已在 `DESIGN.md` 记录「深色主题下玻璃参数随后续 .dark 通道微调」的欠账。

**建议**：在 `semantic.css` 新增材质 token 组（示例命名）：
- `--ux-material-blur(-lg)` / `--ux-material-saturate`：backdrop-filter 档位
- `--ux-glass-border(-strong)` / `--ux-glass-highlight` / `--ux-glass-sheen`：玻璃描边/受光/渐变
- `--ux-glass-surface(-deep)`：半透明表面色（rgba）
- **必须含降级策略**：不支持窗口透明的环境回退为不透明 `--ux-bg-*`（Tauri Win10 blur 回退、Electron 关闭透明）
- 三主题各给一套值（`.dark` 下玻璃参数需单独调校），并在 `check-tokens.mjs` 增加 R5：玻璃属性（backdrop-filter 等）禁止裸值

> **评审批注（2026-11-02）**：现状描述需修正——`data-ux-fx` 已是**主题无关**的特效通道（非「主题内特例」，浅色主题挂 sheen 有 e2e 用例背书），且 frost 特效已参数化 backdrop-filter（`--ux-frost-blur/saturate/opacity`）+ `data-ux-fx-surface` 浮层标注机制。真实缺口是「**常驻材质语义** vs 可开关特效」之别（抽屉面板恒为玻璃，不是 opt-in 增强）。**修订后方向**：并入现有 fx 层做设计评审——将 frost 参数升格为常驻材质通道（或新增 `data-ux-material`），不再平行新建 `--ux-glass-*` 层，避免与 fx 层形成第二套重叠语义（同「表面纹理类互斥」问题，sheen/metal 已处理过一轮）。降级策略与 R5 检查器建议保留，价值不变。
>
> **落地标注（2026-11-04）**：已按修订方向实施——新增 `data-ux-material="glass"` 常驻材质通道（与 `data-ux-fx` 平行的独立语义，共用实现路径、参数互不覆盖），颜色 token 三主题齐备且全部由既有令牌派生；`data-ux-material-surface` 标注注入 + `@supports` 降级（设计方案 §4.5 成文）；`check-tokens` 新增 **R5**（backdrop-filter 禁裸值）。

### P2-2 OS 集成模式沉淀（扩充 §11 平台接入指南）

TigerNote 在 Windows 上踩到三个可复用结论，建议以「模式 + 代码片段」形式写入 §11（当前 11.1–11.4 未覆盖）：

1. **DWM 圆角与亚克力**：accent 亚克力 backdrop 铺满直角窗口，**`SetWindowRgn` 裁剪不生效**（实测角部仍为 backdrop 且与窗外桌面像素不连续）；正确做法是 `DwmSetWindowAttribute(DWMWA_WINDOW_CORNER_PREFERENCE = DWMWCP_ROUND)` 由 DWM 合成层整体裁剪，CSS 圆角半径与系统圆角（约 8px 逻辑像素）对齐。Win10 忽略该属性，需降级说明
2. **Toast 通知身份（AUMID）**：dev/便携运行时通知来源会显示 "Windows PowerShell"（notify-rust 默认 POWERSHELL_APP_ID），未注册 AUMID 时安装版静默失败。正确做法：启动时写 `HKCU\Software\Classes\AppUserModelId\<identifier>`（DisplayName + IconUri）并直接用 `tauri-winrt-notification::Toast::new(AUMID)` 指定身份
3. **多显示器坐标校验**：窗口位置落盘前必须校验是否在任一显示器可见区域内，否则拔掉显示器后便签「消失在屏外」

建议同时提供 `@ux/services` 的 PlatformAdapter 扩展位（如 `applyWindowMaterial` / `registerToastIdentity`），让 Tauri/Electron 宿主各自实现。

### P2-3 着色表面色板（tinted surface palette）

**现状**：语义 token 只有中性表面（bg/panel/sunken/overlay），没有「同族着色表面」概念。

**证据**：TigerNote 便签需要 6 色可切换，每色一组 `paper / paper-deep / fg / paper-o`（半透明纸面 + 深色正文 + 不透明副选），并与亚克力 tint 同源——这是便签/卡片类应用的通用需求。

**建议**：设计 `--ux-tint-*` 方案（如 `--ux-tint-{name}-surface/-deep/-fg/-opaque`），token 层只定义结构，具体色值由消费者注册（避免 CI R1「dark 适配仅限 semantic.css」被绕过）；给出注册 API 与对比度校验工具（fg 对 surface 的 AA 检查）。

### P2-4 增量接入指南（补写 MIGRATION.md）

**现状**：`MIGRATION.md` 被 §3 引用但不存在；现有使用方式（§8）面向新项目整体套壳（UxAppShell workbench）。

**证据**：TigerNote 是小部件型应用（无框置顶悬浮窗 + 自绘标题条），不可能套用 UxDockWorkbench；实际只接了 tokens，composables/components 未接。框架需要明确的渐进路径，否则「接入」退化为「只用 CSS 变量」。

**建议**：撰写 `docs/MIGRATION.md`：
- 阶段 1：tokens only（CSS 变量 + `applyTheme`），存量样式逐条替换为语义 token
- 阶段 2：composables（useDismiss/useFocusTrap/useHoverIntent 等无 UI 依赖项）
- 阶段 3：components（按需引入 SFC，含 ContextMenuHost/MenuPanel/UxPopover 局部挂载方式）
- 阶段 4：shell/patterns（仅 workbench 型应用）
- 每阶段给 Tauri 多窗口（每窗口独立 Vue app）场景的注意事项；附 TigerNote 作案例

---

## P3 · 文档与治理

### P3-1 补齐幽灵文档

`PRINCIPLES.md`、`MIGRATION.md` 被 §3/§8 引用但不存在；18 条硬规则只活在设计文档 §5 内。建议：PRINCIPLES.md 从 §1/§2/§5 拆出成独立文件（单一事实源仍是设计文档，拆出件做导读），MIGRATION.md 按 P2-4 撰写。

> **评审批注（2026-11-02）**：措辞修正——两文件出现在 §3 的**目录结构规划图**中（设计方案 L117-118），属「规划了未落地」，并非运行时引用 404。结论不变：随 P2-4 一并补齐。

### P3-2 规则编号统一

三套编号并存且互相引用：README 红线 1–10、设计文档规则 1–18、CI 检查器 R1–R4（如「红线 13/14」需跨文档对照）。建议：规则 ID 全局唯一化（如 `UX-R13`），README/检查器输出/文档全部引用同一 ID；`check-tokens.mjs` 等脚本的失败信息直接带上规则 ID 与文档锚点链接。

> **评审批注（2026-11-02）**：前提已过时——README 现已直接引用「红线 13/14/17/18」（对齐设计文档 18 条体系），「README 红线 1–10」的并存局面已不存在；「红线 N（设计规则）vs R N（检查器规则）」本就是两类对象的编号。**降级为小改进**：仅保留「CI 失败信息带规则 ID + 文档锚点链接」一条，全局唯一化重编号不再必要。

### P3-3 文档站点与 token 表自动化

621 行设计文档手工维护，token 值与文档必然漂移。建议：
- vitepress 站点：设计文档为主干，**token 参考表从 `primitives.css`/`semantic.css`/`layout.css` 自动生成**（构建时解析 CSS 自定义属性）
- CI 增加「文档引用完整性」检查：被引用的 docs 文件必须存在；§7 QA 表与 README 交付状态表自动对齐（如 `check-commands` 已交付但 §7 表未勾选的漂移）

### P3-4 icon registry 范围收敛或补齐

`registry.json` 约 30 个自绘图标，与「全套 lucide」的规格野心不匹配。二选一：(a) 明确收窄为「自绘最小集 + lucide 补集的映射规范」并写入 §6.3；(b) 按规格补齐。当前状态（check-icons 通过但覆盖面小）容易让消费者误以为图标已齐。

> **评审批注（2026-11-02）**：事实已失效——registry.json 现有 **84 个**图标（`obj-`/`act-`/`st-`/`file-` 四族，check-icons 校验语义唯一），「约 30 个」未计入本次进库的 registry 扩充。**收窄为单一动作**：把图标覆盖范围与四族命名规范写入 §6.3 成文即可，「二选一」决策不再必要。

---

## 优先级总表

| 编号 | 事项 | 落点 | 建议里程碑 | 验收标准 | 评审处置 |
|---|---|---|---|---|---|
| P1-1 | 表单控件 5 件套 | @ux/components | 下一个 minor | 每件含 Vitest + 键盘可达 + e2e 抽查 | ✅ 采纳（先 UxCheckbox / UxSwitch） |
| P1-2 | useConfirm / useNotify | @ux/composables | 同上 | 与组件解耦、单测覆盖 | ✅ 采纳 |
| P1-3 | 消费者模式晋升流程 | §9 + CONTRIBUTING | 文档先行 | 流程成文，首个晋升候选过评 | ✅ 采纳 |
| P2-1 | 材质/玻璃 token 组 | @ux/tokens semantic.css | minor + check-tokens R5 | 三主题齐备 + 降级路径成文 | ✏️ 修订后采纳（并入 fx 层评审，不建平行层） |
| P2-2 | OS 集成模式（圆角/AUMID/坐标校验） | §11 + services 扩展位 | 文档 + adapter 接口 | TigerNote 实测结论逐条落入 | ✅ 采纳 |
| P2-3 | --ux-tint-* 着色表面方案 | tokens 设计稿 | 设计评审先行 | AA 对比度校验工具可用 | ✅ 采纳（设计评审先行） |
| P2-4 | MIGRATION.md 增量接入指南 | docs/ | 文档先行 | TigerNote 四阶段路线图作为案例 | ✅ 采纳 |
| P3-1 | PRINCIPLES.md / MIGRATION.md | docs/ | 随 P2-4 | 引用不再 404 | ✅ 采纳（随 P2-4） |
| P3-2 | 规则编号统一（UX-R*） | 全仓 | CI 校验 | 三处引用同一 ID 体系 | ⬇️ 降级（仅 CI 失败信息带规则 ID + 锚点） |
| P3-3 | 文档站点 + token 表自动生成 | docs/ 构建 | 排期可选 | token 表构建产物零手工 | ⏸ 排期可选（token 表自动生成优先） |
| P3-4 | icon registry 范围决策 | §6.3 + registry.json | 决策先行 | 规格与实际覆盖一致 | ✂️ 收窄（84 个图标，仅 §6.3 成文） |

---

## 评审结论（2026-11-02）

**总体判定：提案成立，予以采纳。** 这是框架首个真实消费者的系统性反哺，证据链具体可核——P1-1/P1-2 的缺口逐项属实（components 15 个中 input 是唯一表单控件；composables 实现 8 个、§6.1 另有 7 个仅规格），P2-2 的 Windows 实测结论均为可信的桌面端通用坑。三处事实随仓库演进过时（P2-1 与 fx 层现状冲突、P3-2 编号已统一、P3-4 图标数量），已在上文批注修正，不影响提案主体。

**优先落地顺序**：
1. **P1-1** UxCheckbox / UxSwitch——消费者已手搓替代，最高频缺口
2. **P2-2** OS 集成模式落 §11 + `PlatformAdapter` 扩展位——低成本、低风险
3. **P2-4** MIGRATION.md——决定第二个消费者的接入深度
4. **P1-2** useConfirm / useNotify → **P1-3** 晋升流程成文
5. **P2-1**（修订版）/**P2-3** 设计评审 → 通过后排期

---

## 附 · 证据索引（TigerNote 侧）

| 证据 | 位置 |
|---|---|
| 玻璃 token 平行层 | `src/shared/theme.css`（`--tn-glass-*`、`--note--*` 色板） |
| 手搓玻璃复选框 | `src/drawer-window/DrawerWindow.vue`（`.tree-check` 系列） |
| 手搓弹层关闭逻辑 | `src/note-window/NoteCard.vue`（`onDocMouseDown` / `onKeydown`） |
| 提醒徽标 + 弹层（晋升候选） | `src/note-window/NoteCard.vue`（`reminderText` / `.pop.reminder`） |
| 亚克力 tint 与 DWM 圆角 | `src-tauri/src/windows.rs`（`acrylic_tint` / `apply_round_corner_preference`） |
| Toast AUMID 注册 | `src-tauri/src/lib.rs`（`register_toast_identity`）、`src-tauri/src/reminder.rs` |
| 多显示器坐标校验 | `src-tauri/src/windows.rs`（`validate_position`） |
| i18n 硬编码（规则 16 待接入） | `src-tauri/src/tray.rs` 注释、各窗口中文文案 |
