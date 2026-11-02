<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { UxIcon, type IconId } from '@ux/components'
import { getPlatformAdapter } from '@ux/services'

const props = withDefaults(
  defineProps<{
    /** 是否展示（v-model）：父组件在收到 done 后置回 false 卸载 */
    open: boolean
    title?: string
    subtitle?: string
    icon?: IconId
    /** 最短展示时长（ms）：默认 1000 = 聚点 360 + 旋转成形 400 + 内容落位 240 */
    minDuration?: number
    /** 等待宿主就绪：内容落位后亮点停在轮廓角旋转示意，等 finish() 再收场 */
    waiting?: boolean
    /** 无障碍名称 */
    label?: string
    /** window=居中窗体 + 环境渐变底；cover=整屏填充 */
    mode?: 'cover' | 'window'
    /** 窗体尺寸（SVG viewBox 逻辑单位） */
    width?: number
    height?: number
  }>(),
  { minDuration: 1000, waiting: false, mode: 'window', width: 360, height: 220 },
)

const emit = defineEmits<{ done: []; skip: [] }>()

type Phase = 'idle' | 'dot' | 'expand' | 'settle' | 'leaving' | 'gone'
const phase = ref<Phase>('idle')
const rectRef = ref<SVGRectElement | null>(null)
const dot = reactive({ x: 0, y: 0, o: 0 })

const cx = computed(() => props.width / 2)
const cy = computed(() => props.height / 2)
const radius = 12
/** 阶段时长（ms），总长 1000 与 minDuration 默认值对齐 */
const D = { dot: 360, expand: 400, settle: 240 }
const EXPAND_ENTER = 0.14 // 旋转段开头：亮点从中心飞到轮廓起点的比例
const LEAVE_MS = 240

let introRaf = 0
let introOrigin = -1 // 首帧 rAF 时间戳作为动画原点（与 rAF 同一时钟）
let introDone = false
let finished = false
let waitingLoopRaf = 0
let leaveTimer: number | undefined
let onKey: ((e: KeyboardEvent) => void) | undefined
const reduced = ref(false)

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeOutStrong(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}
function totalLen(): number {
  const r = rectRef.value
  if (!r || typeof r.getTotalLength !== 'function') return 0
  return r.getTotalLength()
}
function pointAt(len: number): { x: number; y: number } {
  const p = rectRef.value?.getPointAtLength?.(len)
  return p ? { x: p.x, y: p.y } : { x: cx.value, y: cy.value }
}
function setDrawn(drawn: number): void {
  const r = rectRef.value
  if (!r) return
  const len = totalLen()
  r.style.strokeDasharray = `${len}`
  r.style.strokeDashoffset = `${Math.max(0, len - drawn)}`
}

function reset(): void {
  cancelAnimationFrame(introRaf)
  cancelAnimationFrame(waitingLoopRaf)
  window.clearTimeout(leaveTimer)
  introDone = false
  finished = false
  dot.o = 0
  phase.value = 'idle'
}

function startIntro(): void {
  phase.value = 'dot'
  const r = rectRef.value
  if (r) {
    const len = r.getTotalLength()
    r.style.strokeDasharray = `${len}`
    r.style.strokeDashoffset = `${len}`
  }
  introOrigin = -1
  const tick = (frame: number): void => {
    if (introOrigin < 0) introOrigin = frame
    const t = frame - introOrigin
    if (t >= 1000) {
      introDone = true
      phase.value = 'settle' // 长帧掉帧/直接跳段时也要落位
      onIntroEnd()
      return
    }
    if (t < D.dot) {
      phase.value = 'dot'
      dot.x = cx.value
      dot.y = cy.value
      dot.o = easeOut(t / D.dot)
    } else if (t < D.dot + D.expand) {
      phase.value = 'expand'
      const te = (t - D.dot) / D.expand
      if (te < EXPAND_ENTER) {
        const f = easeOutStrong(te / EXPAND_ENTER)
        const p0 = pointAt(0)
        dot.x = cx.value + (p0.x - cx.value) * f
        dot.y = cy.value + (p0.y - cy.value) * f
        setDrawn(0)
      } else {
        const f = easeOutStrong((te - EXPAND_ENTER) / (1 - EXPAND_ENTER))
        const len = totalLen() * f
        setDrawn(len)
        const p = pointAt(len)
        dot.x = p.x
        dot.y = p.y
      }
    } else {
      phase.value = 'settle'
      const ts = (t - D.dot - D.expand) / D.settle
      dot.o = Math.max(0, 1 - easeOut(ts)) // 亮点在落位段渐隐
    }
    introRaf = requestAnimationFrame(tick)
  }
  introRaf = requestAnimationFrame(tick)
}

function onIntroEnd(): void {
  if (props.waiting && !finished) {
    startWaitingLoop()
    return
  }
  if (finished) {
    leave()
    return
  }
  const remaining = Math.max(0, props.minDuration - 1000)
  leaveTimer = window.setTimeout(leave, remaining + 60)
}

function startWaitingLoop(): void {
  let origin = -1
  const tick = (frame: number): void => {
    if (origin < 0) origin = frame
    const frac = ((frame - origin) / 2400) % 1
    const p = pointAt(totalLen() * frac)
    dot.x = p.x
    dot.y = p.y
    dot.o = 1
    if (phase.value === 'settle' && props.open) waitingLoopRaf = requestAnimationFrame(tick)
  }
  waitingLoopRaf = requestAnimationFrame(tick)
}

/** 宿主就绪信号：waiting 模式下调用后收场；非 waiting 模式下提前调用可提早收场（受 minDuration 约束） */
function finish(): void {
  finished = true
  if (introDone && phase.value === 'settle') leave()
}

function leave(): void {
  if (phase.value === 'leaving' || phase.value === 'gone') return
  phase.value = 'leaving'
  window.clearTimeout(leaveTimer)
  cancelAnimationFrame(waitingLoopRaf)
  leaveTimer = window.setTimeout(() => {
    phase.value = 'gone'
    emit('done')
    getPlatformAdapter()?.closeSplash?.()
  }, LEAVE_MS)
}

function skip(): void {
  emit('skip')
  leave()
}

async function begin(): Promise<void> {
  reset()
  await nextTick()
  if (reduced.value) {
    // 无动效偏好：直接内容落位，收场逻辑同 intro 完成
    phase.value = 'settle'
    introDone = true
    dot.o = 0
    onIntroEnd()
    return
  }
  startIntro()
}

watch(
  () => props.open,
  (open) => {
    if (open) void begin()
    else reset()
  },
)

onMounted(() => {
  reduced.value = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && props.open && phase.value !== 'leaving' && phase.value !== 'gone') skip()
  }
  window.addEventListener('keydown', onKey)
  if (props.open) void begin()
})

onBeforeUnmount(() => {
  if (onKey) window.removeEventListener('keydown', onKey)
  reset()
})

defineExpose({ finish, dismiss: leave })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="ux-splash"
      :class="[`ux-splash--${mode}`, `ux-splash--${phase}`]"
      data-ux="splash"
      :data-phase="phase"
      role="status"
      :aria-label="label"
    >
      <div class="ux-splash__stage" :style="{ width: 'min(560px, 92vw)' }">
        <svg
          class="ux-splash__svg"
          :viewBox="`0 0 ${width} ${height}`"
          :style="{ aspectRatio: `${width} / ${height}` }"
          aria-hidden="true"
        >
          <rect
            ref="rectRef"
            class="ux-splash__rect"
            :width="width - 2"
            :height="height - 2"
            x="1"
            y="1"
            :rx="radius"
          />
          <circle class="ux-splash__dot" r="3" :cx="dot.x" :cy="dot.y" :opacity="dot.o" />
        </svg>
        <div class="ux-splash__body">
          <slot name="logo">
            <UxIcon v-if="icon" :name="icon" class="ux-splash__logo" />
          </slot>
          <h2 v-if="title" class="ux-splash__title">{{ title }}</h2>
          <p v-if="subtitle" class="ux-splash__sub">{{ subtitle }}</p>
          <div v-if="$slots.default" class="ux-splash__extra"><slot /></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
