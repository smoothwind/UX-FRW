import { onScopeDispose, readonly, ref } from 'vue'
import type { Ref } from 'vue'

export interface ConfirmOptions {
  /** 标题；业务渲染 aria-label 时优先用它，缺省回退 message */
  title?: string
  message: string
  /** 确认按钮文案；缺省「确定」 */
  confirmText?: string
  /** 取消按钮文案；缺省「取消」 */
  cancelText?: string
  /** 破坏性操作语义：渲染端将确认按钮着 danger 色（红线：删除类必须 danger） */
  danger?: boolean
}

export interface ConfirmApi {
  /** 当前待结算的确认请求；null 表示无打开的确认框 */
  current: Readonly<Ref<ConfirmOptions | null>>
  /**
   * 发起确认请求，返回 Promise<boolean>：true=确认、false=取消。
   * Esc 由内部处理并结算 false（规则 8：Esc 关闭一切浮层）；
   * 上一个未结算的请求会被按取消结算（防业务 await 悬挂）。
   */
  confirm(options: ConfirmOptions | string): Promise<boolean>
  /** UI 调用：确认框按钮点击时结算（true=确认 / false=取消） */
  settle(ok: boolean): void
}

/**
 * Promise 化确认框（headless）：状态机、Esc、Promise 结算在此，
 * 视图交给渲染端（可用 UxDialog 组装轻量确认框，或业务自绘；
 * 建议渲染端 role="alertdialog" + aria-modal + 确认按钮自动聚焦）。
 * 提炼自 MdReader；供无 shell 的轻量窗口直接使用（改进提案 P1-2）。
 */
export function useConfirm(): ConfirmApi {
  const current = ref<ConfirmOptions | null>(null)
  let resolver: ((ok: boolean) => void) | null = null

  function finish(ok: boolean): void {
    if (!resolver) return
    current.value = null
    document.removeEventListener('keydown', onKeydown, true)
    const resolve = resolver
    resolver = null
    resolve(ok)
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Escape') return
    e.stopPropagation()
    finish(false)
  }

  function confirm(options: ConfirmOptions | string): Promise<boolean> {
    finish(false)
    current.value = typeof options === 'string' ? { message: options } : { ...options }
    document.addEventListener('keydown', onKeydown, true)
    return new Promise((resolve) => {
      resolver = resolve
    })
  }

  // 卸载时结算 pending，防止业务 await 悬挂；并确保监听被移除
  onScopeDispose(() => {
    finish(false)
  })

  return { current: readonly(current), confirm, settle: finish }
}
