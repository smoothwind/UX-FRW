<script setup lang="ts">
import { computed, ref } from 'vue'
import { UxChip, UxButton, UxIcon, UxSegmented, UxTooltip, notify, type SegmentedOption } from '@ux/components'
import { useDockLayout, useTabs, type TabItemState } from '@ux/composables'
import { TourGuide } from '@ux/patterns'
import { useI18n } from '@ux/services'
import {
  UxActivityBar,
  UxAppShell,
  UxDockWorkbench,
  UxPanelToolbar,
  UxSplitPane,
  UxStatusBar,
  UxTabList,
  UxTabs,
  UxTitleBar,
  type ActivityItem,
  type DockPanelDef,
} from '@ux/shell'

const { t } = useI18n()

const dock = useDockLayout({
  key: 'uxkit.playground.dock',
  panels: {
    explorer: { zone: 'left' },
    search: { zone: null, lastZone: 'left' },
    settings: { zone: null, lastZone: 'left' },
    output: { zone: 'bottom' },
  },
  sizes: { left: 240, bottom: 160 },
})

const panelDefs = computed<DockPanelDef[]>(() => [
  { id: 'explorer', title: t('shell.activity.explorer') },
  { id: 'search', title: t('shell.activity.search') },
  { id: 'settings', title: t('shell.activity.settings') },
  { id: 'output', title: t('shell.activity.output') },
])

const activityItems = computed<ActivityItem[]>(() => [
  { id: 'explorer', icon: 'obj-folder', label: t('shell.activity.explorer') },
  { id: 'search', icon: 'act-search', label: t('shell.activity.search') },
  { id: 'settings', icon: 'act-settings', label: t('shell.activity.settings') },
  { id: 'output', icon: 'obj-table', label: t('shell.activity.output'), badge: 4 },
  { id: 'help', icon: 'st-info', label: '帮助（常驻）', pinned: true },
])

const editorView = ref('edit')
const viewOptions: SegmentedOption[] = [
  { value: 'edit', label: '编辑' },
  { value: 'preview', label: '预览' },
]

const activeId = computed(() => dock.active.value)
const floatCount = computed(() => dock.floating.value.length)

const editor = useTabs<TabItemState>({
  max: 5,
  onLimit: (n) => notify({ type: 'warning', message: t('shell.tabs.limit', { n }) }),
})
editor.importSnapshot([
  { id: 'doc-readme', title: 'README.md', subtitle: '本地 · 主文档', status: 'on', accent: 'var(--ux-success)' },
  { id: 'doc-query', title: 'users.query.sql', subtitle: 'MySQL@demo', dirty: true, status: 'lost', accent: 'var(--ux-danger)' },
  { id: 'doc-notes', title: 'layout.notes.md', subtitle: '未连接', status: 'off', accent: 'var(--ux-fg-subtle)' },
])

const activeTitle = computed(() => editor.activeTab.value?.title ?? '—')
const tabCount = computed(() => editor.tabs.value.length)
const splitRatio = ref(0.5)
const splitMode = ref<'single' | 'lr' | 'tb'>('single')
const splitOn = computed(() => splitMode.value !== 'single')
const splitOrientation = computed(() => (splitMode.value === 'tb' ? 'vertical' : 'horizontal'))
const splitOptions: SegmentedOption[] = [
  { value: 'single', icon: 'act-unsplit', ariaLabel: '单屏' },
  { value: 'lr', icon: 'act-split', ariaLabel: '左右分屏' },
  { value: 'tb', icon: 'act-split-stack', ariaLabel: '上下分屏' },
]

const introItems = [
  {
    name: 'UxAppShell',
    descKey: 'shell.intro.appshell',
    api: '#titlebar · #menubar · #statusbar · body (default)',
    marks: ['data-ux="appshell"', 'data-ux-part="menubar"', 'data-ux-part="body"'],
  },
  {
    name: 'UxTitleBar',
    descKey: 'shell.intro.titlebar',
    api: 'title · controls · #left · #right',
    marks: ['data-ux="titlebar"', 'data-ux-part="titlebar-left|center|right"', 'data-ux-part="window-controls"'],
  },
  {
    name: 'UxActivityBar',
    descKey: 'shell.intro.activitybar',
    api: 'items · active-id · label · @select',
    marks: ['data-ux="activitybar"'],
  },
  {
    name: 'UxStatusBar',
    descKey: 'shell.intro.statusbar',
    api: 'default (left) · #right',
    marks: ['data-ux="statusbar"', 'data-ux-part="statusbar-left|right"'],
  },
  {
    name: 'UxDockWorkbench',
    descKey: 'shell.intro.dock',
    api: 'layout · panels · #activity · #panel · #center',
    marks: ['data-ux="dock"', 'data-ux-part="dock-left|right|bottom|center"', 'data-ux-part="drop-overlay|floats|minimize-stack"'],
  },
  {
    name: 'UxPanel',
    descKey: 'shell.intro.panel',
    api: 'panel-id · title · floating · draggable · @dragstart @dragend · @dblclick · @float @minimize @close',
    marks: ['data-ux="panel"', 'data-ux-part="panel-head|body"'],
  },
  {
    name: 'UxFloatPanel',
    descKey: 'shell.intro.float',
    api: 'panel-id · title · geom · z · @move @resize @focus @dock @minimize @close',
    marks: ['data-ux="float"'],
  },
  {
    name: 'UxSplitter',
    descKey: 'shell.intro.splitter',
    api: 'v-model · orientation · min · max · reverse · step · label',
    marks: ['data-ux="splitter"'],
  },
  {
    name: 'UxSplitPane',
    descKey: 'shell.intro.splitpane',
    api: 'v-model:ratio · orientation · min · max · #first · #second',
    marks: ['data-ux="splitpane"', 'data-ux-part="pane-first|second"'],
  },
  {
    name: 'UxTabs',
    descKey: 'shell.intro.tabs',
    api: 'items{title,dirty,icon,status,subtitle,accent} · active-id · label · #actions · @select @close @close-others @close-right @close-left @close-all @reorder',
    marks: ['data-ux="tabs"', 'data-ux-part="tab"', 'data-ux-tab-id="<id>"'],
  },
  {
    name: 'useDockLayout / useTabs',
    descKey: 'shell.intro.composables',
    api: 'useDockLayout({ key, panels, sizes }) · useTabs({ max, onLimit, guardClose })',
    marks: [],
  },
]

function openEditorTab(): void {
  editor.open({ title: t('shell.tabs.new') })
}

function titleOf(id: string): string {
  return panelDefs.value.find((p) => p.id === id)?.title ?? id
}

function selectPanel(id: string): void {
  dock.toggle(id)
}

const tourRef = ref<InstanceType<typeof TourGuide> | null>(null)

const shellTourSteps = computed(() => [
  { target: '[data-ux="titlebar"]', title: t('shell.tour.s1Title'), desc: t('shell.tour.s1Desc') },
  { target: '[data-ux="activitybar"]', title: t('shell.tour.s2Title'), desc: t('shell.tour.s2Desc') },
  { target: '[data-ux-part="dock-left"]', title: t('shell.tour.s3Title'), desc: t('shell.tour.s3Desc') },
  { target: '[data-ux-part="dock-center"]', title: t('shell.tour.s4Title'), desc: t('shell.tour.s4Desc') },
  { target: '[data-ux-part="dock-bottom"]', title: t('shell.tour.s5Title'), desc: t('shell.tour.s5Desc') },
  { target: '[data-ux="statusbar"]', title: t('shell.tour.s6Title'), desc: t('shell.tour.s6Desc') },
  { target: '.sl-intro', title: t('shell.tour.s7Title'), desc: t('shell.tour.s7Desc') },
])

function startTour(): void {
  tourRef.value?.start()
}
</script>

<template>
  <section class="sl">
    <div class="sl-head">
      <h2>{{ t('shell.demoTitle') }}</h2>
      <UxButton size="sm" variant="secondary" icon="st-info" @click="startTour">
        {{ t('shell.tour.start') }}
      </UxButton>
    </div>
    <p class="pg-note">{{ t('shell.demoHint') }}</p>

    <div class="sl-frame">
      <UxAppShell>
        <template #titlebar>
          <UxTitleBar :title="t('shell.demoTitle')">
            <template #left>
              <span class="sl-brand">UxKit</span>
            </template>
          </UxTitleBar>
        </template>

        <UxDockWorkbench :layout="dock" :panels="panelDefs">
          <template #activity>
            <UxActivityBar
              :items="activityItems"
              :active-id="activeId"
              label="Activity Bar"
              @select="selectPanel"
            />
          </template>

          <template #panel="{ id }">
            <p class="pg-note">{{ t(`shell.body.${id}`) }}</p>
          </template>

          <template #center>
            <div class="sl-editor">
              <UxPanelToolbar aria-label="编辑器工具栏">
                <template #lead>
                  <UxSegmented v-model="editorView" size="sm" aria-label="视图切换" :options="viewOptions" />
                </template>
                <template #monitor>
                  <UxTooltip content="刷新预览">
                    <UxButton size="sm" variant="ghost" icon="act-retry" label="刷新" />
                  </UxTooltip>
                  <UxChip tone="success" dot>已连接</UxChip>
                </template>
                <template #actions>
                  <UxButton size="sm" variant="ghost" icon="act-plus" @click="openEditorTab">
                    {{ t('shell.tabs.newAction') }}
                  </UxButton>
                  <UxButton size="sm" variant="ghost" icon="act-settings" @click="dock.toggle('settings')">
                    {{ t('shell.activity.settings') }}
                  </UxButton>
                </template>
              </UxPanelToolbar>
              <UxTabs
                :items="editor.tabs.value"
                :active-id="editor.activeId.value"
                :label="t('shell.tabs.label')"
                @select="editor.activate"
                @close="editor.close"
                @close-others="editor.closeOthers"
                @close-right="editor.closeRight"
                @close-left="editor.closeLeft"
                @close-all="editor.closeAll"
                @reorder="(fromId, toIndex) => editor.move(fromId, toIndex)"
              >
                <template #actions>
                  <UxTabList
                    :items="editor.tabs.value"
                    :active-id="editor.activeId.value"
                    @select="editor.activate"
                    @close="editor.close"
                  />
                  <UxSegmented v-model="splitMode" size="sm" aria-label="分屏" :options="splitOptions" />
                </template>
              </UxTabs>
              <div class="sl-editor__body">
                <UxSplitPane
                  v-if="splitOn"
                  v-model:ratio="splitRatio"
                  :orientation="splitOrientation"
                  :label="t('shell.splitPane.label')"
                >
                  <template #first>
                    <div class="sl-pane">{{ activeTitle }}</div>
                  </template>
                  <template #second>
                    <div class="sl-pane sl-pane--alt">{{ t('shell.splitPane.second') }}</div>
                  </template>
                </UxSplitPane>
                <div v-else class="sl-pane">{{ activeTitle }}</div>
              </div>
              <div class="sl-editor__bar">
                <UxButton size="sm" variant="ghost" icon="act-plus" @click="openEditorTab">
                  {{ t('shell.tabs.newAction') }}
                </UxButton>
                <UxButton size="sm" variant="ghost" icon="act-retry" @click="dock.reset()">
                  {{ t('shell.resetLayout') }}
                </UxButton>
                <UxButton
                  size="sm"
                  variant="ghost"
                  icon="act-float"
                  :disabled="!activeId"
                  @click="activeId && dock.float(activeId)"
                >
                  {{ t('shell.floatActive') }}
                </UxButton>
              </div>
            </div>
          </template>

        </UxDockWorkbench>

        <template #statusbar>
          <UxStatusBar>
            <span class="sl-status">
              <UxIcon name="st-success" /> {{ t('shell.statusReady') }}
            </span>
            <span class="sl-status">
              {{ t('shell.activePanel') }}: {{ activeId ? titleOf(activeId) : '—' }}
            </span>
            <template #right>
              <span>{{ t('shell.leftWidth') }} {{ dock.sizes.left }}px</span>
              <span>{{ t('shell.bottomHeight') }} {{ dock.sizes.bottom }}px</span>
              <span>{{ t('shell.floating') }} {{ floatCount }}</span>
              <span>{{ t('shell.tabs.count') }} {{ tabCount }}</span>
            </template>
          </UxStatusBar>
        </template>
      </UxAppShell>
    </div>

    <div class="sl-intro">
      <h2>{{ t('shell.intro.title') }}</h2>
      <p class="pg-note">{{ t('shell.intro.hint') }}</p>
      <div class="sl-cmps">
        <article v-for="item in introItems" :key="item.name" class="sl-cmp">
          <h3>{{ item.name }}</h3>
          <div v-if="item.marks.length" class="sl-marks">
            <code v-for="mark in item.marks" :key="mark">{{ mark }}</code>
          </div>
          <p class="sl-cmp__desc">{{ t(item.descKey) }}</p>
          <p class="sl-cmp__api"><span class="sl-cmp__api-tag">API</span>{{ item.api }}</p>
        </article>
      </div>
    </div>

    <TourGuide ref="tourRef" :auto="false" :steps="shellTourSteps" :label="t('shell.tour.label')" />
  </section>
</template>

<style scoped>
.sl {
  display: grid;
  gap: var(--ux-sp-3);
}

.sl h2 {
  margin: 0;
  font-size: var(--ux-fs-xl);
  font-weight: var(--ux-fw-semibold);
}

.sl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ux-sp-3);
}

.pg-note {
  margin: 0;
  color: var(--ux-fg-muted);
  font-size: var(--ux-fs-md);
}

.sl-frame {
  height: 560px;
  overflow: hidden;
  border: 1px solid var(--ux-border);
  border-radius: var(--ux-radius-lg);
}

.sl-frame :deep(.ux-appshell) {
  height: 100%;
}

.sl-brand {
  font-size: var(--ux-fs-md);
  font-weight: var(--ux-fw-semibold);
  color: var(--ux-fg);
}

.sl-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.sl-editor__body {
  flex: 1;
  min-height: 0;
}

.sl-pane {
  display: grid;
  place-items: center;
  height: 100%;
  padding: var(--ux-sp-4);
  font-size: var(--ux-fs-display);
  font-weight: var(--ux-fw-semibold);
  color: var(--ux-fg-muted);
  background: var(--ux-bg);
}

.sl-pane--alt {
  background: var(--ux-bg-sunken);
}

.sl-editor__bar {
  display: flex;
  gap: var(--ux-sp-2);
  padding: var(--ux-sp-2) var(--ux-sp-3);
  border-top: 1px solid var(--ux-border);
  background: var(--ux-bg-panel);
}

.sl-status {
  display: inline-flex;
  align-items: center;
  gap: var(--ux-sp-1);
}

.sl-intro {
  margin-top: var(--ux-sp-4);
  display: grid;
  gap: var(--ux-sp-3);
}

.sl-intro h2 {
  margin: 0;
  font-size: var(--ux-fs-xl);
  font-weight: var(--ux-fw-semibold);
}

.sl-cmps {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--ux-sp-3);
}

.sl-cmp {
  display: grid;
  gap: var(--ux-sp-2);
  align-content: start;
  padding: var(--ux-sp-3);
  background: var(--ux-bg-panel);
  border: 1px solid var(--ux-border);
  border-radius: var(--ux-radius-lg);
}

.sl-cmp h3 {
  margin: 0;
  font-size: var(--ux-fs-lg);
  font-weight: var(--ux-fw-semibold);
}

.sl-marks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ux-sp-1);
}

.sl-marks code {
  padding: var(--ux-sp-1) var(--ux-sp-2);
  font-family: var(--ux-font-family-mono);
  font-size: var(--ux-fs-sm);
  color: var(--ux-fg-muted);
  background: var(--ux-bg-sunken);
  border-radius: var(--ux-radius-sm);
}

.sl-cmp__desc {
  margin: 0;
  color: var(--ux-fg-muted);
  font-size: var(--ux-fs-md);
}

.sl-cmp__api {
  margin: 0;
  display: flex;
  gap: var(--ux-sp-2);
  color: var(--ux-fg-subtle);
  font-family: var(--ux-font-family-mono);
  font-size: var(--ux-fs-sm);
  word-break: break-word;
}

.sl-cmp__api-tag {
  flex: none;
  color: var(--ux-accent);
}
</style>
