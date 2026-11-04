<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue?: string
    label?: string
    placeholder?: string
    hint?: string
    error?: string
    disabled?: boolean
    rows?: number
    maxlength?: number
  }>(),
  { rows: 3 },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fallbackId = useId()
const inputId = computed(() => props.id ?? fallbackId)

function onInput(e: Event): void {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <div class="ux-field" data-ux="textarea">
    <label v-if="label" class="ux-field__label" :for="inputId">{{ label }}</label>
    <textarea
      :id="inputId"
      class="ux-textarea"
      :class="{ 'ux-textarea--invalid': error }"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : undefined"
      @input="onInput"
    ></textarea>
    <span v-if="error" class="ux-field__error">{{ error }}</span>
    <span v-else-if="hint" class="ux-field__hint">{{ hint }}</span>
  </div>
</template>
