---
'@ux/services': minor
---

新增多显示器/混合 DPI 窗口摆放契约与视口健康自检：

- `PlatformAdapter` 新增可选 `windowPlacement`（`placeToCursorDisplay` 按光标所在屏钳制 workArea 并居中 / `resyncBounds` 强制 WebView2 重同步边界 / `onDisplayMetricsChanged` 订阅显示器指标变化），web 适配器 `createWebWindowPlacement()` 为 no-op；主进程参考实现见 `docs/window-placement.md`
- 新增 `checkViewportHealth()` / `installViewportHealthWatch()`：dev 期检测“渲染视口比窗口宽”（窗口几何与渲染层失配的混合 DPI 典型症状）与文档水平溢出（扣除滚动条容差），把此类问题从“用户报 UI bug”提前到“开发期告警”
