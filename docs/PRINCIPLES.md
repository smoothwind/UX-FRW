# UxKit 设计规范导读（PRINCIPLES.md）

> **定位声明**：本文是**导读件**，不是规范的事实源。全部规则与证据的单一事实源是
> [docs/UxKit-设计方案.md](./UxKit-设计方案.md)：
>
> - **§1** 两项目 UX 共性提炼（已验证模式 + 共同痛点）
> - **§2** 业界方案借鉴要点（Fluent 2 / shadcn / VSCode / Primer / reka-ui）
> - **§5** UX 设计规范（18 条硬规则**全文**）
>
> 本文只做速览与 CI 对照。规则表述如与 §5 冲突，**以 §5 为准**（避免双源漂移）。
> 落地背景：改进提案 P3-1（原「幽灵文档」——§3 目录结构规划了本文件但未创建）。

---

## 一、已验证模式速览（设计方案 §1.1，共 15 条）

来自 PersonalDb 与 MdReader 两个真实项目的共性沉淀，每条的双方证据与业界同源见 §1.1 表格：

| # | 模式 | 业界同源 |
|---|------|---------|
| 1 | 令牌驱动的主题系统 | shadcn 语义 token、Fluent 2 token |
| 2 | 暗色只翻转语义层 | shadcn `.dark` 覆盖 |
| 3 | 命令即一切入口 | VSCode ICommandService |
| 4 | 能力驱动 UI（when 子句） | VSCode when |
| 5 | 错误即动作（恢复型错误设计） | GitHub / Linear |
| 6 | 全局禁用原生右键、自绘菜单 | 现代桌面应用惯例 |
| 7 | 三态完备（loading / empty / error） | 设计系统基线 |
| 8 | 破坏性操作防护（确认框 / 武装式二次点击） | macOS / Windows HIG |
| 9 | 竞态防护 runSeq（过期响应作废） | abortable fetch |
| 10 | 工作台式布局（标题栏 + 停靠 + 状态栏 + 悬浮层） | VSCode / Obsidian / Typora |
| 11 | 快捷键双 scope（global / editor + 用户覆盖） | VSCode keybinding contexts |
| 12 | 漫游引导（data-tour 锚点 + 剔除不可见锚点） | Onboarding 最佳实践 |
| 13 | 设置页双栏结构（改完即生效 + 预设方案） | VSCode Settings |
| 14 | 平台适配层单接口（依赖倒置） | dependency inversion |
| 15 | 偏好即时生效（apply 直改 DOM / CSS 变量注入） | 现代应用惯例 |

反面教材（§1.2 共同痛点）同样重要：按钮 10 处重复实现、右键菜单拷贝 3 次、
偏好存储 15+ 个 key、2700 行巨型组件——每一条都对应 UxKit 的一个包或一条硬规则。

---

## 二、业界借鉴（设计方案 §2）

| 方案 | UxKit 吸收的核心 |
|------|-----------------|
| Microsoft Fluent 2 | 4px 间距网格、字号阶梯、阴影四级 elevation、圆角档位、Mica/Acrylic 表面分层 |
| shadcn / shadcn-vue | 语义 token 成对约定（bg/foreground）、圆角单一来源派生、组件只消费语义层、headless 思想 |
| VSCode Workbench | 命令注册表统一四类入口、`when` 上下文、workbench 停靠布局 |
| GitHub Primer | 中性灰 12 级、语义色浅深双套、`data-color-mode` 切换 |
| reka-ui | 不引运行时依赖，但照抄其行为规格（focus trap、键盘导航、定位翻转） |

---

## 三、18 条硬规则速查（全文与编号见设计方案 §5）

带「红线」标记的 4 条（13/14/17/18）为不可豁免底线；其余规则违反即 CI/评审阻断。

| 规则 | 一句话摘要 |
|------|-----------|
| 1 令牌优先 | 颜色/字号/间距/圆角/阴影/层级一律来自语义令牌，`check-tokens`（R1–R4）强制；数据配色用 `tokens-exempt` 行级豁免。 |
| 2 命令驱动 | 任何可触发动作注册为 `Command`，UI 控件只触发不自带逻辑——一处注册，菜单/工具栏/快捷键/右键/面板五类入口同时可用。 |
| 3 能力驱动显隐 | 控件可用性由 `when` 表达式决定，不做硬编码 if；能力变化 → 命令自动启停 → UI 自动刷新。 |
| 4 错误即动作 | 错误呈现必须附带恢复动作（重试/重连/查看日志/复制详情）；同类错误 `notifyOnce` 5 秒去重。 |
| 5 三态完备 | 任何数据区域显式处理 loading / empty / error，禁止空白一片。 |
| 6 破坏性操作双保险 | 不可逆操作用 Promise 化确认框（Esc=取消、Enter=确认）或武装式二次点击；保存链路零容忍——任一失败停留不退出。 |
| 7 竞态防护 | 可重复发起的异步操作必须走 `useRunSeq` 或 AbortController，过期响应静默丢弃。 |
| 8 键盘完备 | 浮层支持 ↑↓ / Enter / Esc / Home / End / 首字母跳转；`Ctrl+K` 永远保留给命令面板。 |
| 9 右键菜单统一 | 全局拦截原生 contextmenu，一律 `UxContextMenu`（Teleport + 防溢出 + 键盘导航）；菜单项来自命令注册表。 |
| 10 无障碍基线 | focus trap + aria-modal、通知 aria-live、图标按钮 aria-label 必填、全组件键盘可达。 |
| 11 偏好即时生效 | 设置改完即生效（无保存按钮）；「需重启」类必须单独分区明确提示。 |
| 12 平台适配单接口 | 渲染层只认一个契约对象（PlatformAdapter），多端同签名实现，CI 校验一致性；未声明能力 = 编译期不可用。 |
| 13 图标语义唯一（红线） | iconId ↔ 语义一对一（`obj-*`/`act-*`/`st-*` 注册表）；单状态单图标；`check-icons` 校验。 |
| 14 禁止易困惑图标（红线） | `×` 仅关/清、删除必垃圾桶 + danger；箭头一箭一义；`+`/`−`/软盘/信封等禁例清单见 §5 规则 14。 |
| 15 快捷键唯一占用 | 一键一命令（冲突自动挂起）；输入框聚焦默认不触发；避开浏览器/系统保留键位；`check-shortcuts` 校验。 |
| 16 文案单一来源 | 一切文案走 i18n key，各语言包叶子 key 完全对齐；`check-i18n` 校验。 |
| 17 列表行单行与信息层级（红线） | 单行一条记录，类型必须由图标承担；机器信息（权限/校验和）进 tooltip；行内 hover 浮现操作 ≤2 个。 |
| 18 状态指示与强调克制（红线） | 状态图形只用于偏离预期的态（正常态不挂绿勾）；强调信号 ≤2 种；分区头不放图标；着色文字只用 `accent-fg`。 |

---

## 四、CI 检查器 ↔ 规则对照

`pnpm check` 五件套 + e2e 无障碍 + 体积红线；检查器实现见 `scripts/`，规则全文见 §5：

| 检查器 | 校验内容 | 对应规则 |
|--------|---------|---------|
| `check:tokens` R1 | 禁裸颜色字面量（`tokens-exempt` 行级豁免） | 规则 1 |
| `check:tokens` R2 | 间距 >4px 走 `--ux-sp-*` | 规则 1 |
| `check:tokens` R3 | 禁字面量 z-index / 圆角 / 字号 / 阴影 | 规则 1 |
| `check:tokens` R4 | 行级选中禁 `--ux-bg-selected`，只准 `accent-subtle` + `accent-fg` | 规则 18（配合 1） |
| `check:tokens` R5 | `backdrop-filter` 禁裸值，只准 `--ux-material-*` / `--ux-frost-*`（材质通道 §4.5） | 规则 1 |
| `check:icons` | iconId ↔ 语义一对一 + 易困惑组合黑名单 | 规则 13、14 |
| `check:shortcuts` | 键位唯一占用（错误）+ 保留键位（警告） | 规则 15 |
| `check:i18n` | 各语言包叶子 key 完全对齐 | 规则 16 |
| `check:commands` | C1 命令引用完整性（悬空 id）；C2 PlatformAdapter 契约两端比对 | 规则 2、12 |
| e2e axe-core | 无障碍自动扫描 | 规则 10 |
| `pnpm size --check` | gzip 总量超预算即失败（治理项，非单条规则） | — |

一键本地全量门禁：`pnpm verify`（check + typecheck + lint + 单测 + e2e）。

---

## 五、消费者怎么用

- **怎么接入**：按 [docs/MIGRATION.md](./MIGRATION.md) 的四阶段增量路径
  （tokens → composables → components + services → shell / patterns），每阶段独立可停。
- **平台集成踩坑**（Tauri / WebView2 / Electron）：设计方案 §11
  （拖拽兜底 / DWM 圆角与亚克力 / Toast AUMID / 多显示器坐标校验）。
- **豁免方式**：令牌红线的确属数据配色场景，用 `tokens-exempt` 行内注释豁免（规则 1）；
  四条红线（13/14/17/18）无豁免通道。
- **规则有疑问时**：回到设计方案 §5 看全文与理由（每条规则都标注了来源项目证据）。
