# @ux/tokens

## 0.3.0

### Minor Changes

- 0171392: feat(components): 补齐表单控件组五件（设计方案 §6.3 规格落地，改进提案 P1-1 首批）
  
  - UxCheckbox：原生 checkbox 底座，半选（indeterminate 横杠）+ hint/error + aria-invalid
  - UxSwitch：role=switch 轨道滑块，Space 切换零 JS 状态机
  - UxTextarea：UxInput 同构包装（label 关联 / placeholder / rows / maxlength）
  - UxSelect：原生 select 底座 + 注册表 chevron 装饰（键盘与触屏行为零实现）
  - UxSlider：原生 range + 填充轨道（--ux-slider-fill）+ showValue 当前值 output
  - tokens 新增触控档：pointer:coarse 下 --ux-control-h-* 整档提升为 36/44/48（桌面零影响；移动端设计规范 §3.2 首项落地）
- d12eb9d: feat(tokens): 新增常驻材质通道 data-ux-material（改进提案 P2-1 修订版）
  
  - data-ux-material="glass"：与 data-ux-fx 平行的常驻表面材质语义（fx=可开关特效，material=基础表面形态），共用 backdrop-filter 实现路径但参数独立（--ux-material-* 与 --ux-frost-* 互不覆盖），不新建平行 --ux-glass-* 层
  - 颜色 token 三主题齐备（tint/border/highlight，全部由既有令牌 color-mix 派生，零裸值）+ 主题无关参数（blur/saturate，宿主可覆盖）
  - 元素标注 data-ux-material-surface 即获得玻璃材质；@supports 回退不透明 --ux-bg-overlay（不做伪模糊）；宿主窗口不透明（applyWindowMaterial 'none'）时呈浅蒙层，CSS 仍工作
  - check-tokens 新增 R5：backdrop-filter 禁裸值，只准消费 --ux-material-* / --ux-frost-*
  - playground 主题区新增「玻璃材质」开关 + 常驻玻璃表面预览卡片；token 参考表同步（252 个令牌）
- dca450b: feat(tokens): 着色表面色板 registerTint + AA 对比度校验（改进提案 P2-3 设计评审先行）
  
  - token 结构 --ux-tint-{name}-surface/-deep/-fg/-opaque：色值由消费者经 registerTint 运行时注入（单 <style data-ux-tints> 管理块，:root + .dark 两套），业务配色不落样式文件、不绕过 R1/dark 红线
  - 注册即强制 AA 校验：fg 对 surface/deep/opaque 三对 ≥4.5:1（WCAG 2.1），不达标抛错并携带数值；validate:false 可显式跳过
  - 配套 tintContrast（单对 WCAG 计算）/ checkTintContrast（报告式全量）/ listTints / resetTints
  - 设计稿成文于设计方案 §4.6（消费惯例：var(--ux-tint-x-*, var(--ux-bg-*)) 带语义回退）；13 条单测
- 8a6e9c5: feat(tokens): 视口状态通道 data-ux-viewport + 断点/安全区登记（移动端规范 §3.1/§3.3/§3.4 先行切片）
  
  - BP 断点登记（sm 600 / md 960 / lg 1280，与 layout.css --ux-bp-* 双源同值；CSS 媒体查询不能消费变量的登记制方案）
  - applyViewport()：matchMedia 监听断点/指针/方向，维护 html[data-ux-viewport="sm coarse portrait"] 根属性通道；resolveViewport() 单次读取；视口判断唯一出口（组件不得自行 matchMedia）
  - --ux-safe-* 安全区令牌（env(safe-area-inset-*)，配套 viewport-fit=cover；安卓 WebView 不可靠时由宿主上报覆写兜底）
  - 6 条单测（档位边界 / 持续更新 / 取消清理）
  
  playground 移动入口（apps/playground）：
  
  - 窄屏（< --ux-bp-sm 600px）收缩：五页签横向滚动保持全部可达、副标题隐藏、safe-area 顶/底让位、按钮点击区对齐触控档 36px；只收缩不增强
  - index.html viewport-fit=cover；e2e 新增 mobile.spec.ts（390×844 触屏视口：通道属性 + 收缩导航可达性 + 切分区）

## 0.2.0

### Minor Changes

- c54594a: 新增 dark-silk（黑暗主题，墨黑丝滑质感）第三主题：`UxTheme` 扩展 `'dark-silk'`，primitives 增加 silk 墨黑色阶，semantic 新增 `.dark.dark-silk` 覆盖块，主色与功能色继承 `.dark`；`applyTheme` 三通道同步 `data-color-mode="dark-silk"` + `.dark`/`.dark-silk` 双类，平台通道归入 dark。
  
  表面令牌重构为「复合值 + 基色」两层：主题只声明 `--ux-bg-*-base` 基色，`:root` 默认 `表面 = 基色`。
  
  新增主题无关的视觉特效通道 `data-ux-fx`（空格分隔效果列表，`applyTheme` 支持 `fx` 选项显式覆盖主题默认），首个特效 **sheen（背景丝光）**：将所有主题表面重写为「顶部丝光渐变 + 主题基色」，高光色与各表面强度参数化（`--ux-sheen-*`），并新增总强度参数 `--ux-sheen-strength`（0~n 等比缩放，Playground 提供滑块）；`dark-silk` 默认携带 sheen，其余主题可由宿主追加 FX_ATTR 复用。
  
  新增第二个特效 **frost（磨砂玻璃）**：浮层表面半透明化（`color-mix` + `--ux-frost-opacity` 不透明度参数 0~1）+ `backdrop-filter: blur()`（`--ux-frost-blur` / `--ux-frost-saturate` 参数化）；组件在浮层根元素（对话框/菜单/命令面板/悬浮面板）标注 `data-ux-fx-surface`，特效层统一注入背板模糊。特效可叠加（`data-ux-fx="sheen frost"`）。
  
  新增第三个特效 **metal（金属质感）**：表面 = 镜面高光渐变 + 拉丝纹理（`repeating-linear-gradient`）+ 主题基色；参数 `--ux-metal-hi`（高光色）、`--ux-metal-{canvas|panel|overlay|sunken}`（镜面强度）、`--ux-metal-brush`（拉丝强度）。与 sheen 同为表面纹理类特效，二选一（同开时后者生效）；可与 frost 叠加（金属表面 + 浮层磨砂）。sheen/metal 各导出可复用纹理图令牌（`--ux-sheen-img` / `--ux-metal-img`），供宿主自定义表面叠加。
  
  主题切换新增全元素颜色过渡：切换瞬间设置 `data-theme-transition`，按 `--ux-dur-slow`（240ms）过渡背景/边框/文本/阴影后自动摘除，`prefers-reduced-motion` 下禁用。
- 152c6f0: 新增 `UxSplash` 启动页模式组件：亮点聚点 → SVG 描边旋转扫出窗体（亮点经 `getPointAtLength` 精确骑在描边头部）→ 内容落位 → 整体淡出，四阶段出场 1000ms，全程 transform/opacity 无布局抖动。`waiting` 模式亮点沿轮廓巡游等待宿主 `finish()`；`minDuration` 保证最短展示；Esc 跳过；`prefers-reduced-motion` 直达内容落位。
  
  - `@ux/services`：`PlatformAdapter` 新增可选 `closeSplash()`，UxSplash 收场时关闭宿主原生启动窗（Electron/Tauri 注入，web 无需实现）。
  - `@ux/tokens`：新增令牌 `--ux-z-splash`（2800，z 阶梯最高层）、`--ux-dur-splash`（760ms）、`--ux-ease-out-strong`。
  - Playground：模式组件分区新增 UxSplash 演示（普通 / 等待就绪两种形态）。

## 0.1.1

### Patch Changes

- f07f51b: 修复无障碍对比度：令牌层按 WCAG AA 校准 `--ux-fg-subtle` 与功能色前景（新增 `--ux-*-fg`、`--ux-accent-fg`），主色填充改为 600 档保证白字 ≥4.5:1；组件文本色改用前景令牌
