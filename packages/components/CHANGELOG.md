# @ux/components

## 0.3.0

### Minor Changes

- 8a496a8: UxTree 新增 `node-dblclick` 事件（payload `{ node, event }`）：双击既有「目录展开/收起」行为不变，业务可借此实现「打开文件/详情」等语义

## 0.2.0

### Minor Changes

- aa7cf06: 新增 `UxDropdown`（APG menubutton 语义的菜单按钮：点击/↓/Enter/Space 打开、Esc 关闭并归还焦点、Tab 只进出一次、外部点击关闭、`checkable` 项激活不关闭，复用 `MenuPanel` 挂载全类型菜单项与子菜单）与 `UxPopover`（通用锚定浮层：触发元素 + `#content` 插槽、`useOverflowPosition` 视口翻转与钳制、外部点击/Esc 关闭可分别开关、`v-model:open` 受控或 expose `open()/close()/toggle()`）。二者均支持 `v-model:open` 受控/非受控双模。

### Patch Changes

- f07f51b: 修复无障碍对比度：令牌层按 WCAG AA 校准 `--ux-fg-subtle` 与功能色前景（新增 `--ux-*-fg`、`--ux-accent-fg`），主色填充改为 600 档保证白字 ≥4.5:1；组件文本色改用前景令牌
- Updated dependencies [f07f51b]
  - @ux/tokens@0.1.1
