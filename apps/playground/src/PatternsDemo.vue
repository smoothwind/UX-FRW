<script setup lang="ts">
import { computed, ref } from 'vue'
import { UxButton, UxInput, notify, openContextMenuAt } from '@ux/components'
import { useActivityLog, type LogLevel } from '@ux/composables'
import { useI18n } from '@ux/services'
import {
  EmptyState,
  ErrorState,
  LogPanel,
  SettingsShell,
  TourGuide,
  UxDataTable,
  type DataTableColumn,
  type SettingsCategory,
} from '@ux/patterns'

const { t } = useI18n()

/* ---------- EmptyState ---------- */
/* ---------- ErrorState ---------- */
const errorMode = ref<'none' | 'normal' | 'conn'>('none')
const sqlError = "SQLSyntaxErrorException: You have an error in your SQL syntax near 'FORM users' at line 1"
const connError = 'ECONNRESET: Connection closed by peer (broken pipe)'

function retry(): void {
  notify({ type: 'info', message: t('patterns.demo.retried') })
}

function reconnect(): void {
  notify({ type: 'success', message: t('patterns.demo.reconnected') })
}

function openLog(): void {
  notify({ type: 'info', message: t('patterns.demo.logOpened') })
}

/* ---------- SettingsShell ---------- */
const settingsCats = computed<SettingsCategory[]>(() => [
  { id: 'appearance', label: t('patterns.demo.catAppearance'), icon: 'act-theme-light' },
  { id: 'editor', label: t('patterns.demo.catEditor'), icon: 'act-edit' },
  { id: 'about', label: t('patterns.demo.catAbout'), icon: 'st-info' },
])
const settingsActive = ref('appearance')
const demoName = ref('UxKit')

/* ---------- UxDataTable（10 万行） ---------- */
const dtColumns: DataTableColumn[] = [
  { name: '#', width: 80, align: 'right' },
  { name: 'user', width: 160 },
  { name: 'role', width: 120, align: 'center' },
  { name: 'score', width: 110, align: 'right' },
  { name: 'created', width: 180 },
]

const bigRows: unknown[][] = (() => {
  const roles = ['admin', 'editor', 'viewer']
  const rows: unknown[][] = []
  for (let i = 0; i < 100000; i++) {
    rows.push([
      i + 1,
      i % 20 === 0 ? null : `user-${String(i).padStart(5, '0')}`,
      roles[i % 3],
      i % 7 === 0 ? null : Math.round(Math.random() * 100000) / 10,
      new Date(1700000000000 - i * 60000).toISOString().slice(0, 19).replace('T', ' '),
    ])
  }
  return rows
})()

function onCellContext(payload: { row: number; col: number; value: unknown; x: number; y: number }): void {
  openContextMenuAt(payload.x, payload.y, [
    {
      id: 'copy-cell',
      label: t('patterns.dt.copyCell'),
      run: () => {
        void navigator.clipboard
          .writeText(payload.value === null || payload.value === undefined ? '' : String(payload.value))
          .then(() => notify({ type: 'success', message: t('patterns.dt.copied') }))
      },
    },
    {
      id: 'copy-row',
      label: t('patterns.dt.copyRow'),
      run: () => {
        void navigator.clipboard
          .writeText(JSON.stringify(bigRows[payload.row]))
          .then(() => notify({ type: 'success', message: t('patterns.dt.copied') }))
      },
    },
  ])
}

function onRowCopy(row: number): void {
  void navigator.clipboard
    .writeText(JSON.stringify(bigRows[row]))
    .then(() => notify({ type: 'success', message: t('patterns.dt.rowCopied') }))
}

/* ---------- TourGuide ---------- */
const tourRef = ref<InstanceType<typeof TourGuide> | null>(null)

const tourSteps = computed(() => [
  {
    title: t('patterns.tour.s1Title'),
    desc: t('patterns.tour.s1Desc'),
  },
  {
    target: '[data-ux="data-table"]',
    title: t('patterns.tour.s2Title'),
    desc: t('patterns.tour.s2Desc'),
  },
  {
    target: '[data-ux="settings"]',
    title: t('patterns.tour.s3Title'),
    desc: t('patterns.tour.s3Desc'),
  },
  {
    title: t('patterns.tour.s4Title'),
    desc: t('patterns.tour.s4Desc'),
  },
])

function startTour(): void {
  tourRef.value?.start()
}

/* ---------- LogPanel ---------- */
const log = useActivityLog({ limit: 500 })
log.push('info', '连接已建立 · MySQL@demo', 'host=127.0.0.1 port=3306\nuser=root\ncharset=utf8mb4')
log.push('warn', '分页续拉失败，已停止（第 3 页）')
log.push('error', "SQL 执行失败：near 'FORM users' at line 1", "SQLSyntaxErrorException: You have an error in your SQL syntax; check the manual\nnear 'FORM users' at line 1")

const logSamples: Array<[LogLevel, string, string?]> = [
  ['info', '执行成功 · 12 行 · 34ms'],
  ['info', '执行成功 · 1 行 · 8ms'],
  ['warn', '慢查询：耗时 1.24s'],
  ['error', 'SQL 执行失败：Duplicate entry', 'IntegrityError: Duplicate entry "42" for key "PRIMARY"'],
  ['error', '连接中断：ECONNRESET', 'ECONNRESET: Connection closed by peer (broken pipe)'],
]
let logSeq = 0

function pushSample(): void {
  const [lv, title, detail] = logSamples[logSeq++ % logSamples.length]
  log.push(lv, title, detail)
}
</script>

<template>
  <div class="pt">
    <h2>{{ t('patterns.demoTitle') }}</h2>

    <section class="pg-card">
      <h3>EmptyState</h3>
      <div class="pt-stage pt-stage--sm">
        <EmptyState
          icon="obj-database"
          :title="t('patterns.demo.emptyTitle')"
          :hint="t('patterns.demo.emptyHint')"
        >
          <template #action>
            <UxButton size="sm" variant="primary" @click="notify({ type: 'info', message: t('patterns.demo.emptyActionMsg') })">
              {{ t('patterns.demo.emptyAction') }}
            </UxButton>
          </template>
        </EmptyState>
      </div>
    </section>

    <section class="pg-card">
      <h3>ErrorState</h3>
      <div class="pt-row">
        <UxButton size="sm" :variant="errorMode === 'normal' ? 'primary' : 'secondary'" @click="errorMode = 'normal'">
          {{ t('patterns.demo.showSql') }}
        </UxButton>
        <UxButton size="sm" :variant="errorMode === 'conn' ? 'primary' : 'secondary'" @click="errorMode = 'conn'">
          {{ t('patterns.demo.showConn') }}
        </UxButton>
      </div>
      <div class="pt-stage pt-stage--sm">
        <ErrorState
          v-if="errorMode === 'normal'"
          :error="sqlError"
          :on-retry="retry"
          :on-open-log="openLog"
        />
        <ErrorState
          v-else-if="errorMode === 'conn'"
          :error="connError"
          summary="无法连接到 MySQL@demo：服务未启动或网络不可达，请检查后重连。"
          :on-reconnect="reconnect"
          :on-open-log="openLog"
        />
        <p v-else class="pg-note">{{ t('patterns.demo.errorIdle') }}</p>
      </div>
    </section>

    <section class="pg-card">
      <h3>SettingsShell</h3>
      <div class="pt-stage pt-stage--md">
        <SettingsShell
          :categories="settingsCats"
          :active-id="settingsActive"
          :label="t('patterns.demo.settingsLabel')"
          @select="settingsActive = $event"
        >
          <template #default="{ activeId }">
            <div v-if="activeId === 'appearance'" class="pt-form">
              <UxInput v-model="demoName" :label="t('patterns.demo.nameLabel')" />
            </div>
            <p v-else-if="activeId === 'editor'" class="pg-note">{{ t('patterns.demo.editorPanel') }}</p>
            <p v-else class="pg-note">UxKit {{ t('patterns.demoTitle') }}</p>
          </template>
        </SettingsShell>
      </div>
    </section>

    <section class="pg-card">
      <h3>UxDataTable</h3>
      <p class="pg-note">{{ t('patterns.dt.hint') }}</p>
      <div class="pt-stage pt-stage--tall">
        <UxDataTable
          :columns="dtColumns"
          :rows="bigRows"
          :label="t('patterns.dt.label')"
          @cell-context="onCellContext"
          @row-copy="onRowCopy"
        />
      </div>
    </section>

    <section class="pg-card">
      <h3>LogPanel（活动日志 / 级别过滤 / 未读错误 / 自动滚动）</h3>
      <div class="pt-row">
        <UxButton size="sm" @click="pushSample">产生一条日志</UxButton>
      </div>
      <div class="pt-stage pt-stage--md">
        <LogPanel :log="log" label="活动日志" />
      </div>
    </section>

    <section class="pg-card">
      <h3>TourGuide</h3>
      <p class="pg-note">{{ t('patterns.tour.hint') }}</p>
      <UxButton size="sm" variant="primary" icon="act-external-link" @click="startTour">
        {{ t('patterns.tour.start') }}
      </UxButton>
    </section>

    <TourGuide ref="tourRef" :steps="tourSteps" storage-key="uxkit.playground.tour" />
  </div>
</template>

<style scoped>
.pt {
  display: grid;
  gap: var(--ux-sp-4);
}

.pt h2 {
  margin: 0;
  font-size: var(--ux-fs-xl);
  font-weight: var(--ux-fw-semibold);
}

.pg-card h3 {
  margin: 0 0 var(--ux-sp-2);
  font-size: var(--ux-fs-lg);
  font-weight: var(--ux-fw-semibold);
}

.pt-row {
  display: flex;
  gap: var(--ux-sp-2);
  margin-bottom: var(--ux-sp-2);
}

.pt-stage {
  border: 1px solid var(--ux-border);
  border-radius: var(--ux-radius-sm);
  overflow: hidden;
}

.pt-stage--sm {
  height: 220px;
}

.pt-stage--md {
  height: 300px;
}

.pt-stage--tall {
  height: 360px;
}

.pt-form {
  display: grid;
  gap: var(--ux-sp-3);
  max-width: 320px;
}

.pg-note {
  margin: 0 0 var(--ux-sp-2);
  color: var(--ux-fg-muted);
  font-size: var(--ux-fs-md);
}
</style>
