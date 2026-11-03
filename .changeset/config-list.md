---
'@ux/components': minor
'@ux/patterns': minor
---

新增 `@ux/patterns` **UxConfigList** 配置目录化编辑器 pattern（提炼自 PersonalDb SQL 模板设置页改版）：数据驱动分组折叠（`ConfigListGroup`，组头 disclosure 语义 `aria-expanded`/`aria-controls` + 完整 aria-label「名称 + 条数 + 覆盖数」）+ facet 多选筛选 + 覆盖状态筛选（全部/已覆盖/内置）+ 三路搜索（key/用途/值）+ 筛选反馈条（条件 × 匹配数 + 一键清除）+ 空态语义区分（筛选过严 → EmptyState `filtered` 变体 + 清除动作）+ 脏跟踪（未保存计数徽标）+ 批量保存（仅携带非空覆盖）/恢复全部内置（确认归宿主）；展开状态记忆：`storageKey` → `createPreferences` 版本化存储，默认展开「有覆盖」的组、无覆盖展开首组；条目 `usage` 为主标题、`key` 降级 meta 行（可读性优先），facet 筛选生效时隐藏 tag 徽标降噪。配套 `ConfigListEntry` / `ConfigListGroup` / `ConfigListFacet` 类型。

新增 `@ux/components` **UxFilterChips** 多选筛选药丸原子组件：`role=group` + 逐项 `aria-pressed`（空集合 = 全部），选中态 = subtle 底 + accent-fg（同 UxSegmented 惯例），`sm/md` 两档，复用 `SegmentedOption` 选项类型；替代 el-select multiple 折叠标签类的多选筛选交互。

`EmptyState` 新增 `filtered` 变体：`icon` 缺省时切换 `act-search`（搜索语义，红线 14/C6），配合「清除筛选」动作插槽，供筛选过严的空态使用。

Playground PatternsDemo 新增 SQL 模板场景演示（分组/facet/覆盖筛选/脏跟踪/保存与恢复 + 展开记忆）；playground 双语 locales 补 `patterns.configList.*` 与 `patterns.clist.*`。E2E 新增 `e2e/config-list.spec.ts`（渲染/展开记忆/筛选反馈条）；playwright.config 支持 `PW_BASE_URL` 环境变量覆盖本地端口冲突。

体积基准扩容：`scripts/size-budget.json` totalGzip 78822 → 97723（UxConfigList/UxFilterChips 新增 + 此前 windowPlacement 提交的既有增量）。
