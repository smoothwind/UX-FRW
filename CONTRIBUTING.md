# 贡献指南（CONTRIBUTING.md）

> 面向框架贡献者与消费者应用（提模式晋升候选时读第三节）。
> 各主题的事实源：设计规范速查见 [docs/PRINCIPLES.md](docs/PRINCIPLES.md)；
> 增量接入见 [docs/MIGRATION.md](docs/MIGRATION.md)；平台集成坑见设计方案 §11；
> 发版流程见 [README「发版流程」](README.md#发版流程changesets)。本文只写流程与惯例，不复制规范。

---

## 一、提交前：一键门禁

```bash
pnpm verify   # check(五条红线) + typecheck + lint + 单测 + e2e
```

- 单测/体量基线见 README「质量红线」；e2e 一律用 `data-ux` / `data-ux-part` 稳定锚点，不依赖样式类与文案。
- 令牌红线确属数据配色的场景用行内注释 `tokens-exempt` 豁免（行级生效，断言行也要加）；
  快捷键如需避开保留键位检查用 `shortcut-exempt`（菜单展示类场景）。
- `check-shortcuts` 对保留键位的警告（S 级）不阻断；其余 check 失败必须修复。
- CI（`ci.yml`）跑同等门禁；`deploy-pages.yml` 另含 playground 发布门禁。

## 二、改动惯例

- **提交消息**：conventional 风格中文描述（`feat(components): ...` / `fix(services): ...` / `docs: ...`），
  正文列要点；不用长破折号（`——`）。
- **changeset 随功能提交**：任何影响 `@ux/*` 对外行为/类型的改动，`pnpm changeset` 生成
  `.changeset/*.md` 与功能同一提交；禁止手改包 `version`。纯 docs/CI 改动可免。
- **文档同步义务**（与代码同一 PR）：
  - 新组件/模式/composable → 设计方案 §6.x 清单补行 + README「已交付组件与 API」表补行；
  - 新红线/检查器规则 → §7 质量保障表 + [docs/PRINCIPLES.md](docs/PRINCIPLES.md) 对照表同步；
  - 里程碑进度 → §9 路线图行内勾选（`✅` + 实测验收摘要）。
- **测试义务**：composables Vitest 全覆盖；组件渲染 + 交互 + a11y 断言；e2e 锚点用例进 `e2e/*.spec.ts`。
  覆盖率阈值锁定在 `vitest.config.ts`，低于阈值 CI 失败。

## 三、消费者模式晋升（consumer-proven → @ux/*）

消费者应用中验证过的模式可以反向沉淀为框架件（原子控件 → `@ux/components` 变体；
行为逻辑 → `@ux/composables`；复合模式 → `@ux/patterns`）。完整流程的事实源是
[设计方案 §9「消费者模式晋升流程」](docs/UxKit-设计方案.md)。

**提名**（issue 或 PR 附说明）需包含：

1. 证据链：来源文件位置 + 关键代码段（如 `src/note-window/NoteCard.vue` 的提醒徽标弹层）；
2. 复用信号：同类需求出现次数 / 通用性论证；
3. 令牌映射：样式如何落到语义令牌或 `data-ux-fx` 通道参数（**不建平行 token 层**）；
4. a11y 现状：键盘可达性 + aria 语义。

维护者按 §9 评审清单（归类 / API 泛化 / 规格成文 / 令牌合规 / 测试计划 / 体积影响）逐条过评；
过评即进入排期（候选档案见 §9 末尾表格），实施时与常规交付同门禁。
晋升合入后，来源消费者应删除本地手搓实现改用框架件。

**当前已过评候选**：`UxCheckbox` glass 变体（依赖 P2-1 修订版材质通道评审）、
提醒徽标 + 弹层（待排期，无阻塞依赖）。

## 四、开发环境

- Node ≥ 22.13、pnpm 12（`packageManager` 字段锁定，corepack 可用）。
- 首次跑 e2e 前 `pnpm exec playwright install chromium`。
- 本地多包联调直接改 `packages/*` 源码，playground 经 workspace 解析热更；无需 link。
