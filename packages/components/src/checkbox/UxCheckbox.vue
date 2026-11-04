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
    /** 半选态（父级全选控件的标准语义，视觉为横杠） */
    indeterminate?: boolean
  }>(),
  { modelValue: false, indeterminate: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const fallbackId = useId()
const inputId = computed(() => props.id ?? fallbackId)

function onChange(e: Event): void {
  emit('update:modelValue', (e.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="ux-field" data-ux="checkbox">
    <label class="ux-checkbox" :class="{ 'ux-checkbox--disabled': disabled }" :for="inputId">
      <input
        :id="inputId"
        class="ux-checkbox__input"
        type="checkbox"
        :checked="modelValue"
        :indeterminate.prop="indeterminate"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        @change="onChange"
      />
      <span class="ux-checkbox__box" aria-hidden="true"></span>
      <span v-if="label" class="ux-checkbox__text">{{ label }}</span>
    </label>
    <span v-if="error" class="ux-field__error">{{ error }}</span>
    <span v-else-if="hint" class="ux-field__hint">{{ hint }}</span>
  </div>
</template>
