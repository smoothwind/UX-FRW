<script setup lang="ts">
import { computed, onBeforeUnmount, onUnmounted, ref } from 'vue'
import { applyTheme, watchSystemTheme, FX_FROST, FX_METAL, FX_SHEEN, type UxTheme } from '@ux/tokens'
import { UxContextMenuHost, UxToastHost, notify } from '@ux/components'
import { CommandPalette } from '@ux/patterns'
import { createI18n, provideI18n, registerCommand, shortcuts, type Command } from '@ux/services'
import zhCN from './locales/zh-CN.json'
import en from './locales/en.json'
import { prefs } from './prefs'
import TokensPanel from './TokensPanel.vue'
import ComponentsDemo from './ComponentsDemo.vue'
import ServicesDemo from './ServicesDemo.vue'
import ShellDemo from './ShellDemo.vue'
import PatternsDemo from './PatternsDemo.vue'

const i18n = createI18n({
  locale: prefs.state.value.locale,
  fallback: 'zh-CN',
  messages: { 'zh-CN': zhCN, en },
  onLocaleChange: (locale) => prefs.patch({ locale }),
})
provideI18n(i18n)
const { t } = i18n
const localeRef = i18n.locale

const theme = ref<UxTheme>(prefs.state.value.theme)
const tab = ref<'tokens' | 'components' | 'services' | 'shell' | 'patterns'>('tokens')

const themes = computed(() => [
  { value: 'light' as UxTheme, label: t('theme.light') },
  { value: 'dark' as UxTheme, label: t('theme.dark') },
  { value: 'dark-silk' as UxTheme, label: t('theme.darkSilk') },
  { value: 'system' as UxTheme, label: t('theme.system') },
])

// 视觉特效：空数组 = 主题默认（dark-silk 默认 sheen）；显式列表覆盖默认
const fx = ref<string[]>([])
const fxOpacity = ref(0.72)
const fxSheen = ref(1)
const fxOptions = computed(() => [
  { name: FX_SHEEN, label: t('theme.sheen') },
  { name: FX_METAL, label: t('theme.metal') },
  { name: FX_FROST, label: t('theme.frost') },
])

function toggleFx(name: string): void {
  fx.value = fx.value.includes(name) ? fx.value.filter((n) => n !== name) : [...fx.value, name]
  applyTheme(theme.value, { fx: fx.value.length ? fx.value : undefined })
}

function onFxOpacity(value: number): void {
  fxOpacity.value = value
  document.documentElement.style.setProperty('--ux-frost-opacity', String(value))
}

function onFxSheen(value: number): void {
  fxSheen.value = value
  document.documentElement.style.setProperty('--ux-sheen-strength', String(value))
}

/** 单一调节滑块：跟随最后切换的可调特效（丝光/磨砂），始终只显示一个 */
const fxSlider = computed(() => {
  const last = fx.value[fx.value.length - 1]
  if (last === FX_FROST) {
    return {
      min: 0.5,
      max: 0.95,
      step: 0.01,
      value: fxOpacity.value,
      label: t('theme.frostOpacity'),
      fxAttr: 'data-ux-fx-opacity',
      set: (v: number) => onFxOpacity(v),
    }
  }
  if (last === FX_SHEEN) {
    return {
      min: 0,
      max: 1.5,
      step: 0.05,
      value: fxSheen.value,
      label: t('theme.sheenStrength'),
      fxAttr: 'data-ux-fx-sheen',
      set: (v: number) => onFxSheen(v),
    }
  }
  return null
})

const tabs = computed(() => [
  { value: 'tokens' as const, label: t('tabs.tokens') },
  { value: 'components' as const, label: t('tabs.components') },
  { value: 'services' as const, label: t('tabs.services') },
  { value: 'shell' as const, label: t('tabs.shell') },
  { value: 'patterns' as const, label: t('tabs.patterns') },
])

function setTheme(next: UxTheme): void {
  theme.value = next
  applyTheme(next, { fx: fx.value.length ? fx.value : undefined })
  prefs.patch({ theme: next })
}

// 常驻材质通道（P2-1 修订版）：独立于 fx 特效开关，挂 html 根属性
const materialOn = ref(false)
function toggleMaterial(): void {
  materialOn.value = !materialOn.value
  if (materialOn.value) document.documentElement.setAttribute('data-ux-material', 'glass')
  else document.documentElement.removeAttribute('data-ux-material')
}

const stopWatch = watchSystemTheme(() => {
  if (theme.value === 'system') setTheme('system')
})
onBeforeUnmount(stopWatch)
setTheme(theme.value)

const appCommands: Command[] = [
  {
    id: 'data.export',
    title: 'commands.export',
    icon: 'act-save',
    shortcut: 'Ctrl+E',
    category: 'Data',
    run: () => {
      notify({ type: 'success', message: i18n.t('toast.exported') })
    },
  },
  {
    id: 'data.reveal',
    title: 'commands.reveal',
    icon: 'act-external-link',
    shortcut: 'Ctrl+Shift+E',
    category: 'Data',
    run: () => {
      notify({ type: 'info', message: i18n.t('toast.revealed') })
    },
  },
  {
    id: 'data.reload',
    title: 'commands.reload',
    icon: 'act-retry',
    shortcut: 'Alt+R',
    category: 'Data',
    run: () => {
      notify({ type: 'info', message: i18n.t('toast.reloaded') })
    },
  },
  {
    id: 'data.delete',
    title: 'commands.delete',
    icon: 'act-delete',
    shortcut: 'Ctrl+Shift+D',
    category: 'Data',
    danger: true,
    run: () => {
      notify({
        type: 'danger',
        message: i18n.t('toast.deleted'),
        action: { label: '撤销', run: () => {
          notify('已撤销')
        } },
      })
    },
  },
  {
    id: 'view.resetDensity',
    title: 'services.resetPrefs',
    icon: 'act-settings',
    category: 'View',
    when: () => prefs.state.value.density !== 'comfortable',
    run: () => prefs.reset(),
  },
]

const disposeCommands = appCommands.map(registerCommand)
onUnmounted(() => {
  disposeCommands.forEach((dispose) => dispose())
})

const stopShortcuts = shortcuts.install()
onUnmounted(stopShortcuts)
</script>

<template>
  <div class="pg">
    <header class="pg-header">
      <h1 class="pg-title">{{ t('app.title') }}</h1>
      <span class="pg-sub">{{ t('app.subtitle') }}</span>
      <nav class="pg-tabs" data-ux="pg-nav" aria-label="demo sections">
        <button
          v-for="item in tabs"
          :key="item.value"
          class="pg-btn"
          :class="{ 'is-active': tab === item.value }"
          type="button"
          :data-ux-tab="item.value"
          :aria-current="tab === item.value ? 'page' : undefined"
          @click="tab = item.value"
        >
          {{ item.label }}
        </button>
      </nav>
      <div class="pg-langs" role="group" aria-label="Language">
        <button
          v-for="locale in i18n.availableLocales"
          :key="locale"
          class="pg-btn"
          :class="{ 'is-active': localeRef === locale }"
          type="button"
          :data-ux-locale="locale"
          @click="i18n.setLocale(locale)"
        >
          {{ locale === 'zh-CN' ? '中' : 'EN' }}
        </button>
      </div>
      <div class="pg-fx" role="group" :aria-label="t('theme.fx')">
        <button
          v-for="effect in fxOptions"
          :key="effect.name"
          class="pg-btn"
          :class="{ 'is-active': fx.includes(effect.name) }"
          type="button"
          :data-ux-fx-toggle="effect.name"
          @click="toggleFx(effect.name)"
        >
          {{ effect.label }}
        </button>
        <input
          v-if="fxSlider"
          class="pg-fx-opacity"
          type="range"
          :min="fxSlider.min"
          :max="fxSlider.max"
          :step="fxSlider.step"
          :value="fxSlider.value"
          :aria-label="fxSlider.label"
          :[fxSlider.fxAttr]="''"
          @input="fxSlider.set(Number(($event.target as HTMLInputElement).value))"
        />
        <button
          class="pg-btn"
          :class="{ 'is-active': materialOn }"
          type="button"
          data-ux-material-toggle
          :aria-pressed="materialOn"
          @click="toggleMaterial"
        >
          {{ t('theme.material') }}
        </button>
      </div>
      <div v-if="materialOn" class="pg-material-demo" data-ux-material-surface data-ux="pg-material-demo">
        {{ t('theme.materialPreview') }}
      </div>
      <div class="pg-themes" role="group" aria-label="Theme">
        <button
          v-for="item in themes"
          :key="item.value"
          class="pg-btn"
          :class="{ 'is-active': theme === item.value }"
          type="button"
          :data-ux-theme="item.value"
          @click="setTheme(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
    </header>

    <main class="pg-body" data-ux="pg-body" :data-ux-section="tab">
      <TokensPanel v-if="tab === 'tokens'" />
      <ComponentsDemo v-else-if="tab === 'components'" />
      <ServicesDemo v-else-if="tab === 'services'" />
      <ShellDemo v-else-if="tab === 'shell'" />
      <PatternsDemo v-else />
    </main>

    <UxToastHost />
    <UxContextMenuHost />
    <CommandPalette />
  </div>
</template>

<style scoped>
.pg {
  min-height: 100vh;
  background: var(--ux-bg);
  color: var(--ux-fg);
}

.pg-header {
  display: flex;
  align-items: center;
  gap: var(--ux-sp-3);
  padding: var(--ux-sp-3) var(--ux-sp-4);
  border-bottom: 1px solid var(--ux-border);
  background: var(--ux-bg-panel);
  position: sticky;
  top: 0;
}

.pg-title {
  margin: 0;
  font-size: var(--ux-fs-display);
  font-weight: var(--ux-fw-semibold);
}

.pg-sub {
  color: var(--ux-fg-muted);
  font-size: var(--ux-fs-md);
}

.pg-tabs {
  display: flex;
  gap: var(--ux-sp-1);
}

.pg-fx {
  display: flex;
  gap: var(--ux-sp-1);
  align-items: center;
}

.pg-fx-opacity {
  width: 96px;
  accent-color: var(--ux-accent);
}

.pg-material-demo {
  margin-top: var(--ux-sp-2);
  padding: var(--ux-sp-3);
  font-size: var(--ux-fs-sm);
  color: var(--ux-fg);
  border: 1px solid var(--ux-border);
  border-radius: var(--ux-radius-lg);
}

.pg-themes {
  margin-left: auto;
  display: flex;
  gap: var(--ux-sp-1);
}

.pg-langs {
  display: flex;
  gap: var(--ux-sp-1);
}

.pg-btn {
  padding: var(--ux-sp-1) var(--ux-sp-3);
  font-size: var(--ux-fs-lg);
  color: var(--ux-fg-muted);
  background: transparent;
  border: 1px solid var(--ux-border);
  border-radius: var(--ux-radius-sm);
  cursor: pointer;
  transition: all var(--ux-dur-fast) var(--ux-ease-out);
}

.pg-btn:hover {
  background: var(--ux-bg-hover);
  color: var(--ux-fg);
}

.pg-btn.is-active {
  background: var(--ux-accent);
  border-color: var(--ux-accent);
  color: var(--ux-fg-on-accent);
}

.pg-btn:focus-visible {
  outline: var(--ux-focus-width) solid var(--ux-focus-ring);
  outline-offset: 1px;
}

.pg-body {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--ux-sp-4);
}

.pg-body:has(.sl) {
  max-width: 1120px;
}
</style>
