<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue?: boolean
    label?: string
    hint?: string
    error?: string
    disabled?: boolean
  }>(),
  { modelValue: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const fallbackId = useId()
const inputId = computed(() => props.id ?? fallbackId)

function onChange(e: Event): void {
  emit('update:modelValue', (e.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="ux-field" data-ux="switch">
    <label class="ux-switch" :class="{ 'ux-switch--disabled': disabled }" :for="inputId">
      <input
        :id="inputId"
        class="ux-switch__input"
        type="checkbox"
        role="switch"
        :checked="modelValue"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        @change="onChange"
      />
      <span class="ux-switch__track" aria-hidden="true">
        <span class="ux-switch__thumb"></span>
      </span>
      <span v-if="label" class="ux-switch__text">{{ label }}</span>
    </label>
    <span v-if="error" class="ux-field__error">{{ error }}</span>
    <span v-else-if="hint" class="ux-field__hint">{{ hint }}</span>
  </div>
</template>
