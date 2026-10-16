<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { UxButton, UxIcon, UxKbd, notify } from '@ux/components'
import {
  commandVersion,
  eventToShortcut,
  getAllCommands,
  runCommand,
  shortcuts,
  useI18n,
  type Command,
} from '@ux/services'
import { prefs } from './prefs'

const { t } = useI18n()
const prefsState = prefs.state

const commands = computed<Command[]>(() => {
  void commandVersion()
  return getAllCommands()
})

const issues = computed(() => {
  void commandVersion()
  void shortcuts.overrides.value
  return shortcuts.getIssues()
})

function effective(cmd: Command): string | undefined {
  void shortcuts.overrides.value
  return shortcuts.getEffectiveShortcut(cmd.id)
}

const capturing = ref<string | null>(null)

function startCapture(id: string): void {
  capturing.value = id
  shortcuts.setSuspended(true)
}

function stopCapture(): void {
  capturing.value = null
  shortcuts.setSuspended(false)
}

function onCaptureKey(e: KeyboardEvent): void {
  if (!capturing.value) return
  e.preventDefault()
  e.stopPropagation()
  if (e.key === 'Escape') {
    stopCapture()
    return
  }
  const combo = eventToShortcut(e)
  if (!combo) return
  shortcuts.setOverride(capturing.value, combo)
  notify({ type: 'success', message: t('toast.rebound', { keys: combo }) })
  stopCapture()
}

watch(capturing, (value) => {
  if (value) document.addEventListener('keydown', onCaptureKey, true)
  else document.removeEventListener('keydown', onCaptureKey, true)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onCaptureKey, true)
  shortcuts.setSuspended(false)
})

function resetKey(id: string): void {
  shortcuts.setOverride(id, null)
  notify({ type: 'info', message: t('toast.resetKey') })
}

function run(cmd: Command): void {
  void runCommand(cmd.id)
}

function openPalette(): void {
  void runCommand('palette.open')
}

function setDensity(density: 'comfortable' | 'compact'): void {
  prefs.patch({ density })
}

function resetPrefs(): void {
  prefs.reset()
}
</script>

<template>
  <div class="sv">
    <section class="pg-card">
      <h2>{{ t('services.commandsTitle') }}</h2>
      <p class="pg-note">{{ t('services.commandsHint') }}</p>
      <div class="row">
        <UxButton variant="primary" icon="act-search" @click="openPalette">
          {{ t('services.openPalette') }}
        </UxButton>
      </div>

      <div class="sv-table">
        <div class="sv-row sv-row--head">
          <span>ID</span><span>Title</span><span>Shortcut</span><span>Actions</span>
        </div>
        <div v-for="c in commands" :key="c.id" class="sv-row">
          <code>{{ c.id }}</code>
          <span :class="{ 'is-danger': c.danger }">{{ t(c.title) }}</span>
          <span class="sv-keys">
            <UxKbd v-if="effective(c)" :keys="effective(c)!" />
            <em v-else>—</em>
          </span>
          <span class="sv-actions">
            <UxButton size="sm" @click="run(c)">{{ t('services.run') }}</UxButton>
            <UxButton size="sm" @click="startCapture(c.id)">
              {{ capturing === c.id ? t('services.capturing') : t('services.rebind') }}
            </UxButton>
            <UxButton
              size="sm"
              variant="ghost"
              icon="act-retry"
              :label="t('services.resetKey')"
              @click="resetKey(c.id)"
            />
          </span>
        </div>
      </div>

      <h3 class="sv-sub">{{ t('services.conflictsTitle') }}</h3>
      <p v-if="issues.length === 0" class="pg-note sv-ok">
        <UxIcon name="act-check" /> {{ t('services.noConflicts') }}
      </p>
      <ul v-else class="sv-issues">
        <li v-for="(issue, idx) in issues" :key="idx" class="sv-issue">
          <UxIcon name="st-warning" /> {{ issue.message }}
        </li>
      </ul>
    </section>

    <section class="pg-card">
      <h2>{{ t('services.prefsTitle') }}</h2>
      <div class="row">
        <span class="sv-label">{{ t('services.density') }}</span>
        <UxButton
          size="sm"
          :variant="prefsState.density === 'comfortable' ? 'primary' : 'secondary'"
          @click="setDensity('comfortable')"
        >
          {{ t('services.comfortable') }}
        </UxButton>
        <UxButton
          size="sm"
          :variant="prefsState.density === 'compact' ? 'primary' : 'secondary'"
          @click="setDensity('compact')"
        >
          {{ t('services.compact') }}
        </UxButton>
        <UxButton size="sm" variant="ghost" icon="act-retry" @click="resetPrefs">
          {{ t('services.resetPrefs') }}
        </UxButton>
      </div>
      <pre class="sv-prefs">{{ JSON.stringify(prefsState, null, 2) }}</pre>
    </section>
  </div>
</template>

<style scoped>
.sv {
  display: grid;
  gap: var(--ux-sp-4);
}

.pg-card {
  background: var(--ux-bg-panel);
  border: 1px solid var(--ux-border);
  border-radius: var(--ux-radius-lg);
  padding: var(--ux-sp-4);
}

.pg-card h2 {
  margin: 0 0 var(--ux-sp-2);
  font-size: var(--ux-fs-xl);
  font-weight: var(--ux-fw-semibold);
}

.pg-note {
  margin: 0 0 var(--ux-sp-2);
  color: var(--ux-fg-muted);
  font-size: var(--ux-fs-md);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ux-sp-2);
}

.sv-table {
  display: grid;
  gap: var(--ux-sp-1);
  margin: var(--ux-sp-3) 0;
}

.sv-row {
  display: grid;
  grid-template-columns: 150px 1fr 170px auto;
  align-items: center;
  gap: var(--ux-sp-2);
  padding: var(--ux-sp-1) var(--ux-sp-2);
  border-radius: var(--ux-radius-sm);
}

.sv-row--head {
  font-size: var(--ux-fs-sm);
  color: var(--ux-fg-subtle);
}

.sv-row:not(.sv-row--head) {
  background: var(--ux-bg);
  border: 1px solid var(--ux-border);
}

.sv-row code {
  font-family: var(--ux-font-family-mono);
  font-size: var(--ux-fs-sm);
  color: var(--ux-fg-muted);
}

.is-danger {
  color: var(--ux-danger);
}

.sv-keys em {
  color: var(--ux-fg-subtle);
}

.sv-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--ux-sp-1);
}

.sv-sub {
  margin: var(--ux-sp-2) 0 var(--ux-sp-1);
  font-size: var(--ux-fs-lg);
  font-weight: var(--ux-fw-semibold);
}

.sv-ok {
  display: inline-flex;
  align-items: center;
  gap: var(--ux-sp-1);
  color: var(--ux-success);
}

.sv-issues {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--ux-sp-1);
}

.sv-issue {
  display: inline-flex;
  align-items: center;
  gap: var(--ux-sp-1);
  color: var(--ux-warning);
  font-size: var(--ux-fs-md);
}

.sv-label {
  color: var(--ux-fg-muted);
  font-size: var(--ux-fs-md);
}

.sv-prefs {
  margin: var(--ux-sp-3) 0 0;
  padding: var(--ux-sp-2);
  background: var(--ux-bg-sunken);
  border: 1px solid var(--ux-border);
  border-radius: var(--ux-radius-sm);
  font-family: var(--ux-font-family-mono);
  font-size: var(--ux-fs-sm);
  color: var(--ux-fg-muted);
}
</style>
