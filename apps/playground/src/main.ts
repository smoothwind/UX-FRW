import { createApp } from 'vue'
import { createWebWindowControls, setPlatformAdapter } from '@ux/services'
import { applyViewport } from '@ux/tokens'
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

const app = createApp(App)
app.mount('#app')
