<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { UxButton, UxChip, UxFilterChips, UxInput, UxSegmented, type SegmentedOption } from '@ux/components'
import { createPreferences, tryUseI18n } from '@ux/services'
import EmptyState from '../empty-state/EmptyState.vue'
import type { ConfigListEntry, ConfigListFacet, ConfigListGroup } from './types'

const props = withDefaults(
  defineProps<{
    /** 配置条目全集 */
    entries: ConfigListEntry[]
    /** 分组定义（渲染顺序 = 数组顺序；无匹配条目的组不渲染） */
    groups: ConfigListGroup[]
    /** 草稿覆盖表（v-model；key → 覆盖值，空串/缺省 = 未覆盖） */
    modelValue: Record<string, string>
    /** facet 筛选项（多选 chips；缺省不渲染） */
    facets?: ConfigListFacet[]
    /** localStorage key：提供时记忆展开状态（createPreferences 版本化存储） */
    storageKey?: string
    /** 保存中（保存按钮 loading） */
    saving?: boolean
    /** 无障碍名称（红线 10） */
    label?: string
  }>(),
  { facets: () => [] },
)

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
  /** 批量保存（仅携带非空覆盖），确认与持久化由宿主负责 */
  save: [value: Record<string, string>]
  /** 恢复全部内置（宿主确认后清空 modelValue） */
  reset: []
}>()

const i18n = tryUseI18n()
function tr(key: string, fallback: string, params?: Record<string, string | number>): string {
  const fill = (text: string): string =>
    params ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : text
  if (!i18n) return fill(fallback)
  const value = i18n.t(key, params)
  return value === key ? fill(fallback) : value
}

/* ---------- 筛选状态 ---------- */
const search = ref('')
const coverage = ref<'all' | 'overridden' | 'plain'>('all')
const selectedFacets = ref<string[]>([])

const coverageOptions = computed<SegmentedOption[]>(() => [
  { value: 'all', label: tr('patterns.configList.all', '全部') },
  { value: 'overridden', label: tr('patterns.configList.overridden', '已覆盖') },
  { value: 'plain', label: tr('patterns.configList.plain', '未覆盖') },
])

const searchPlaceholder = computed(() => tr('patterns.configList.searchPlaceholder', '搜索 key / 用途 / 值'))

function dirtyOf(key: string): boolean {
  return (props.modelValue[key] ?? '').trim() !== ''
}

function matchEntry(e: ConfigListEntry): boolean {
  if (selectedFacets.value.length && (e.facet === undefined || !selectedFacets.value.includes(e.facet))) {
    return false
  }
  if (coverage.value === 'overridden' && !dirtyOf(e.key)) return false
  if (coverage.value === 'plain' && dirtyOf(e.key)) return false
  const kw = search.value.trim().toLowerCase()
  if (kw) {
    const hay = `${e.key} ${e.usage ?? ''} ${e.builtin ?? ''} ${e.tag ?? ''}`.toLowerCase()
    if (!hay.includes(kw)) return false
  }
  return true
}

const matched = computed(() => props.entries.filter(matchEntry))

/** 渲染分组：按 groups 顺序，仅保留有匹配条目的组 */
const visibleGroups = computed(() =>
  props.groups
    .map((g) => ({ group: g, entries: matched.value.filter((e) => e.group === g.id) }))
    .filter((g) => g.entries.length > 0),
)

const hasFilter = computed(
  () => Boolean(search.value.trim()) || selectedFacets.value.length > 0 || coverage.value !== 'all',
)

/** 筛选反馈条文案：facet × 覆盖状态 × 关键词 */
const criteria = computed(() => {
  const parts: string[] = []
  if (selectedFacets.value.length) {
    parts.push(
      selectedFacets.value
        .map((v) => props.facets.find((f) => f.value === v)?.label ?? v)
        .join(tr('patterns.configList.criteriaJoin', '、')),
    )
  }
  if (coverage.value === 'overridden') parts.push(tr('patterns.configList.overridden', '已覆盖'))
  if (coverage.value === 'plain') parts.push(tr('patterns.configList.plain', '未覆盖'))
  if (search.value.trim()) parts.push(`“${search.value.trim()}”`)
  return parts.join(' × ')
})

function clearFilters(): void {
  search.value = ''
  selectedFacets.value = []
  coverage.value = 'all'
}

/** facet 筛选生效时同屏全是该 facet，隐藏 tag 徽标降噪 */
const showTag = computed(() => selectedFacets.value.length === 0)

/* ---------- 展开状态（默认展开有覆盖的组；storageKey 记忆） ---------- */
const prefs = props.storageKey
  ? createPreferences<{ open: string[] }>({ key: props.storageKey, version: 1, defaults: { open: [] } })
  : null

const open = ref<string[]>([])
let expandInitialized = false

watch(
  [() => props.modelValue, () => props.groups],
  () => {
    // 分组可能异步加载：等 groups 非空再初始化一次
    if (expandInitialized || !props.groups.length) return
    expandInitialized = true
    const stored = prefs?.state.value.open ?? []
    if (stored.length) {
      open.value = stored.filter((id) => props.groups.some((g) => g.id === id))
      return
    }
    const dirty = props.groups
      .filter((g) => props.entries.some((e) => e.group === g.id && dirtyOf(e.key)))
      .map((g) => g.id)
    open.value = dirty.length ? dirty : props.groups.length ? [props.groups[0].id] : []
  },
  { immediate: true },
)

watch(open, (v) => prefs?.set('open', [...v]), { deep: true })

function expandAll(): void {
  open.value = props.groups.map((g) => g.id)
}

function collapseAll(): void {
  open.value = []
}

function toggleGroup(id: string): void {
  open.value = open.value.includes(id) ? open.value.filter((v) => v !== id) : [...open.value, id]
}

/* ---------- 草稿 / 脏跟踪 / 动作 ---------- */
function setValue(key: string, value: string): void {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const dirtyCount = computed(() => props.entries.filter((e) => dirtyOf(e.key)).length)

const saveValues = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {}
  for (const e of props.entries) {
    const v = (props.modelValue[e.key] ?? '').trim()
    if (v) out[e.key] = props.modelValue[e.key]
  }
  return out
})

function groupLabel(g: ConfigListGroup, entries: ConfigListEntry[]): string {
  return tr('patterns.configList.groupAria', '{label}，共 {total} 条，已覆盖 {n}', {
    label: g.label,
    total: entries.length,
    n: entries.filter((e) => dirtyOf(e.key)).length,
  })
}

function groupBadge(entries: ConfigListEntry[]): string {
  return tr('patterns.configList.groupOverridden', '{n} 已覆盖', {
    n: entries.filter((e) => dirtyOf(e.key)).length,
  })
}

function rowsOf(value: string): number {
  return Math.min(12, Math.max(1, (value.match(/\n/g)?.length ?? 0) + 1))
}

const uid = useId()
</script>

<template>
  <section class="ux-clist" data-ux="config-list" :aria-label="label">
    <div class="ux-clist__bar" data-ux-part="config-list-toolbar">
      <UxInput v-model="search" type="search" class="ux-clist__search" :placeholder="searchPlaceholder" />
      <UxFilterChips
        v-if="facets.length"
        v-model="selectedFacets"
        size="sm"
        :options="facets"
        :ariaLabel="tr('patterns.configList.facetsLabel', '种类筛选（多选）')"
      />
      <UxSegmented v-model="coverage" size="sm" :options="coverageOptions" :ariaLabel="tr('patterns.configList.coverageLabel', '覆盖状态')" />
    </div>

    <div class="ux-clist__actions" data-ux-part="config-list-actions">
      <span v-if="dirtyCount" class="ux-clist__dirty" data-ux-part="config-list-dirty">
        {{ tr('patterns.configList.unsaved', '有 {n} 处未保存修改', { n: dirtyCount }) }}
      </span>
      <UxButton size="sm" variant="ghost" @click="expandAll">
        {{ tr('patterns.configList.expandAll', '展开全部') }}
      </UxButton>
      <UxButton size="sm" variant="ghost" @click="collapseAll">
        {{ tr('patterns.configList.collapseAll', '折叠全部') }}
      </UxButton>
      <UxButton size="sm" variant="secondary" :disabled="!dirtyCount" @click="emit('reset')">
        {{ tr('patterns.configList.resetAll', '恢复全部内置') }}
      </UxButton>
      <UxButton
        size="sm"
        variant="primary"
        icon="act-save"
        :loading="saving"
        :disabled="!dirtyCount"
        data-ux-part="config-list-save"
        @click="emit('save', saveValues)"
      >
        {{ tr('patterns.configList.save', '保存') }}
      </UxButton>
    </div>

    <div v-if="hasFilter" class="ux-clist__filterbar" data-ux-part="config-list-filterbar">
      <span class="ux-clist__filterbar-text">
        {{ tr('patterns.configList.matched', '筛选：{criteria} · 匹配 {count} 条', { criteria, count: matched.length }) }}
      </span>
      <UxButton size="sm" variant="ghost" @click="clearFilters">
        {{ tr('patterns.configList.clearFilters', '清除筛选') }}
      </UxButton>
    </div>

    <div class="ux-clist__list" data-ux-part="config-list-list">
      <div v-for="{ group, entries } in visibleGroups" :key="group.id" class="ux-clist__group">
        <button
          type="button"
          class="ux-clist__group-head"
          :aria-expanded="open.includes(group.id)"
          :aria-controls="`${uid}-group-${group.id}`"
          :aria-label="groupLabel(group, entries)"
          @click="toggleGroup(group.id)"
        >
          <span class="ux-clist__chevron" :class="{ 'is-open': open.includes(group.id) }" aria-hidden="true" />
          <span class="ux-clist__group-name">{{ group.label }}</span>
          <span v-if="entries.some((e) => dirtyOf(e.key))" class="ux-clist__badge">
            {{ groupBadge(entries) }}
          </span>
        </button>
        <div v-show="open.includes(group.id)" :id="`${uid}-group-${group.id}`" class="ux-clist__items" role="region" :aria-label="group.label">
          <div v-for="e in entries" :key="e.key" class="ux-clist__item">
            <div class="ux-clist__item-head">
              <span class="ux-clist__usage" :title="e.key">{{ e.usage || e.key }}</span>
              <UxChip v-if="showTag && e.tag" tone="neutral">{{ e.tag }}</UxChip>
              <span v-if="dirtyOf(e.key)" class="ux-clist__badge">
                {{ tr('patterns.configList.overridden', '已覆盖') }}
              </span>
              <UxButton
                size="sm"
                variant="ghost"
                class="ux-clist__reset-one"
                :disabled="!dirtyOf(e.key)"
                @click="setValue(e.key, '')"
              >
                {{ tr('patterns.configList.resetOne', '恢复内置') }}
              </UxButton>
            </div>
            <div class="ux-clist__meta">
              <span class="ux-clist__key" :title="e.key">{{ tr('patterns.configList.keyLabel', 'key') }}: {{ e.key }}</span>
              <span v-if="e.placeholders?.length" class="ux-clist__ph">
                <code v-for="p in e.placeholders" :key="p">{{ '{' + p + '}' }}</code>
              </span>
            </div>
            <textarea
              class="ux-clist__editor"
              :value="modelValue[e.key] ?? ''"
              :placeholder="e.builtin"
              :rows="rowsOf(modelValue[e.key] ?? '')"
              :aria-label="e.usage || e.key"
              spellcheck="false"
              @input="setValue(e.key, ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>
      </div>

      <EmptyState
        v-if="!visibleGroups.length"
        class="ux-clist__empty"
        :filtered="hasFilter"
        :title="hasFilter ? tr('patterns.configList.filteredEmpty', '没有匹配的配置项') : tr('patterns.configList.empty', '暂无配置项')"
        :hint="hasFilter ? tr('patterns.configList.filteredEmptyHint', '当前筛选条件下没有匹配项，可调整或清除筛选') : undefined"
      >
        <template v-if="hasFilter" #action>
          <UxButton size="sm" variant="secondary" @click="clearFilters">
            {{ tr('patterns.configList.clearFilters', '清除筛选') }}
          </UxButton>
        </template>
      </EmptyState>
    </div>
  </section>
</template>
