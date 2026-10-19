<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  UxBadge,
  UxButton,
  UxChip,
  UxDialog,
  UxIcon,
  UxInput,
  UxKbd,
  UxMenuBar,
  UxSegmented,
  UxTooltip,
  UxTree,
  iconIds,
  iconRegistry,
  notify,
  notifyOnce,
  openContextMenu,
  openContextMenuAt,
  type MenuBarItem,
  type MenuItem,
  type SegmentedOption,
  type TreeNodeData,
} from '@ux/components'

const name = ref('')
const dialogOpen = ref(false)

const wrapText = ref(true)
const showGrid = ref(false)
const themeMode = ref<'light' | 'dark'>('light')

const segTheme = ref('light')
const segAlign = ref('left')
const segThemeOptions: SegmentedOption[] = [
  { value: 'light', label: '浅色', icon: 'act-theme-light' },
  { value: 'dark', label: '深色', icon: 'act-theme-dark' },
]
const segAlignOptions: SegmentedOption[] = [
  { value: 'left', label: '左' },
  { value: 'center', label: '中' },
  { value: 'right', label: '右' },
  { value: 'justify', label: '两端', disabled: true },
]

const treeSelected = ref<string | null>(null)
const treeExpanded = ref<string[]>(['n-db', 'n-tables'])
const treeFilter = ref('')
const treeItems = ref<TreeNodeData[]>([
  {
    id: 'n-db',
    label: 'demo@localhost',
    icon: 'obj-database',
    badge: 2,
    children: [
      {
        id: 'n-tables',
        label: '表',
        icon: 'obj-folder',
        children: [
          { id: 'n-users', label: 'users', icon: 'obj-table', leaf: true },
          { id: 'n-orders', label: 'orders', icon: 'obj-table', leaf: true },
          { id: 'n-logs', label: 'op_logs', icon: 'obj-table', leaf: true, status: 'lost' },
        ],
      },
      { id: 'n-views', label: '视图', icon: 'obj-folder', children: [] },
      { id: 'n-remote', label: '远程 Schema', icon: 'obj-folder-tree' },
      { id: 'n-locked', label: '只读副本（禁拖入）', icon: 'obj-key' },
    ],
  },
  { id: 'n-trash', label: '回收站', icon: 'obj-file', leaf: true, disabled: true },
])

function treeLazyLoad(node: TreeNodeData): Promise<TreeNodeData[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        node.id === 'n-remote'
          ? [
              { id: 'n-remote-t1', label: 'remote_orders', icon: 'obj-table', leaf: true },
              { id: 'n-remote-t2', label: 'remote_users', icon: 'obj-table', leaf: true },
            ]
          : [],
      )
    }, 600)
  })
}

function treeCanDrop(_dragId: string, targetId: string): boolean {
  return targetId !== 'n-locked'
}

function onTreeContext(payload: { node: TreeNodeData; x: number; y: number }): void {
  openContextMenuAt(payload.x, payload.y, [
    { type: 'label', label: payload.node.label },
    { id: 'tree.refresh', label: '刷新', icon: 'act-retry', run: () => notify(`已刷新 ${payload.node.label}`) },
    { id: 'tree.drop', label: '删除节点', icon: 'act-delete', danger: true, run: () => notify({ type: 'warning', message: '演示环境不执行删除' }) },
  ])
}

function treeMove(payload: { dragId: string; targetId: string; position: string }): void {
  const { dragId, targetId, position } = payload
  let dragged: TreeNodeData | undefined
  const remove = (nodes: TreeNodeData[]): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === dragId) {
        dragged = nodes.splice(i, 1)[0]
        return true
      }
      if (nodes[i].children && remove(nodes[i].children!)) return true
    }
    return false
  }
  if (!remove(treeItems.value) || !dragged) return
  const insert = (nodes: TreeNodeData[]): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === targetId) {
        if (position === 'inside') {
          const target = nodes[i]
          target.children = target.children ?? []
          target.children.push(dragged!)
          treeExpanded.value = [...new Set([...treeExpanded.value, target.id])]
        } else {
          nodes.splice(position === 'before' ? i : i + 1, 0, dragged!)
        }
        return true
      }
      if (nodes[i].children && insert(nodes[i].children!)) return true
    }
    return false
  }
  insert(treeItems.value)
}

const ctxItems = computed<MenuItem[]>(() => [
  { type: 'label', label: '编辑' },
  { id: 'copy', label: '复制', icon: 'act-copy', shortcut: 'Ctrl+C', run: () => notify('已复制') }, // shortcut-exempt 菜单展示用，不参与全局注册
  { id: 'edit', label: '编辑', icon: 'act-edit', run: () => notify('编辑') },
  { id: 'save', label: '保存', icon: 'act-save', shortcut: 'Ctrl+S', run: () => notify({ type: 'success', message: '已保存' }) },
  { type: 'separator' },
  { type: 'label', label: '视图' },
  { id: 'wrap', type: 'checkbox', label: '自动换行', checked: wrapText.value, run: () => { wrapText.value = !wrapText.value } },
  { id: 'grid', type: 'checkbox', label: '显示网格', checked: showGrid.value, run: () => { showGrid.value = !showGrid.value } },
  {
    id: 'theme',
    type: 'submenu',
    label: '主题',
    icon: 'act-theme-light',
    items: [
      { id: 't-light', type: 'radio', group: 'theme', label: '浅色', icon: 'act-theme-light', checked: themeMode.value === 'light', run: () => { themeMode.value = 'light' } },
      { id: 't-dark', type: 'radio', group: 'theme', label: '深色', icon: 'act-theme-dark', checked: themeMode.value === 'dark', run: () => { themeMode.value = 'dark' } },
    ],
  },
  {
    id: 'more',
    type: 'submenu',
    label: '更多操作',
    items: [
      { id: 'm-search', label: '在文件夹中查找', icon: 'act-search', run: () => notify('查找') },
      { id: 'm-open', label: '在外部打开', icon: 'act-external-link', run: () => notify('已打开') },
    ],
  },
  { type: 'separator' },
  { id: 'disabled', label: '不可用项', icon: 'act-search', disabled: true, run: () => {} },
  { id: 'delete', label: '删除', icon: 'act-delete', danger: true, run: () => notify({ type: 'danger', message: '已删除', action: { label: '撤销', run: () => notify('已撤销') } }) },
])

const menubarItems: MenuBarItem[] = [
  {
    id: 'file',
    label: '文件',
    items: [
      { id: 'new', label: '新建', icon: 'act-plus', run: () => notify('新建') },
      { id: 'open', label: '打开…', icon: 'obj-folder', run: () => notify('打开') },
      { type: 'separator' },
      { id: 'save', label: '保存', icon: 'act-save', run: () => notify({ type: 'success', message: '已保存' }) },
      {
        id: 'export',
        label: '导出',
        icon: 'act-external-link',
        items: [
          { id: 'csv', label: '导出 CSV', run: () => notify('导出 CSV') },
          { id: 'sql', label: '导出 SQL', run: () => notify('导出 SQL') },
        ],
      },
    ],
  },
  {
    id: 'edit',
    label: '编辑',
    items: [
      { id: 'undo', label: '撤销', icon: 'act-retry', run: () => notify('撤销') },
      { id: 'redo', label: '重做', run: () => notify('重做') },
      { type: 'separator' },
      { id: 'cut', label: '剪切', disabled: true, run: () => {} },
      { id: 'copy', label: '复制', icon: 'act-copy', run: () => notify('复制') },
      { id: 'paste', label: '粘贴', disabled: true, run: () => {} },
    ],
  },
  {
    id: 'view',
    label: '视图',
    items: [
      { id: 'wrap', type: 'checkbox', label: '自动换行', checked: true, run: () => {} },
      { id: 'grid', type: 'checkbox', label: '显示网格', checked: false, run: () => {} },
      { type: 'separator' },
      {
        id: 'theme',
        type: 'submenu',
        label: '主题',
        icon: 'act-theme-light',
        items: [
          { id: 'tl', type: 'radio', group: 'th', label: '浅色', icon: 'act-theme-light', checked: true, run: () => {} },
          { id: 'td', type: 'radio', group: 'th', label: '深色', icon: 'act-theme-dark', checked: false, run: () => {} },
        ],
      },
    ],
  },
  { id: 'help', label: '帮助', run: () => notify('帮助') },
]

function openMenu(e: MouseEvent): void {
  // getter 形式：复选/单选勾选随状态实时刷新
  openContextMenu(e, () => ctxItems.value)
}

function fakeError(): void {
  notifyOnce('demo-error', { type: 'danger', message: '连接失败：超时', action: { label: '重试', run: () => notify('重试中…') } })
}
</script>

<template>
  <div class="cd">
    <section class="pg-card">
      <h2>UxButton</h2>
      <div class="row">
        <UxButton variant="primary">主要</UxButton>
        <UxButton variant="secondary">次要</UxButton>
        <UxButton variant="ghost">幽灵</UxButton>
        <UxButton variant="danger">危险</UxButton>
        <UxButton variant="secondary" disabled>禁用</UxButton>
        <UxButton variant="primary" loading>加载中</UxButton>
      </div>
      <div class="row">
        <UxButton size="sm">小</UxButton>
        <UxButton size="md">中</UxButton>
        <UxButton size="lg">大</UxButton>
        <UxButton icon="act-plus">带图标</UxButton>
        <UxButton icon="act-settings" label="设置" />
        <UxButton icon="act-delete" label="删除" variant="ghost" />
      </div>
    </section>

    <section class="pg-card">
      <h2>UxInput</h2>
      <div class="grid-2">
        <UxInput v-model="name" label="名称" placeholder="请输入名称" hint="支持任意文本" />
        <UxInput v-model="name" label="校验失败" error="名称不能为空" />
        <UxInput v-model="name" label="禁用" disabled />
        <UxInput v-model="name" label="密码" type="password" placeholder="••••••" />
      </div>
    </section>

    <section class="pg-card">
      <h2>UxKbd</h2>
      <div class="row">
        <UxKbd keys="Ctrl" /> <UxKbd keys="K" />
        <UxKbd keys="Ctrl+Shift+T" />
        <UxKbd keys="Esc" />
      </div>
    </section>

    <section class="pg-card">
      <h2>UxSegmented（分段控件 / role=radiogroup）</h2>
      <div class="row">
        <UxSegmented v-model="segTheme" aria-label="主题" :options="segThemeOptions" />
        <UxSegmented v-model="segAlign" size="sm" aria-label="对齐" :options="segAlignOptions" />
        <UxSegmented v-model="segAlign" disabled aria-label="禁用" :options="segAlignOptions" />
      </div>
      <p class="pg-note">单选分段：←→/↑↓/Home/End 键盘切换 + roving tabindex；选中=主色淡底；禁用项跳过。</p>
    </section>

    <section class="pg-card">
      <h2>UxTree（树形控件 / role=tree）</h2>
      <div class="grid-2">
        <UxTree
          v-model="treeSelected"
          v-model:expanded="treeExpanded"
          :items="treeItems"
          :filter="treeFilter"
          :lazy-load="treeLazyLoad"
          :can-drop="treeCanDrop"
          aria-label="数据库对象树"
          @node-contextmenu="onTreeContext"
          @node-move="treeMove"
        />
        <div>
          <UxInput v-model="treeFilter" label="搜索过滤" placeholder="输入关键字，命中保留祖先链" />
          <p class="pg-note">↑↓/←→/Home/End/Enter/首字母 键盘（APG Tree）· 懒加载（展开「远程 Schema」）· 搜索过滤 · 右键菜单 · 拖拽（防守式校验：禁拖入「只读副本」，禁拖入自身子树）。</p>
        </div>
      </div>
    </section>

    <section class="pg-card">
      <h2>UxTooltip / UxBadge / UxChip</h2>
      <div class="row">
        <UxTooltip content="保存（Ctrl+S）"><UxButton icon="act-save" label="保存" /></UxTooltip>
        <UxTooltip content="删除（不可撤销）" placement="bottom">
          <UxButton icon="act-delete" variant="ghost" label="删除" />
        </UxTooltip>
        <UxBadge :count="12"><UxButton icon="act-settings" label="设置" /></UxBadge>
        <UxBadge :count="128" tone="danger" label="128 条未读错误">
          <UxButton icon="st-warning" variant="ghost" label="日志" />
        </UxBadge>
      </div>
      <div class="row">
        <UxChip tone="success" dot>已连接</UxChip>
        <UxChip tone="neutral" dot>未连接</UxChip>
        <UxChip tone="warning">3 条告警</UxChip>
        <UxChip tone="accent">MySQL 8.0</UxChip>
        <UxBadge :count="5" tone="accent" />
        <UxBadge dot tone="success" />
      </div>
      <p class="pg-note">Tooltip：hover 120ms 延迟 + 焦点即显 + Esc 关闭 + 视口翻转；Badge：计数/圆点（有插槽=角标）；Chip：状态胶囊（成功/中性/告警/身份）。</p>
    </section>

    <section class="pg-card">
      <h2>UxDialog（focus trap / Esc / 遮罩点击）</h2>
      <div class="row">
        <UxButton variant="primary" @click="dialogOpen = true">打开对话框</UxButton>
      </div>
      <p class="pg-note">Tab 循环约束在对话框内；Esc 或点击遮罩关闭；关闭后焦点归还到打开按钮。</p>
      <UxDialog v-model:open="dialogOpen" title="示例对话框">
        <p class="dialog-text">对话框内容区。按 Tab 验证焦点陷阱，按 Esc 关闭。</p>
        <template #footer>
          <UxButton variant="ghost" @click="dialogOpen = false">取消</UxButton>
          <UxButton variant="primary" @click="dialogOpen = false">确定</UxButton>
        </template>
      </UxDialog>
    </section>

    <section class="pg-card">
      <h2>UxContextMenu（防溢出 / 键盘导航 / 全类型项）</h2>
      <div class="row">
        <div class="ctx-zone" @contextmenu.prevent="openMenu">在此区域右键</div>
      </div>
      <p class="pg-note">
        ↑↓ / ←→（子菜单）/ Home / End / Enter / Space / Esc / 首字母跳转；含图标、快捷键、分组标题、复选、单选、子菜单（←→ 展开）、禁用态、危险项、分隔线。
      </p>
    </section>

    <section class="pg-card">
      <h2>UxMenuBar（role=menubar / ←→ 切换顶级项）</h2>
      <div class="row">
        <UxMenuBar :items="menubarItems" aria-label="演示菜单栏" />
      </div>
      <p class="pg-note">
        工具菜单栏：←→ 切换顶级菜单、↓/Enter/Space 展开、Home/End 首末、A–Z 首字母；子菜单支持复选/单选与二级菜单；Esc 关闭并归还焦点。
      </p>
    </section>

    <section class="pg-card">
      <h2>UxToast（aria-live / notifyOnce 去重）</h2>
      <div class="row">
        <UxButton @click="notify({ type: 'info', message: '这是一条信息' })">info</UxButton>
        <UxButton @click="notify({ type: 'success', message: '操作成功' })">success</UxButton>
        <UxButton @click="notify({ type: 'warning', message: '注意风险' })">warning</UxButton>
        <UxButton @click="notify({ type: 'danger', message: '操作失败' })">danger</UxButton>
        <UxButton @click="fakeError">notifyOnce（5 秒窗口内仅一次）</UxButton>
      </div>
    </section>

    <section class="pg-card">
      <h2>UxIcon 语义注册表（{{ iconIds.length }} 个）</h2>
      <p class="pg-note">iconId ↔ 语义一对一，形状/语义均唯一（check-icons 校验，红线 13/14）。</p>
      <div class="icon-grid">
        <div v-for="id in iconIds" :key="id" class="icon-cell">
          <UxIcon :name="id" />
          <code>{{ id }}</code>
          <span>{{ iconRegistry[id].semantic }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cd {
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
  margin: var(--ux-sp-2) 0 0;
  color: var(--ux-fg-muted);
  font-size: var(--ux-fs-md);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ux-sp-2);
  margin-bottom: var(--ux-sp-2);
}

.row:last-child {
  margin-bottom: 0;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--ux-sp-3);
}

.dialog-text {
  margin: 0;
  color: var(--ux-fg-muted);
}

.ctx-zone {
  display: grid;
  place-items: center;
  width: 100%;
  height: 96px;
  color: var(--ux-fg-muted);
  background: var(--ux-bg-sunken);
  border: 1px dashed var(--ux-border-strong);
  border-radius: var(--ux-radius);
  font-size: var(--ux-fs-md);
  user-select: none;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--ux-sp-2);
}

.icon-cell {
  display: flex;
  align-items: center;
  gap: var(--ux-sp-2);
  padding: var(--ux-sp-2);
  background: var(--ux-bg);
  border: 1px solid var(--ux-border);
  border-radius: var(--ux-radius-sm);
  font-size: var(--ux-fs-lg);
}

.icon-cell code {
  font-size: var(--ux-fs-sm);
  color: var(--ux-fg-muted);
}

.icon-cell span {
  margin-left: auto;
  font-size: var(--ux-fs-sm);
  color: var(--ux-fg-subtle);
}
</style>
