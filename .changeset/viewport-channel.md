---
'@ux/tokens': minor
---

feat(tokens): 视口状态通道 data-ux-viewport + 断点/安全区登记（移动端规范 §3.1/§3.3/§3.4 先行切片）

- BP 断点登记（sm 600 / md 960 / lg 1280，与 layout.css --ux-bp-* 双源同值；CSS 媒体查询不能消费变量的登记制方案）
- applyViewport()：matchMedia 监听断点/指针/方向，维护 html[data-ux-viewport="sm coarse portrait"] 根属性通道；resolveViewport() 单次读取；视口判断唯一出口（组件不得自行 matchMedia）
- --ux-safe-* 安全区令牌（env(safe-area-inset-*)，配套 viewport-fit=cover；安卓 WebView 不可靠时由宿主上报覆写兜底）
- 6 条单测（档位边界 / 持续更新 / 取消清理）

playground 移动入口（apps/playground）：

- 窄屏（< --ux-bp-sm 600px）收缩：五页签横向滚动保持全部可达、副标题隐藏、safe-area 顶/底让位、按钮点击区对齐触控档 36px；只收缩不增强
- index.html viewport-fit=cover；e2e 新增 mobile.spec.ts（390×844 触屏视口：通道属性 + 收缩导航可达性 + 切分区）
