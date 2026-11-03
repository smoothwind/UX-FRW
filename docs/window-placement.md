# 窗口摆放契约（多显示器 / 混合 DPI）

> 背景：双屏缩放（DPI）不一致时，固定逻辑尺寸 + 创建期一次性 `center` / OS 默认摆放会出现两类问题：
>
> 1. 窗口落到扩展屏后超出其 workArea → 右缘/底部溢出被裁；
> 2. WebView2 在隐藏期完成首次布局，换屏后不重算 DPI，CSS 视口比窗口客户区宽 →
>    `margin: 0 auto` 的内容列视觉偏右、右侧列被裁（用户感知为“UI 排版 bug”，根因在主进程）。

`@ux/services` 的 `PlatformAdapter.windowPlacement` 只定义渲染层契约；**启动期摆放必须在主进程首帧之前完成**
（渲染层来不及参与），因此本页同时给出两端主进程参考实现。宿主注入适配器示例：

```ts
import { setPlatformAdapter } from '@ux/services'

setPlatformAdapter({
  name: 'electron',
  windowControls: createElectronWindowControls(),
  windowPlacement: createElectronWindowPlacement(),
})
```

## 契约语义（务必遵守）

| 约定 | 说明 |
| --- | --- |
| 目标屏 | 一律取**光标所在屏**（`cursorDisplay` / `cursor_position`），取不到回退主屏 |
| 尺寸换算 | 期望逻辑尺寸 × 目标屏 scale → 物理像素，钳制到 workArea × `workAreaRatio`（默认 0.9） |
| 居中 | 在目标屏 workArea 内居中 |
| no-op 条件 | 窗口最大化/全屏时一切摆放操作应为 no-op |
| `resyncBounds` | 以当前矩形重申一次 `setBounds`/`set_size`，**语义不是 resize**——这是 WebView2 混合 DPI 的特有 workaround，勿挪作他用 |
| 执行时机 | 启动摆放：主进程窗口创建后、`show()` 前；`resyncBounds`：`show()` 后执行一次（配合 `on_page_load` / `ready-to-show`） |

## Electron 主进程参考实现

```js
const WIN_WORK_AREA_RATIO = 0.9

/** 目标显示器工作区内的期望边界（DIP）：钳制到工作区 90% 并居中 */
function boundsForDisplay(display) {
  const wa = display.workArea
  const width = Math.max(1, Math.min(1280, Math.floor(wa.width * WIN_WORK_AREA_RATIO)))
  const height = Math.max(1, Math.min(840, Math.floor(wa.height * WIN_WORK_AREA_RATIO)))
  return {
    x: wa.x + Math.floor((wa.width - width) / 2),
    y: wa.y + Math.floor((wa.height - height) / 2),
    width,
    height,
  }
}

function cursorDisplay() {
  try {
    return screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  } catch {
    return screen.getPrimaryDisplay()
  }
}

// 1) 创建：传显式 x/y（显式坐标让 Chromium 按目标屏 DPI 换算，比缺省摆放可靠）
const win = new BrowserWindow({ ...boundsForDisplay(cursorDisplay()), show: false })

// 2) show 后按窗口实际所在屏重申一次边界（强制渲染层按该屏 DPI 重新排版）
win.on('ready-to-show', () => {
  win.show()
  win.setBounds(boundsForDisplay(screen.getDisplayMatching(win.getBounds())))
})

// 3) 兜底：显示器指标变化（改缩放/插拔屏）后，仅当窗口已超出 workArea 时重新钳制，
//    不干预用户手动摆放的位置
screen.on('display-metrics-changed', (_e, display, changedMetrics) => {
  if (!win || win.isDestroyed() || win.isMinimized()) return
  if (win.isMaximized() || win.isFullScreen()) return
  if (!changedMetrics.some((m) => ['scaleFactor', 'workArea', 'bounds'].includes(m))) return
  const cur = win.getBounds()
  const wa = screen.getDisplayMatching(cur).workArea
  const within =
    cur.x >= wa.x && cur.y >= wa.y &&
    cur.x + cur.width <= wa.x + wa.width &&
    cur.y + cur.height <= wa.y + wa.height
  if (!within) win.setBounds(boundsForDisplay(screen.getDisplayMatching(cur)))
})
```

## Tauri 主进程参考实现（Rust）

```rust
const WIN_WORK_AREA_RATIO: f64 = 0.9;

fn monitor_containing(app: &AppHandle, x: f64, y: f64) -> Option<tauri::window::Monitor> {
    let (ix, iy) = (x.floor() as i32, y.floor() as i32);
    app.available_monitors().ok()?.into_iter().find(|m| {
        let p = m.position();
        let s = m.size();
        ix >= p.x && iy >= p.y && ix < p.x + s.width as i32 && iy < p.y + s.height as i32
    })
}

/// 期望矩形：逻辑尺寸 × 目标屏 scale → 物理像素，钳制到 workArea 90% 并居中
fn desired_window_rect(
    monitor: &tauri::window::Monitor,
) -> (tauri::PhysicalPosition<i32>, tauri::PhysicalSize<u32>) {
    let scale = monitor.scale_factor();
    let wa = monitor.work_area();
    let dim = |desired: f64, min: f64, max: f64| -> u32 {
        (desired * scale).round().max(min * scale).min(max).max(1.0) as u32
    };
    let w = dim(1280.0, 760.0, wa.size.width as f64 * WIN_WORK_AREA_RATIO);
    let h = dim(840.0, 540.0, wa.size.height as f64 * WIN_WORK_AREA_RATIO);
    let x = wa.position.x + ((wa.size.width as i32 - w as i32) / 2).max(0);
    let y = wa.position.y + ((wa.size.height as i32 - h as i32) / 2).max(0);
    (tauri::PhysicalPosition::new(x, y), tauri::PhysicalSize::new(w, h))
}

/// 最大化/全屏不干预；目标屏 = 光标所在屏，取不到回退主屏
fn place_main_window(app: &AppHandle) {
    let Some(w) = app.get_webview_window("main") else { return };
    if w.is_maximized().unwrap_or(false) || w.is_fullscreen().unwrap_or(false) {
        return;
    }
    let monitor = app
        .cursor_position().ok()
        .and_then(|p| monitor_containing(app, p.x, p.y))
        .or_else(|| app.primary_monitor().ok().flatten());
    let Some(monitor) = monitor else { return };
    let (pos, size) = desired_window_rect(&monitor);
    let _ = w.set_size(size);
    let _ = w.set_position(pos);
}

// setup 中：conf 不写 `center: true`（它只按创建屏居中一次），改为按光标所在屏重摆
//   setup:        place_main_window(&handle);
// on_page_load 中：show + set_focus 之后重申一次（只做一次，用 OnceLock 防热重载拽回窗口）
//   if WIN_REASSERT_ONCE.set(()).is_ok() { place_main_window(webview.app_handle()); }
```

## dev 期自检

宿主开发构建可安装视口健康监听，提前暴露窗口几何失配：

```ts
import { installViewportHealthWatch } from '@ux/services'

if (import.meta.env.DEV) installViewportHealthWatch()
```

判定规则见 `packages/services/src/viewport.ts`：`innerWidth > outerWidth` 为窗口几何失配
（本页问题的典型症状）；`innerWidth` 扣除滚动条容差后仍大于 `clientWidth` 为前端布局问题。
