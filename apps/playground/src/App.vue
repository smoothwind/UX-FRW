<script setup lang="ts">
import { computed, onBeforeUnmount, onUnmounted, ref } from 'vue'
import { applyTheme, watchSystemTheme, type UxTheme } from '@ux/tokens'
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
  { value: 'system' as UxTheme, label: t('theme.system') },
])

const tabs = computed(() => [
  { value: 'tokens' as const, label: t('tabs.tokens') },
  { value: 'components' as const, label: t('tabs.components') },
  { value: 'services' as const, label: t('tabs.services') },
  { value: 'shell' as const, label: t('tabs.shell') },
  { value: 'patterns' as const, label: t('tabs.patterns') },
])

function setTheme(next: UxTheme): void {
  theme.value = next
  applyTheme(next)
  prefs.patch({ theme: next })
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
    run: () => notify({ type: 'success', message: i18n.t('toast.exported') }),
  },
  {
    id: 'data.reveal',
    title: 'commands.reveal',
    icon: 'act-external-link',
    shortcut: 'Ctrl+Shift+E',
    category: 'Data',
    run: () => notify({ type: 'info', message: i18n.t('toast.revealed') }),
  },
  {
    id: 'data.reload',
    title: 'commands.reload',
    icon: 'act-retry',
    shortcut: 'Alt+R',
    category: 'Data',
    run: () => notify({ type: 'info', message: i18n.t('toast.reloaded') }),
  },
  {
    id: 'data.delete',
    title: 'commands.delete',
    icon: 'act-delete',
    shortcut: 'Ctrl+Shift+D',
    category: 'Data',
    danger: true,
    run: () =>
      notify({
        type: 'danger',
        message: i18n.t('toast.deleted'),
        action: { label: '撤销', run: () => notify('已撤销') },
      }),
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
      <nav class="pg-tabs" aria-label="demo sections">
        <button
          v-for="item in tabs"
          :key="item.value"
          class="pg-btn"
          :class="{ 'is-active': tab === item.value }"
          type="button"
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
          @click="i18n.setLocale(locale)"
        >
          {{ locale === 'zh-CN' ? '中' : 'EN' }}
        </button>
      </div>
      <div class="pg-themes" role="group" aria-label="Theme">
        <button
          v-for="item in themes"
          :key="item.value"
          class="pg-btn"
          :class="{ 'is-active': theme === item.value }"
          type="button"
          @click="setTheme(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
    </header>

    <main class="pg-body">
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
