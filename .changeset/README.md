# Changesets

本目录由 [changesets](https://github.com/changesets/changesets) 管理，负责 `@ux/*` 各包的版本号提升与 CHANGELOG 生成。

## 日常流程

> 需要 Node.js ≥ 22.13。changesets 3.x 使用了 Node 22.11 才引入的 `module.enableCompileCache`，
> 在 Node 20 下运行会报 `TypeError: enableCompileCache is not a function`。

```bash
pnpm changeset          # 交互式记录本次改动：选包 + 选 bump 类型（major/minor/patch）+ 写说明
```

该命令会在 `.changeset/` 下生成一个 Markdown 文件，**随功能改动一起提交**（不要手动改版本号）。

## 发版流程（CI 自动化）

1. 功能 PR 合并进 `master` → `.github/workflows/release.yml` 自动运行 changesets action。
2. action 发现存在 changeset 文件时，自动创建/更新 **「chore: version packages」** 的版本 PR：
   - 消费 `.changeset/*.md`，提升各包 `version`，更新内部依赖区间，写入各包 `CHANGELOG.md`。
3. 合并该版本 PR → 版本号落地。
4. 发布到 npm 属于**可选步骤**：需在仓库 Secret 配置 `NPM_TOKEN`，并在 `release.yml` 的 changesets action 上补 `publish: pnpm release`。未配置时流程只做到「版本 PR」，不会推送 npm。

## 前提：仓库需放开 Actions 的写入权限

`release.yml` 已声明 `permissions: contents: write` + `pull-requests: write`，但 GitHub 的**仓库级设置**会封顶这份权限。若 Release 工作流在 “Create or update version PR” 步骤失败（且本地 `pnpm version-packages` 正常），先在仓库设置里打开两个开关：

- `Settings → Actions → General → Workflow permissions`：选 **Read and write permissions**
- 同页勾选 **Allow GitHub Actions to create and approve pull requests**

（默认的 read-only 会让 action 既无法推送 `changeset-release/master` 分支，也无法开 PR。）

## 约定

- `baseBranch: master`、`access: restricted`（`@ux/*` 为私有 scope，发布前需确认 scope 归属）。
- `ignore: ["@ux/playground"]`：演示应用不参与版本管理。
- `updateInternalDependencies: patch`：被依赖包发版时，内部依赖区间自动跟随 patch 提升。
- 未使用 `fixed` / `linked` 分组，各包可独立演进；框架整体发版时一并选择全部包即可。
