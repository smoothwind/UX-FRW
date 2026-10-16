<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getToken, tokenNames } from '@ux/tokens'

const accentLive = ref('')

const surfaces = [
  { name: '--ux-bg', desc: '应用主表面' },
  { name: '--ux-bg-panel', desc: '侧栏/面板' },
  { name: '--ux-bg-sunken', desc: '凹陷区' },
  { name: '--ux-bg-overlay', desc: '浮层' },
]

const semantic = [
  { name: '--ux-accent', desc: '交互主色' },
  { name: '--ux-danger', desc: '危险' },
  { name: '--ux-success', desc: '成功' },
  { name: '--ux-warning', desc: '警告' },
  { name: '--ux-info', desc: '信息' },
]

const textLevels = [
  { name: '--ux-fg', desc: '主文本' },
  { name: '--ux-fg-muted', desc: '次级文本' },
  { name: '--ux-fg-subtle', desc: '弱文本' },
]

const fontSizes = ['xs', 'sm', 'md', 'lg', 'xl', 'display'] as const
const spacings = [1, 2, 3, 4, 5, 6] as const
const elevations = [1, 2, 3, 4] as const
const zLayers = ['local', 'dock', 'pop', 'top', 'modal', 'menu', 'dropdown', 'tour', 'toast'] as const
const zUsage: Record<(typeof zLayers)[number], string> = {
  local: '组件内部堆叠',
  dock: '停靠面板',
  pop: '普通浮层',
  top: '顶层浮层',
  modal: '模态对话框',
  menu: '菜单/右键菜单',
  dropdown: '下拉',
  tour: '漫游引导',
  toast: '通知',
}

const radii = computed(() => ({
  sm: 'var(--ux-radius-sm)',
  md: 'var(--ux-radius)',
  lg: 'var(--ux-radius-lg)',
}))

onMounted(() => {
  accentLive.value = getToken(tokenNames.color.accent)
})
</script>

<template>
  <div class="tp">
    <section class="pg-card">
      <h2>表面与语义色</h2>
      <div class="swatch-grid">
        <div v-for="s in surfaces" :key="s.name" class="swatch">
          <div class="swatch-chip" :style="{ background: `var(${s.name})` }"></div>
          <code>{{ s.name }}</code>
          <span>{{ s.desc }}</span>
        </div>
        <div v-for="s in semantic" :key="s.name" class="swatch">
          <div class="swatch-chip" :style="{ background: `var(${s.name})` }"></div>
          <code>{{ s.name }}</code>
          <span>{{ s.desc }}</span>
        </div>
        <div v-for="s in textLevels" :key="s.name" class="swatch">
          <div class="swatch-chip" :style="{ background: `var(${s.name})` }"></div>
          <code>{{ s.name }}</code>
          <span>{{ s.desc }}</span>
        </div>
      </div>
      <p class="pg-note">
        JS 运行时读取主色：<code>{{ accentLive || '—' }}</code>（getToken，随主题实时变化）
      </p>
    </section>

    <section class="pg-card">
      <h2>字号阶梯</h2>
      <div class="type-list">
        <p v-for="f in fontSizes" :key="f" :style="{ fontSize: `var(--ux-fs-${f})` }">
          <code>--ux-fs-{{ f }}</code> 桌面应用界面文字 Aa
        </p>
      </div>
    </section>

    <section class="pg-card">
      <h2>间距（4px 网格）</h2>
      <div class="space-list">
        <div v-for="n in spacings" :key="n" class="space-item">
          <div class="space-bar" :style="{ width: `var(--ux-sp-${n})` }"></div>
          <code>--ux-sp-{{ n }}</code>
        </div>
      </div>
    </section>

    <section class="pg-card">
      <h2>圆角与阴影</h2>
      <div class="radius-row">
        <div v-for="(v, k) in radii" :key="k" class="radius-box" :style="{ borderRadius: v }">
          <code>--ux-radius-{{ k }}</code>
        </div>
      </div>
      <div class="elev-row">
        <div
          v-for="n in elevations"
          :key="n"
          class="elev-box"
          :style="{ boxShadow: `var(--ux-elev-${n})` }"
        >
          <code>--ux-elev-{{ n }}</code>
        </div>
      </div>
    </section>

    <section class="pg-card">
      <h2>z-index 语义阶梯</h2>
      <table class="z-table">
        <thead>
          <tr><th>令牌</th><th>值</th><th>用途</th></tr>
        </thead>
        <tbody>
          <tr v-for="z in zLayers" :key="z">
            <td><code>--ux-z-{{ z }}</code></td>
            <td>{{ getToken(`--ux-z-${z}`) }}</td>
            <td>{{ zUsage[z] }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.tp {
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
  margin: 0 0 var(--ux-sp-3);
  font-size: var(--ux-fs-xl);
  font-weight: var(--ux-fw-semibold);
}

.pg-note {
  margin: var(--ux-sp-3) 0 0;
  color: var(--ux-fg-muted);
  font-size: var(--ux-fs-md);
}

.swatch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--ux-sp-3);
}

.swatch {
  display: grid;
  gap: var(--ux-sp-1);
  font-size: var(--ux-fs-sm);
}

.swatch code {
  color: var(--ux-fg-muted);
}

.swatch span {
  color: var(--ux-fg-subtle);
}

.swatch-chip {
  height: var(--ux-control-h-lg);
  border: 1px solid var(--ux-border);
  border-radius: var(--ux-radius-sm);
}

.type-list p {
  margin: 0 0 var(--ux-sp-2);
}

.type-list code {
  color: var(--ux-fg-muted);
  margin-right: var(--ux-sp-2);
}

.space-list {
  display: grid;
  gap: var(--ux-sp-2);
}

.space-item {
  display: flex;
  align-items: center;
  gap: var(--ux-sp-3);
}

.space-bar {
  height: var(--ux-sp-3);
  background: var(--ux-accent);
  border-radius: var(--ux-radius-sm);
}

.space-item code {
  font-size: var(--ux-fs-sm);
  color: var(--ux-fg-muted);
}

.radius-row {
  display: flex;
  gap: var(--ux-sp-3);
  margin-bottom: var(--ux-sp-3);
}

.radius-box {
  width: 96px;
  height: 64px;
  display: grid;
  place-items: center;
  background: var(--ux-bg-sunken);
  border: 1px solid var(--ux-border);
  font-size: var(--ux-fs-sm);
}

.elev-row {
  display: flex;
  gap: var(--ux-sp-4);
}

.elev-box {
  width: 96px;
  height: 64px;
  display: grid;
  place-items: center;
  background: var(--ux-bg-overlay);
  border-radius: var(--ux-radius);
  font-size: var(--ux-fs-sm);
  color: var(--ux-fg-muted);
}

.z-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--ux-fs-lg);
}

.z-table th,
.z-table td {
  text-align: left;
  padding: var(--ux-sp-2);
  border-bottom: 1px solid var(--ux-border);
}

.z-table th {
  color: var(--ux-fg-muted);
  font-weight: var(--ux-fw-medium);
}

.z-table code {
  color: var(--ux-fg-muted);
}
</style>
