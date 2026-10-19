---
'@ux/tokens': patch
'@ux/components': patch
'@ux/patterns': patch
'@ux/shell': patch
---

修复无障碍对比度：令牌层按 WCAG AA 校准 `--ux-fg-subtle` 与功能色前景（新增 `--ux-*-fg`、`--ux-accent-fg`），主色填充改为 600 档保证白字 ≥4.5:1；组件文本色改用前景令牌
