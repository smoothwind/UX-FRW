<script setup lang="ts">
import UxIcon from '../icon/UxIcon.vue'
import type { IconId } from '../icon/registry'
import { dismissToast, toastState, type ToastRecord, type ToastType } from './service'

const ICONS: Record<ToastType, IconId> = {
  info: 'st-info',
  success: 'st-success',
  warning: 'st-warning',
  danger: 'st-error',
}

// 动作按钮结算后阻断冒泡：不触发主体的 onClick（两个回调语义独立）
function runAction(t: ToastRecord): void {
  t.action?.run()
  dismissToast(t.id)
}
</script>

<template>
  <Teleport to="body">
    <div class="ux-toast-host" aria-live="polite">
      <div
        v-for="t in toastState.toasts.value"
        :key="t.id"
        class="ux-toast"
        :class="[`ux-toast--${t.type}`, { 'ux-toast--clickable': !!t.onClick }]"
        role="status"
        @click="t.onClick?.()"
      >
        <UxIcon class="ux-toast__icon" :name="ICONS[t.type]" />
        <div class="ux-toast__body">
          <span>{{ t.message }}</span>
          <button
            v-if="t.action"
            class="ux-toast__action"
            type="button"
            @click.stop="runAction(t)"
          >
            {{ t.action.label }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
