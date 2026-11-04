<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue?: number
    label?: string
    min?: number
    max?: number
    step?: number
    hint?: string
    disabled?: boolean
    /** 在标签行右侧显示当前值 */
    showValue?: boolean
  }>(),
  { modelValue: 0, min: 0, max: 100, step: 1 },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const fallbackId = useId()
const inputId = computed(() => props.id ?? fallbackId)

/** 已走过占比（%），驱动填充轨道 --ux-slider-fill */
const fillPercent = computed(() => {
  const span = props.max - props.min
  if (span <= 0) return 0
  const clamped = Math.min(props.max, Math.max(props.min, props.modelValue))
  return Math.round(((clamped - props.min) / span) * 10000) / 100
})

function onInput(e: Event): void {
  emit('update:modelValue', Number((e.target as HTMLInputElement).value))
}
</script>

<template>
  <div class="ux-field" data-ux="slider">
    <label v-if="label" class="ux-field__label ux-slider__label" :for="inputId">
      <span>{{ label }}</span>
      <output v-if="showValue" class="ux-slider__value" :for="inputId">{{ modelValue }}</output>
    </label>
    <input
      :id="inputId"
      class="ux-slider"
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :style="{ '--ux-slider-fill': `${fillPercent}%` }"
      @input="onInput"
    />
    <span v-if="hint" class="ux-field__hint">{{ hint }}</span>
  </div>
</template>
