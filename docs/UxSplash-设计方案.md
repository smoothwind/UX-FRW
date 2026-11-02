# UxSplash 启动页设计方案（小点旋转成窗体）

> 状态：已实现（M1–M3）。
> 目标：桌面应用启动阶段的高辨识度出场动画——**亮点从小点出发，旋转扫掠展开为 splash 窗体**，随后平稳收场交给主界面。

## 一、定位与归属

| 项 | 决策 | 理由 |
|---|---|---|
| 归属 | `packages/patterns` 新增 `splash/UxSplash.vue` | 复合模式组件，与 TourGuide（全屏遮罩+动画编排）、CommandPalette 同类 |
| 导出 | `@ux/patterns` 增加 `UxSplash` | 对齐 index.ts 既有惯例 |
| 逻辑抽层 | 首版不抽 composables | 时序协调逻辑内聚在组件；出现第二个消费者再抽 `useEntrance` |

## 二、出场动画设计（核心）

四阶段，总时长默认 **1000ms**，全部走 `transform / opacity / clip-path`（GPU 友好，零布局抖动）。

```
┌ 阶段 A 聚点 ──────────────┐   ┌ 阶段 B 旋转成形 ─────────────────┐
│ 0–360ms                    │   │ 360–760ms                          │
│ 4×4px 亮点自中心浮现        │   │ 亮点绕中心逆时针螺旋展开           │
│ scale 0→1 · opacity 0→1    │   │ 角度 0→230° · 半径 0→对角线半      │
│ 品牌色 + 微光晕             │   │ 亮点始终骑在窗体轮廓上（同步生长） │
└────────────────────────────┘   └────────────────────────────────────┘
┌ 阶段 C 内容落位 ───────────┐   ┌ 阶段 D 收场 ──────────────────────┐
│ 760–1000ms                  │   │ 宿主 ready 后触发                   │
│ 品牌图/标题/进度 淡入+8px 上移│   │ scale 1.04→1 + opacity→0           │
│ 窗体出现 rim light 高光      │   │ 200ms 后 unmount + emit('done')    │
└────────────────────────────┘   └────────────────────────────────────┘
```

### 2.1 点与窗体的同步机制（关键难点）

「亮点旋转扫出窗体」采用 **SVG 描边**（已决策）：

- **窗体轮廓**：SVG `<rect>`（圆角）路径，`stroke-dasharray = 周长`，`stroke-dashoffset` 从周长逐帧推进到 0 → 矩形沿四边"画"出来。
- **亮点同步**：每帧 `L = 周长 − dashoffset`，用 SVG `path.getPointAtLength(L)` 取描边头部坐标，把亮点（html 元素）精确放到该点——**亮点永远骑在描边头部**，数学上同一参数驱动，天然同步。
- 驱动：rAF 逐帧，角度 0→sweep（230°）按弧长比例映射到 offset；视图坐标 viewBox→px 换算。
- 备选（记录）：`clip-path` 展开 + 亮点同源变量。首版按决策走 SVG 描边。

### 2.2 参数化（M3 扩展）

| 参数 | 默认 | 说明 |
|---|---|---|
| `sweep` | 230° | 扫掠角度（非整圈，带缓出） |
| `ccw` | false | 旋转方向 |
| `pivot` | `center` | 螺旋轴心（center / corner） |
| `size` | 360×220 | 窗体尺寸，radius 12 |
| `mode` | `window` | `window`=居中窗体+环境渐变底；`cover`=整屏填充 |

## 三、动效令牌与降级

- `layout.css` 登记（新增浮层/时长必须登记，CI 惯例）：
  - `--ux-z-splash: 2800`（最高层，盖过 toast 2700）
  - `--ux-dur-splash: 760ms`（旋转展开段）
  - `--ux-ease-out-strong: cubic-bezier(0.22, 1, 0.36, 1)`（螺旋段强缓出）
- 其余复用 `--ux-dur-fast/slow`、`--ux-ease-out`。
- **`prefers-reduced-motion`**：跳过 A/B/C 动画，直接淡入内容（200ms）→ 功能可用、无闪烁。
- 品牌光效可叠加 fx 层 `--ux-sheen-img`（复用已导出的纹理图令牌）。

## 四、组件 API

```ts
// UxSplash.vue
props {
  open: boolean            // v-model
  title?: string
  subtitle?: string
  icon?: string            // UxIcon name
  minDuration?: number     // 默认 1000（A+B+C 总长）
  waiting?: boolean        // true → 显示加载指示（亮点停在轮廓角，等待 ready）
  label?: string           // 无障碍名
  mode?: 'cover' | 'window' // 默认 window
}
slot {
  #logo                    // 自定义品牌区（默认 UxIcon）
  #default                 // 自定义内容（进度/文案）
}
emits { done; skip }
expose { finish(); dismiss() }
```

**时序协调（Promise 契约）**：
```
退出时机 = max(宿主 finish() 到达时刻, minDuration) + 200ms 缓冲
```
- `waiting=false`：A→B→C 播完即收场（内部计时）。
- `waiting=true`：停在阶段 C，等 `finish()` → 阶段 D。宿主加载提前完成也不会闪断（minDuration 保证最短展示）。

## 五、与既有设施的关系

| 设施 | 关系 |
|---|---|
| 主题 | 表面用 `--ux-bg`/基色；暗色深底配合 fx 丝光最出效果 |
| 主题过渡 | splash 期间**不挂** `data-theme-transition`（避免两套动画打架） |
| z 阶梯 | 新增 `--ux-z-splash: 2800`（layout.css 登记） |
| 键盘完备（红线 8） | Esc 跳过 → `skip` |
| 平台（本期实现） | `PlatformAdapter` 增加 `closeSplash?: () => void`：web 适配器空实现；Electron/Tauri 适配器调用原生启动窗关闭命令（对应宿主命令需登记进 check-commands 三端一致性校验） |

## 六、可访问性

- `reduce-motion` 纯淡入降级，无信息闪烁。
- 品牌内容 `aria-hidden` 直到 settle 阶段；`title` 用 `role="status"` 播报。
- Esc 跳过；`storageKey` 提供时跳过状态可持久化（默认每次启动都播放）。

## 七、测试策略

| 层 | 覆盖 |
|---|---|
| 单测（happy-dom + fake timers） | 阶段推进（dot→expand→settle→leaving→gone）、`minDuration` 与 `finish()` 竞态、Esc 跳过、reduced-motion 直落 settle |
| e2e | playground 演示打开 splash → 断言阶段类/DOM、clip-path 终态、`done` emit；reduced-motion 降级 |
| 视觉走查 | 浅色/暗色/黑暗三主题 × fx 叠加 |

## 八、里程碑

| 里程碑 | 内容 |
|---|---|
| **M1** | UxSplash（A/B/C 三段：聚点→旋转成形→内容落位）+ playground 演示 + 单测 |
| **M2** | 收场与协调：`finish/minDuration/Esc/dismiss` + e2e |
| **M3** | 参数化（sweep/ccw/pivot/size/mode）+ reduced-motion 全面降级 + a11y 用例 |

## 九、已评审决策（2026-11-02）

| 决策点 | 结论 |
|---|---|
| 归属 | `patterns` 包，导出 `@ux/patterns` 的 `UxSplash` |
| 点/窗体同步 | **SVG 描边**：`stroke-dashoffset` 画矩形 + `getPointAtLength` 同步亮点 |
| 收场风格 | **整体淡出**（scale 1.04→1 + opacity→0，200ms） |
| waiting 形态 | **轮廓角亮点**（亮点停在窗体轮廓角顺时针旋转示意加载中） |
| 平台回调 | **本期实现**：`PlatformAdapter.closeSplash?()`，web 空实现，Electron/Tauri 原生命令，入 check-commands 三端校验 |

---

## 附：实现里程碑（待评审通过后执行）

| 里程碑 | 内容 | 验收 |
|---|---|---|
| **M1** | `UxSplash`（A/B/C：聚点→SVG 描边旋转成形→内容落位）+ playground 演示 + 单测 | 动画三段可播、亮点骑在描边头部 |
| **M2** | 收场与协调：`finish/minDuration/Esc/dismiss` + e2e | 时序契约成立、键盘跳过可用 |
| **M3** | 参数化（sweep/ccw/pivot/size/mode）+ reduced-motion 全面降级 + `closeSplash` 三端 + a11y 用例 | 全平台契约一致、axe 无 serious |

> 动效令牌与 z 阶梯（`--ux-z-splash`/`--ux-dur-splash`/`--ux-ease-out-strong`）随 M1 一并登记。
