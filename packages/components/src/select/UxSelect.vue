<script setup lang="ts">
import { computed, useId } from 'vue'
import UxIcon from '../icon/UxIcon.vue'

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue?: string
    label?: string
    hint?: string
    error?: string
    disabled?: boolean
  }>(),
  { modelValue: '' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fallbackId = useId()
const inputId = computed(() => props.id ?? fallbackId)

function onChange(e: Event): void {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="ux-field" data-ux="select">
    <label v-if="label" class="ux-field__label" :for="inputId">{{ label }}</label>
    <span class="ux-select__wrap">
      <select
        :id="inputId"
        class="ux-select"
        :class="{ 'ux-select--invalid': error }"
        :value="modelValue"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        @change="onChange"
      >
        <slot />
      </select>
      <span class="ux-select__chevron" aria-hidden="true">
        <UxIcon name="act-chevron-down" />
      </span>
    </span>
    <span v-if="error" class="ux-field__error">{{ error }}</span>
    <span v-else-if="hint" class="ux-field__hint">{{ hint }}</span>
  </div>
</template>
