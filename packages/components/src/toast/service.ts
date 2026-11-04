import { useNotify, type NotifyOptions, type NotifyRecord, type NotifyType } from '@ux/composables'

// 通知队列核心（状态 + notifyOnce 去重 + 自动消失）已下沉到 @ux/composables 的
// useNotify（改进提案 P1-2：与 ToastHost 渲染解耦，无组件包场景可独立使用）。
// 本文件只保留组件包的模块级单例转发：ToastHost 渲染 toastState.toasts。

export type ToastType = NotifyType
export type ToastOptions = NotifyOptions
export type ToastRecord = NotifyRecord

const api = useNotify()

export const toastState = {
  toasts: api.toasts,
}

export function dismissToast(id: number): void {
  api.dismiss(id)
}

export function notify(options: ToastOptions | string): number {
  return api.notify(options)
}

/** 同类通知 5 秒窗口内只出现一次（防多来源轰炸） */
export function notifyOnce(key: string, options: ToastOptions | string): number | null {
  return api.notifyOnce(key, options)
}
