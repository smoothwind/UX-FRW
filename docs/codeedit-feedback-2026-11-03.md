# UX-FRW 改进建议（来自 CodeEdit 分屏重做实践）

> 来源：CodeEdit 2026-11-03 分屏功能重做（docs 见 CodeEdit 仓库 `docs/split-research.md`）。
> 下游在集成 UxTabs / UxSplitter / SettingsShell / UxSegmented / UxTheme 时遇到的摩擦点，
> 按「现象 → 证据 → 建议」组织，标注 CodeEdit 当前的 workaround。

## P1 — 直接解锁下游能力

### 1. UxTabs：跨容器拖拽互操作
- **现象**：CodeEdit 分屏需要「拖页签到窗格头 → 该窗格打开」，但宿主拿不到拖拽来源，
  被迫在 App 层用 `@dragstart.capture` 读 DOM `data-ux-tab-id` 兜圈子。
- **证据**：`packages/shell/src/tabs/UxTabs.vue:130` —— `@dragstart="dragFromId = tab.id"`，
  纯内部 ref，不写 `dataTransfer`，也不向宿主 emit 拖拽生命周期。
- **建议**：
  - dragstart 时写入 `dataTransfer.setData('application/x-ux-tab', tab.id)`（带命名空间防冲突）；
  - 新增 `dragstart` / `dragend` emit，宿主可跟踪拖拽状态；
  - 可选：支持外部 drop 前反馈（宿主目标 `dragover` 时 UxTabs 能感知被拖走并显示占位样式）。
- **CodeEdit workaround**：`App.vue onTabDragStart` 读 `closest('[data-ux-tab-id]')`。

### 2. UxTabs：页签右键菜单可扩展
- **现象**：页签右键菜单硬编码五项（关闭/关闭其他/右侧/左侧/全部）。业界（VS Code、IntelliJ）
  拆分命令的**主入口**就是页签右键；CodeEdit 想加「在另一窗格打开 / 移动到另一窗格」无法注入，
  只能退而放进视图菜单，可发现性差一截。
- **证据**：`UxTabs.vue:62-73` `openContextMenu(e, [硬编码列表])`。
- **建议**：新增 `contextItems?: MenuItem[]` prop（追加到默认项之前/之后，或整体替换）；
  或 `@context-menu` 事件让宿主完全接管（`preventDefault` 语义）。
- **CodeEdit workaround**：命令放视图菜单 + 命令面板。

### 3. UxSplitter：双击重置比例
- **现象**：分隔条已有键盘调整与 aria 值（达标），但缺业界标配的「双击回到 50/50」。
- **证据**：`packages/shell/src/splitter/UxSplitter.vue` 无 dblclick 处理。
- **建议**：内置 dblclick → commit 中点（`(min+max)/2`），可加 `resetOnDblclick` prop（默认开）；
  UxSplitPane 无需改动即可受益。
- **CodeEdit workaround**：无（列为 P2 待框架支持）。

## P2 — 一致性 / 健壮性

### 4. 主题注册表缺失（dark-silk 事故的根）
- **现象**：并行会话给 `UxTheme` 加 `'dark-silk'` 后：① CodeEdit `prefs.theme` 窄联合类型编译失败
  （下游已修：直接引用 `UxTheme`）；② 更隐蔽的——CodeEdit 主题菜单**硬编码** `['light','dark','system']`，
  新主题根本不会出现在菜单里（现存缺口，未修）。
- **证据**：`packages/tokens/src/index.ts` 只有 `THEME_ATTR/SILK_CLASS` 等常量，无主题清单导出；
  CodeEdit `App.vue:337` `(['light','dark','system'] as UxTheme[])`。
- **建议**：tokens 导出 `UX_THEMES: Array<{ id: UxTheme; label: string; dark: boolean }>` 注册表，
  `resolveTheme/applyTheme` 与文档示例消费同一清单。下游主题选择器直接 map 注册表 →
  以后加主题零下游改动、零类型破坏。
- **CodeEdit 待办**：注册表落地后替换硬编码数组（顺带把 prefs.theme 的 UI 与 `UX_THEMES` 对齐）。

### 5. SettingsShell 导航底色与磨砂对话框冲突
- **现象**：`.ux-settings__nav` 不透明 `var(--ux-bg-panel)`，放进磨砂（半透明）对话框形成刺眼白块
  （直通底边、戳出圆角）。CodeEdit 只能应用级覆写 `background: transparent`。
- **证据**：`packages/patterns/src/styles.css` `.ux-settings__nav { background: var(--ux-bg-panel) }`。
- **建议**：nav 默认 `background: transparent`（分隔靠现有 border-right 已足够）；
  或提供 `variant="glass"`；至少确保在 `--ux-dialog` 半透明场景下视觉正确。
- **CodeEdit workaround**：`.ce-settings .ux-settings__nav { background: transparent }`。

### 6. UxSegmented 不可收缩
- **现象**：6 项编码分段 ~486px 超出 463px 内容区 → 行标签被压成竖排 + 横向滚动。
  CodeEdit 覆写 `flex-wrap: wrap` 才救回来。
- **证据**：`packages/components/src/styles.css` `.ux-seg { display: inline-flex }` +
  `.ux-seg__item { white-space: nowrap }`。
- **建议**：容器过窄时自动换行为芯片组（或提供 `wrap` prop）；可考虑 compact 尺寸档。
- **CodeEdit workaround**：`.ce-set__row .ux-seg { flex-wrap: wrap; max-width: 100% }`。

### 7. 菜单快捷键未用 UxKbd
- **现象**：MenuPanel 用纯文本 span 渲染快捷键，而 ShortcutsDialog 用 UxKbd 键帽——
  同一框架两套快捷键视觉语言。
- **证据**：`packages/components/src/menu/MenuPanel.vue:209`
  `<span class="ux-menu__kbd">{{ it.shortcut }}</span>`；对比 `components/src/kbd/UxKbd.vue`。
- **建议**：MenuPanel 改用 UxKbd；若担心密集菜单里键帽过重，至少统一字体/间距 token 并文档化取舍。

## P3 — 小项
- **UxTabs Delete 键直接关闭当前页签**（`UxTabs.vue:91`）：与 VS Code 一致，保留即可，
  但建议文档标注该行为，避免下游惊讶。
- **services i18n dev 警告**：缺失 key 目前静默返回 key 本身；dev 模式 console.warn 一次
  可帮下游更早发现键名 typo / 两份语言文件键漂移（CodeEdit 就靠自写 parity 脚本兜底）。

## 落地优先级建议
1 → 2 → 3 直接解锁下游分屏/页签体验（CodeEdit 已有 workaround，框架原生支持后可删 hack）；
4 是破坏面最大的一类问题（枚举扩展 = 下游 breaking），注册表化收益最高；
5/6/7 是视觉一致性打磨。

---

## 落地记录（2026-11-03，全部 7 条已实施）

- tokens：UX_THEMES: readonly UxThemeDef[] + UxThemeDef {id,label,dark}（packages/tokens/src/index.ts）
- UxTabs：dragstart 写 pplication/x-ux-tab + effectAllowed=move，新增 dragstart(id)/dragend(id) emit；contextItems?: (tabId) => MenuItem[] 拼在关闭组之前带分隔（packages/shell/src/tabs/UxTabs.vue）
- UxSplitter：@dblclick → commit((min+max)/2)（packages/shell/src/splitter/UxSplitter.vue）
- patterns：.ux-settings__nav background → transparent（packages/patterns/src/styles.css）
- components：.ux-seg 增 lex-wrap: wrap; max-width: 100%（packages/components/src/styles.css）；MenuPanel 快捷键 span → UxKbd
- 新增测试：UxTabs 拖出互操作 + contextItems 前置；UxSplitter 双击重置（shell 包 56/56 绿）
- 宿主接线（CodeEdit）：App.vue 删 DOM 探测拖拽 hack 改用新 emit、tabContextItems 两项、主题菜单/命令随 UX_THEMES 循环生成（Pascal 规则含连字符折叠，dark-silk → themeDarkSilk）；store.ts 增 moveDocToOtherPane(id)；app.css 删两处覆写；i18n 341=341
