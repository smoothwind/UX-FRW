<script setup lang="ts">
import type { SegmentedOption } from '../segmented/types'

const props = withDefaults(
  defineProps<{
    /** 当前选中值集合（v-model；空数组 = 全部） */
    modelValue: string[]
    options: SegmentedOption[]
    size?: 'sm' | 'md'
    /** 无障碍名称（红线 10，容器 role=group 必填） */
    ariaLabel: string
  }>(),
  { size: 'sm' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

function on(value: string): boolean {
  return props.modelValue.includes(value)
}

function toggle(option: SegmentedOption): void {
  if (option.disabled) return
  const set = new Set(props.modelValue)
  if (set.has(option.value)) set.delete(option.value)
  else set.add(option.value)
  emit('update:modelValue', [...set])
}
</script>

<template>
  <div class="ux-fchips" :class="`ux-fchips--${size}`" role="group" :aria-label="ariaLabel" data-ux="filter-chips">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      class="ux-fchips__chip"
      :class="{ 'is-on': on(o.value) }"
      :aria-pressed="on(o.value)"
      :disabled="o.disabled"
      @click="toggle(o)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
