<script setup lang="ts">
import { computed } from 'vue'
import type { IconId } from '@ux/components'
import { UxIcon } from '@ux/components'

const props = defineProps<{
  /** 图标语义唯一（红线 13）：一般用 obj-* 对象图标 */
  icon?: IconId
  title: string
  hint?: string
  compact?: boolean
  /** 筛选过严变体：icon 缺省时改用 act-search（搜索语义，红线 14/C6），配合「清除筛选」动作 */
  filtered?: boolean
}>()

const resolvedIcon = computed<IconId | undefined>(
  () => props.icon ?? (props.filtered ? 'act-search' : undefined),
)
</script>

<template>
  <div class="ux-empty" data-ux="empty" :class="{ 'ux-empty--compact': compact, 'ux-empty--filtered': filtered }">
    <UxIcon v-if="resolvedIcon" :name="resolvedIcon" class="ux-empty__icon" />
    <div class="ux-empty__title">{{ title }}</div>
    <div v-if="hint" class="ux-empty__hint">{{ hint }}</div>
    <div v-if="$slots.action" class="ux-empty__action">
      <slot name="action" />
    </div>
  </div>
</template>
