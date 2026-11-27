# @ux/services

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
