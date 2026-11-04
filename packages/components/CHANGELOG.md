# @ux/components

## 0.4.0

### Minor Changes

- 5221b69: 新增 `@ux/patterns` **UxConfigList** 配置目录化编辑器 pattern（提炼自 PersonalDb SQL 模板设置页改版）：数据驱动分组折叠（`ConfigListGroup`，组头 disclosure 语义 `aria-expanded`/`aria-controls` + 完整 aria-label「名称 + 条数 + 覆盖数」）+ facet 多选筛选 + 覆盖状态筛选（全部/已覆盖/内置）+ 三路搜索（key/用途/值）+ 筛选反馈条（条件 × 匹配数 + 一键清除）+ 空态语义区分（筛选过严 → EmptyState `filtered` 变体 + 清除动作）+ 脏跟踪（未保存计数徽标）+ 批量保存（仅携带非空覆盖）/恢复全部内置（确认归宿主）；展开状态记忆：`storageKey` → `createPreferences` 版本化存储，默认展开「有覆盖」的组、无覆盖展开首组；条目 `usage` 为主标题、`key` 降级 meta 行（可读性优先），facet 筛选生效时隐藏 tag 徽标降噪。配套 `ConfigListEntry` / `ConfigListGroup` / `ConfigListFacet` 类型。
  
  新增 `@ux/components` **UxFilterChips** 多选筛选药丸原子组件：`role=group` + 逐项 `aria-pressed`（空集合 = 全部），选中态 = subtle 底 + accent-fg（同 UxSegmented 惯例），`sm/md` 两档，复用 `SegmentedOption` 选项类型；替代 el-select multiple 折叠标签类的多选筛选交互。
  
  `EmptyState` 新增 `filtered` 变体：`icon` 缺省时切换 `act-search`（搜索语义，红线 14/C6），配合「清除筛选」动作插槽，供筛选过严的空态使用。
  
  Playground PatternsDemo 新增 SQL 模板场景演示（分组/facet/覆盖筛选/脏跟踪/保存与恢复 + 展开记忆）；playground 双语 locales 补 `patterns.configList.*` 与 `patterns.clist.*`。E2E 新增 `e2e/config-list.spec.ts`（渲染/展开记忆/筛选反馈条）；playwright.config 支持 `PW_BASE_URL` 环境变量覆盖本地端口冲突。
  
  体积基准扩容：`scripts/size-budget.json` totalGzip 78822 → 97723（UxConfigList/UxFilterChips 新增 + 此前 windowPlacement 提交的既有增量）。

### Patch Changes

- Updated dependencies [c54594a]
- Updated dependencies [152c6f0]
  - @ux/tokens@0.2.0

## 0.3.0

### Minor Changes

- 8a496a8: UxTree 新增 `node-dblclick` 事件（payload `{ node, event }`）：双击既有「目录展开/收起」行为不变，业务可借此实现「打开文件/详情」等语义
- 1e9e503: UxTree 内建指针拖拽兜底：Tauri(Windows) WebView2 默认 `dragDropEnabled` 会接管 HTML5 拖拽（文件拖入依赖它，宿主通常不能关闭），`draggable` 行的 dragstart/dragover/drop 不再派发，且 Chromium 启动原生拖拽循环时终止指针流（pointercancel），两条路径同时失效。现在行元素**不再设置 draggable**，拖拽完全由指针手势承担——主键按住位移 ≥5px 激活，`elementFromPoint` 定位落点行，before/after/inside 分区与「指示即所得」语义与原生路径一致；`pointercancel`（系统中断）清场，触屏排除。拖拽激活期间根节点挂 `is-pointer-dragging` 类（`user-select: none` + grabbing 光标）；dragstart/dragover/drop 监听保留供宿主合成事件使用。新增 6 条指针兜底测试，设计文档 §11「平台集成指引」同步。宿主若曾自行合成 DragEvent 驱动 UxTree，升级后应移除以避免双路径叠加。

## 0.2.0

### Minor Changes

- aa7cf06: 新增 `UxDropdown`（APG menubutton 语义的菜单按钮：点击/↓/Enter/Space 打开、Esc 关闭并归还焦点、Tab 只进出一次、外部点击关闭、`checkable` 项激活不关闭，复用 `MenuPanel` 挂载全类型菜单项与子菜单）与 `UxPopover`（通用锚定浮层：触发元素 + `#content` 插槽、`useOverflowPosition` 视口翻转与钳制、外部点击/Esc 关闭可分别开关、`v-model:open` 受控或 expose `open()/close()/toggle()`）。二者均支持 `v-model:open` 受控/非受控双模。

### Patch Changes

- f07f51b: 修复无障碍对比度：令牌层按 WCAG AA 校准 `--ux-fg-subtle` 与功能色前景（新增 `--ux-*-fg`、`--ux-accent-fg`），主色填充改为 600 档保证白字 ≥4.5:1；组件文本色改用前景令牌
- Updated dependencies [f07f51b]
  - @ux/tokens@0.1.1
