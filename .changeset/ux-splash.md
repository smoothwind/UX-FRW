---
'@ux/patterns': minor
'@ux/services': minor
'@ux/tokens': minor
---

新增 `UxSplash` 启动页模式组件：亮点聚点 → SVG 描边旋转扫出窗体（亮点经 `getPointAtLength` 精确骑在描边头部）→ 内容落位 → 整体淡出，四阶段出场 1000ms，全程 transform/opacity 无布局抖动。`waiting` 模式亮点沿轮廓巡游等待宿主 `finish()`；`minDuration` 保证最短展示；Esc 跳过；`prefers-reduced-motion` 直达内容落位。

- `@ux/services`：`PlatformAdapter` 新增可选 `closeSplash()`，UxSplash 收场时关闭宿主原生启动窗（Electron/Tauri 注入，web 无需实现）。
- `@ux/tokens`：新增令牌 `--ux-z-splash`（2800，z 阶梯最高层）、`--ux-dur-splash`（760ms）、`--ux-ease-out-strong`。
- Playground：模式组件分区新增 UxSplash 演示（普通 / 等待就绪两种形态）。
