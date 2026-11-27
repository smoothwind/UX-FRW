# @ux/composables

## 0.2.0

### Minor Changes

- 5eb729d: feat(composables): 新增 useNotify / useConfirm（改进提案 P1-2）
  
  - useNotify：headless 通知队列（实例级，适配 Tauri 多窗口每窗口一份）+ notifyOnce(key, windowMs=5000) 去重 + 主体 onClick 点击回调 + duration<=0 常驻档
  - useConfirm：Promise 化确认框 headless 状态机，confirm() 返回 Promise<boolean>，Esc=取消（规则 8）；新请求顶替未结算旧请求按取消结算；作用域卸载时结算 pending 防 await 悬挂；视图可用 UxDialog 组装
  - @ux/components 的 toast service 重构为 useNotify 转发层（核心下沉到 composables，依赖单向 components → composables）：notify / notifyOnce / dismissToast / toastState 对外 API 不变，ToastHost 渲染不变
  - UxToastHost 新增主体 onClick 绑定（ux-toast--clickable 指针样式）；动作按钮点击 .stop 阻断冒泡，不重复触发 onClick
  - 单测 +14（composables 9 + ToastHost 2 + 去重/竞态覆盖）
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
