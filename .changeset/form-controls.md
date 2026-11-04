---
'@ux/components': minor
'@ux/tokens': minor
---

feat(components): 补齐表单控件组五件（设计方案 §6.3 规格落地，改进提案 P1-1 首批）

- UxCheckbox：原生 checkbox 底座，半选（indeterminate 横杠）+ hint/error + aria-invalid
- UxSwitch：role=switch 轨道滑块，Space 切换零 JS 状态机
- UxTextarea：UxInput 同构包装（label 关联 / placeholder / rows / maxlength）
- UxSelect：原生 select 底座 + 注册表 chevron 装饰（键盘与触屏行为零实现）
- UxSlider：原生 range + 填充轨道（--ux-slider-fill）+ showValue 当前值 output
- tokens 新增触控档：pointer:coarse 下 --ux-control-h-* 整档提升为 36/44/48（桌面零影响；移动端设计规范 §3.2 首项落地）
