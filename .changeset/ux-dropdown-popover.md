---
"@ux/components": minor
---

新增 `UxDropdown`（APG menubutton 语义的菜单按钮：点击/↓/Enter/Space 打开、Esc 关闭并归还焦点、Tab 只进出一次、外部点击关闭、`checkable` 项激活不关闭，复用 `MenuPanel` 挂载全类型菜单项与子菜单）与 `UxPopover`（通用锚定浮层：触发元素 + `#content` 插槽、`useOverflowPosition` 视口翻转与钳制、外部点击/Esc 关闭可分别开关、`v-model:open` 受控或 expose `open()/close()/toggle()`）。二者均支持 `v-model:open` 受控/非受控双模。
