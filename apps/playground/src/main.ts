import { createApp } from 'vue'
import { createWebWindowControls, getPlatformAdapter, setPlatformAdapter } from '@ux/services'
import { applySafeAreaInsets, applyViewport } from '@ux/tokens'
import '@ux/tokens/tokens.css'
import '@ux/components/styles.css'
import '@ux/patterns/styles.css'
import '@ux/shell/styles.css'
import App from './App.vue'
import './style.css'

setPlatformAdapter({ name: 'web', windowControls: createWebWindowControls() })

// 视口状态通道（data-ux-viewport）：移动端入口的收缩布局消费此根属性
const stopViewport = applyViewport()
window.addEventListener('beforeunload', stopViewport)

// 安全区宿主上报兜底（§3.3/§8）：env() 不可靠的安卓 WebView 由移动宿主经
// PlatformAdapter.safeAreaInsets 上报真实数值，这里统一接令牌覆写；web 无实现即 no-op
void getPlatformAdapter()
  ?.safeAreaInsets?.()
  .then(applySafeAreaInsets)
  .catch(() => {
    /* 宿主上报失败保持 env() 默认，不阻断启动 */
  })

const app = createApp(App)
app.mount('#app')
