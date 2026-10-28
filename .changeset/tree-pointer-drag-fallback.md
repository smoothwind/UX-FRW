---
'@ux/components': minor
---

UxTree 内建指针拖拽兜底：Tauri(Windows) WebView2 默认 `dragDropEnabled` 会接管 HTML5 拖拽（文件拖入依赖它，宿主通常不能关闭），`draggable` 行的 dragstart/dragover/drop 不再派发，且 Chromium 启动原生拖拽循环时终止指针流（pointercancel），两条路径同时失效。现在行元素**不再设置 draggable**，拖拽完全由指针手势承担——主键按住位移 ≥5px 激活，`elementFromPoint` 定位落点行，before/after/inside 分区与「指示即所得」语义与原生路径一致；`pointercancel`（系统中断）清场，触屏排除。拖拽激活期间根节点挂 `is-pointer-dragging` 类（`user-select: none` + grabbing 光标）；dragstart/dragover/drop 监听保留供宿主合成事件使用。新增 6 条指针兜底测试，设计文档 §11「平台集成指引」同步。宿主若曾自行合成 DragEvent 驱动 UxTree，升级后应移除以避免双路径叠加。
