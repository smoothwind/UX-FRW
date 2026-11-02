---
'@ux/tokens': minor
---

新增 dark-silk（黑暗主题，墨黑丝滑质感）第三主题：`UxTheme` 扩展 `'dark-silk'`，primitives 增加 silk 墨黑色阶，semantic 新增 `.dark.dark-silk` 覆盖块，主色与功能色继承 `.dark`；`applyTheme` 三通道同步 `data-color-mode="dark-silk"` + `.dark`/`.dark-silk` 双类，平台通道归入 dark。

表面令牌重构为「复合值 + 基色」两层：主题只声明 `--ux-bg-*-base` 基色，`:root` 默认 `表面 = 基色`。

新增主题无关的视觉特效通道 `data-ux-fx`（空格分隔效果列表，`applyTheme` 支持 `fx` 选项显式覆盖主题默认），首个特效 **sheen（背景丝光）**：将所有主题表面重写为「顶部丝光渐变 + 主题基色」，高光色与各表面强度参数化（`--ux-sheen-*`），并新增总强度参数 `--ux-sheen-strength`（0~n 等比缩放，Playground 提供滑块）；`dark-silk` 默认携带 sheen，其余主题可由宿主追加 FX_ATTR 复用。

新增第二个特效 **frost（磨砂玻璃）**：浮层表面半透明化（`color-mix` + `--ux-frost-opacity` 不透明度参数 0~1）+ `backdrop-filter: blur()`（`--ux-frost-blur` / `--ux-frost-saturate` 参数化）；组件在浮层根元素（对话框/菜单/命令面板/悬浮面板）标注 `data-ux-fx-surface`，特效层统一注入背板模糊。特效可叠加（`data-ux-fx="sheen frost"`）。

新增第三个特效 **metal（金属质感）**：表面 = 镜面高光渐变 + 拉丝纹理（`repeating-linear-gradient`）+ 主题基色；参数 `--ux-metal-hi`（高光色）、`--ux-metal-{canvas|panel|overlay|sunken}`（镜面强度）、`--ux-metal-brush`（拉丝强度）。与 sheen 同为表面纹理类特效，二选一（同开时后者生效）；可与 frost 叠加（金属表面 + 浮层磨砂）。sheen/metal 各导出可复用纹理图令牌（`--ux-sheen-img` / `--ux-metal-img`），供宿主自定义表面叠加。

主题切换新增全元素颜色过渡：切换瞬间设置 `data-theme-transition`，按 `--ux-dur-slow`（240ms）过渡背景/边框/文本/阴影后自动摘除，`prefers-reduced-motion` 下禁用。
