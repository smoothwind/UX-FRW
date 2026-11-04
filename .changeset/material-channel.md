---
'@ux/tokens': minor
---

feat(tokens): 新增常驻材质通道 data-ux-material（改进提案 P2-1 修订版）

- data-ux-material="glass"：与 data-ux-fx 平行的常驻表面材质语义（fx=可开关特效，material=基础表面形态），共用 backdrop-filter 实现路径但参数独立（--ux-material-* 与 --ux-frost-* 互不覆盖），不新建平行 --ux-glass-* 层
- 颜色 token 三主题齐备（tint/border/highlight，全部由既有令牌 color-mix 派生，零裸值）+ 主题无关参数（blur/saturate，宿主可覆盖）
- 元素标注 data-ux-material-surface 即获得玻璃材质；@supports 回退不透明 --ux-bg-overlay（不做伪模糊）；宿主窗口不透明（applyWindowMaterial 'none'）时呈浅蒙层，CSS 仍工作
- check-tokens 新增 R5：backdrop-filter 禁裸值，只准消费 --ux-material-* / --ux-frost-*
- playground 主题区新增「玻璃材质」开关 + 常驻玻璃表面预览卡片；token 参考表同步（252 个令牌）
