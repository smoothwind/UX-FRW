---
'@ux/tokens': minor
---

feat(tokens): 着色表面色板 registerTint + AA 对比度校验（改进提案 P2-3 设计评审先行）

- token 结构 --ux-tint-{name}-surface/-deep/-fg/-opaque：色值由消费者经 registerTint 运行时注入（单 <style data-ux-tints> 管理块，:root + .dark 两套），业务配色不落样式文件、不绕过 R1/dark 红线
- 注册即强制 AA 校验：fg 对 surface/deep/opaque 三对 ≥4.5:1（WCAG 2.1），不达标抛错并携带数值；validate:false 可显式跳过
- 配套 tintContrast（单对 WCAG 计算）/ checkTintContrast（报告式全量）/ listTints / resetTints
- 设计稿成文于设计方案 §4.6（消费惯例：var(--ux-tint-x-*, var(--ux-bg-*)) 带语义回退）；13 条单测
