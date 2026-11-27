# @ux/patterns

## 0.3.0

### Minor Changes

- 29d0af7: feat: 移动端 M9a 收尾——触控档补全 + 安全区覆写 + R3+/R6 门禁
  
  @ux/tokens：
  
  - layout.css 触控档补全（移动端规范 §3.2/§3.5）：`--ux-row-h`（桌面 26px / coarse 40px）、`--ux-input-fs`（coarse 16px 硬基线，iOS 聚焦缩放规避）、coarse `--ux-fs-md: 14px`、`touch-action: manipulation` 全局交互基线
  - 新增 `applySafeAreaInsets` / `resetSafeAreaInsets` / `getSafeAreaOverrides`：宿主上报安全区数值运行时覆写 `--ux-safe-*`（安卓 WebView env() 不可靠兜底，§3.3/§8）；tokenNames 增 layout.rowH / layout.inputFs
  
  @ux/composables：
  
  - `useVirtualRows.rowHeight` 支持 getter（`number | (() => number)`）——行高令牌切档后窗口/占位响应式重算（§3.2 remeasure 路径）
  
  @ux/patterns：
  
  - `UxDataTable` 行高令牌模式：rowHeight 缺省消费 `--ux-row-h`，监听 `data-ux-viewport` 根属性变化重读令牌（D-5 红线内不裸 matchMedia）；显式 prop 仍优先（确定性消费方不受切档影响）
  
  @ux/services：
  
  - `PlatformAdapter.safeAreaInsets?()` 移动契约（四边数值宿主上报，web 无需实现）
  
  门禁与消费方：
  
  - check-tokens 新增 R3+（媒体查询宽度字面量须为断点登记值 600/960/1280 或 *.98px 等价写法）与 R6（coarse 作用域 height 禁 24/28/32px 字面量）；SettingsShell 720px 孤例迁移 599.98px（§3.1 限期迁移项清零）
  - playground：main.ts 接线 safeAreaInsets → applySafeAreaInsets；TokensPanel 新增视口演示卡（通道值实时回显 + 三断点可视化 + coarse 徽标，M9a 验收项）；触控行高演示随 DataTable 令牌模式生效

### Patch Changes

- Updated dependencies [5eb729d]
- Updated dependencies [0171392]
- Updated dependencies [29d0af7]
- Updated dependencies [f18555b]
  - @ux/composables@0.2.0
  - @ux/components@0.5.0
  - @ux/services@0.3.0

## 0.2.0

### Minor Changes

- 5221b69: 新增 `@ux/patterns` **UxConfigList** 配置目录化编辑器 pattern（提炼自 PersonalDb SQL 模板设置页改版）：数据驱动分组折叠（`ConfigListGroup`，组头 disclosure 语义 `aria-expanded`/`aria-controls` + 完整 aria-label「名称 + 条数 + 覆盖数」）+ facet 多选筛选 + 覆盖状态筛选（全部/已覆盖/内置）+ 三路搜索（key/用途/值）+ 筛选反馈条（条件 × 匹配数 + 一键清除）+ 空态语义区分（筛选过严 → EmptyState `filtered` 变体 + 清除动作）+ 脏跟踪（未保存计数徽标）+ 批量保存（仅携带非空覆盖）/恢复全部内置（确认归宿主）；展开状态记忆：`storageKey` → `createPreferences` 版本化存储，默认展开「有覆盖」的组、无覆盖展开首组；条目 `usage` 为主标题、`key` 降级 meta 行（可读性优先），facet 筛选生效时隐藏 tag 徽标降噪。配套 `ConfigListEntry` / `ConfigListGroup` / `ConfigListFacet` 类型。
  
  新增 `@ux/components` **UxFilterChips** 多选筛选药丸原子组件：`role=group` + 逐项 `aria-pressed`（空集合 = 全部），选中态 = subtle 底 + accent-fg（同 UxSegmented 惯例），`sm/md` 两档，复用 `SegmentedOption` 选项类型；替代 el-select multiple 折叠标签类的多选筛选交互。
  
  `EmptyState` 新增 `filtered` 变体：`icon` 缺省时切换 `act-search`（搜索语义，红线 14/C6），配合「清除筛选」动作插槽，供筛选过严的空态使用。
  
  Playground PatternsDemo 新增 SQL 模板场景演示（分组/facet/覆盖筛选/脏跟踪/保存与恢复 + 展开记忆）；playground 双语 locales 补 `patterns.configList.*` 与 `patterns.clist.*`。E2E 新增 `e2e/config-list.spec.ts`（渲染/展开记忆/筛选反馈条）；playwright.config 支持 `PW_BASE_URL` 环境变量覆盖本地端口冲突。
  
  体积基准扩容：`scripts/size-budget.json` totalGzip 78822 → 97723（UxConfigList/UxFilterChips 新增 + 此前 windowPlacement 提交的既有增量）。
- 152c6f0: 新增 `UxSplash` 启动页模式组件：亮点聚点 → SVG 描边旋转扫出窗体（亮点经 `getPointAtLength` 精确骑在描边头部）→ 内容落位 → 整体淡出，四阶段出场 1000ms，全程 transform/opacity 无布局抖动。`waiting` 模式亮点沿轮廓巡游等待宿主 `finish()`；`minDuration` 保证最短展示；Esc 跳过；`prefers-reduced-motion` 直达内容落位。
  
  - `@ux/services`：`PlatformAdapter` 新增可选 `closeSplash()`，UxSplash 收场时关闭宿主原生启动窗（Electron/Tauri 注入，web 无需实现）。
  - `@ux/tokens`：新增令牌 `--ux-z-splash`（2800，z 阶梯最高层）、`--ux-dur-splash`（760ms）、`--ux-ease-out-strong`。
  - Playground：模式组件分区新增 UxSplash 演示（普通 / 等待就绪两种形态）。

### Patch Changes

- Updated dependencies [5221b69]
- Updated dependencies [152c6f0]
- Updated dependencies [8947464]
  - @ux/components@0.4.0
  - @ux/services@0.2.0

## 0.1.2

### Patch Changes

- Updated dependencies [8a496a8]
- Updated dependencies [1e9e503]
  - @ux/components@0.3.0
  - @ux/services@0.1.2

## 0.1.1

### Patch Changes

- f07f51b: 修复无障碍对比度：令牌层按 WCAG AA 校准 `--ux-fg-subtle` 与功能色前景（新增 `--ux-*-fg`、`--ux-accent-fg`），主色填充改为 600 档保证白字 ≥4.5:1；组件文本色改用前景令牌
- Updated dependencies [f07f51b]
- Updated dependencies [aa7cf06]
  - @ux/components@0.2.0
  - @ux/services@0.1.1
