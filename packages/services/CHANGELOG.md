# @ux/services

## 0.3.0

### Minor Changes

- f18555b: feat(services): PlatformAdapter 新增窗口材质与 OS 通知身份扩展位（改进提案 P2-2）
  
  - applyWindowMaterial({ effect: 'acrylic'|'mica'|'blur'|'none', tint?, dark? })：原生窗口材质，'none' 为不支持透明环境的统一降级出口（§11.5）
  - registerToastIdentity({ id, displayName, iconUri? })：OS 通知身份注册（Windows AUMID），避免 dev/便携来源显示宿主进程名、安装版静默失败（§11.6）
  - 设计文档 §11 新增三节 Windows 实测模式：DWM 圆角与亚克力（SetWindowRgn 不生效）、Toast AUMID、多显示器坐标校验（§11.5–11.7）；§6.2 契约草图同步对齐
  - 两扩展位均为可选方法：web 宿主无需实现；桌面宿主（Tauri/Electron）各自实现底层调用

### Patch Changes

- Updated dependencies [5eb729d]
- Updated dependencies [0171392]
  - @ux/components@0.5.0

## 0.2.0

### Minor Changes

- 152c6f0: 新增 `UxSplash` 启动页模式组件：亮点聚点 → SVG 描边旋转扫出窗体（亮点经 `getPointAtLength` 精确骑在描边头部）→ 内容落位 → 整体淡出，四阶段出场 1000ms，全程 transform/opacity 无布局抖动。`waiting` 模式亮点沿轮廓巡游等待宿主 `finish()`；`minDuration` 保证最短展示；Esc 跳过；`prefers-reduced-motion` 直达内容落位。
  
  - `@ux/services`：`PlatformAdapter` 新增可选 `closeSplash()`，UxSplash 收场时关闭宿主原生启动窗（Electron/Tauri 注入，web 无需实现）。
  - `@ux/tokens`：新增令牌 `--ux-z-splash`（2800，z 阶梯最高层）、`--ux-dur-splash`（760ms）、`--ux-ease-out-strong`。
  - Playground：模式组件分区新增 UxSplash 演示（普通 / 等待就绪两种形态）。
- 8947464: 新增多显示器/混合 DPI 窗口摆放契约与视口健康自检：
  
  - `PlatformAdapter` 新增可选 `windowPlacement`（`placeToCursorDisplay` 按光标所在屏钳制 workArea 并居中 / `resyncBounds` 强制 WebView2 重同步边界 / `onDisplayMetricsChanged` 订阅显示器指标变化），web 适配器 `createWebWindowPlacement()` 为 no-op；主进程参考实现见 `docs/window-placement.md`
  - 新增 `checkViewportHealth()` / `installViewportHealthWatch()`：dev 期检测“渲染视口比窗口宽”（窗口几何与渲染层失配的混合 DPI 典型症状）与文档水平溢出（扣除滚动条容差），把此类问题从“用户报 UI bug”提前到“开发期告警”

### Patch Changes

- Updated dependencies [5221b69]
  - @ux/components@0.4.0

## 0.1.2

### Patch Changes

- Updated dependencies [8a496a8]
- Updated dependencies [1e9e503]
  - @ux/components@0.3.0

## 0.1.1

### Patch Changes

- Updated dependencies [f07f51b]
- Updated dependencies [aa7cf06]
  - @ux/components@0.2.0
