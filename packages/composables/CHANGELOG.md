# @ux/composables

## 0.2.0

### Minor Changes

- 5eb729d: feat(composables): 新增 useNotify / useConfirm（改进提案 P1-2）
  
  - useNotify：headless 通知队列（实例级，适配 Tauri 多窗口每窗口一份）+ notifyOnce(key, windowMs=5000) 去重 + 主体 onClick 点击回调 + duration<=0 常驻档
  - useConfirm：Promise 化确认框 headless 状态机，confirm() 返回 Promise<boolean>，Esc=取消（规则 8）；新请求顶替未结算旧请求按取消结算；作用域卸载时结算 pending 防 await 悬挂；视图可用 UxDialog 组装
  - @ux/components 的 toast service 重构为 useNotify 转发层（核心下沉到 composables，依赖单向 components → composables）：notify / notifyOnce / dismissToast / toastState 对外 API 不变，ToastHost 渲染不变
  - UxToastHost 新增主体 onClick 绑定（ux-toast--clickable 指针样式）；动作按钮点击 .stop 阻断冒泡，不重复触发 onClick
  - 单测 +14（composables 9 + ToastHost 2 + 去重/竞态覆盖）
