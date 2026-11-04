import { ref } from 'vue'
import type { Ref } from 'vue'

export type NotifyType = 'info' | 'success' | 'warning' | 'danger'

export interface NotifyOptions {
  type?: NotifyType
  message: string
  /** 自动消失时长（毫秒）；<=0 表示不自动消失，默认 4000 */
  duration?: number
  /** 主动作按钮（渲染端负责呈现；触发后通常随之 dismiss） */
  action?: { label: string; run: () => void }
  /** 点击通知主体的回调（鼠标增强；键盘可达性由 action 按钮承担） */
  onClick?: () => void
}

export interface NotifyRecord extends NotifyOptions {
  id: number
  type: NotifyType
}

export interface NotifyApi {
  /** 当前通知队列（渲染端消费；建议容器 aria-live="polite"，条目 role="status"） */
  toasts: Ref<NotifyRecord[]>
  /** 入队一条通知，返回记录 id；duration 缺省 4000，<=0 常驻 */
  notify(options: NotifyOptions | string): number
  /** 同 key 在 windowMs（默认 5000）内只入队一次（防多来源轰炸）；被去重时返回 null */
  notifyOnce(key: string, options: NotifyOptions | string, windowMs?: number): number | null
  /** 手动移除一条通知（自动消失与重复入队同样走这里） */
  dismiss(id: number): void
}

/**
 * 通知队列（headless）：状态与去重在此，UI 交给渲染端
 * （@ux/components 的 UxToastHost，或业务自绘）。每次调用返回独立实例，
 * 适合每窗口 / 每 Vue app 一份队列的 Tauri 多窗口形态。
 */
export function useNotify(): NotifyApi {
  const toasts = ref<NotifyRecord[]>([])
  const onceMap = new Map<string, number>()
  let seq = 0

  function dismiss(id: number): void {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx >= 0) toasts.value.splice(idx, 1)
  }

  function notify(options: NotifyOptions | string): number {
    const opts = typeof options === 'string' ? { message: options } : options
    const id = ++seq
    toasts.value.push({
      id,
      type: opts.type ?? 'info',
      message: opts.message,
      action: opts.action,
      onClick: opts.onClick,
    })
    const duration = opts.duration ?? 4000
    if (duration > 0) window.setTimeout(() => dismiss(id), duration)
    return id
  }

  function notifyOnce(key: string, options: NotifyOptions | string, windowMs = 5000): number | null {
    const now = Date.now()
    if (now - (onceMap.get(key) ?? 0) < windowMs) return null
    onceMap.set(key, now)
    return notify(options)
  }

  return { toasts, notify, notifyOnce, dismiss }
}
