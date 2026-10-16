import { createApp } from 'vue'
import { createWebWindowControls, setPlatformAdapter } from '@ux/services'
import '@ux/tokens/tokens.css'
import '@ux/components/styles.css'
import '@ux/patterns/styles.css'
import '@ux/shell/styles.css'
import App from './App.vue'
import './style.css'

setPlatformAdapter({ name: 'web', windowControls: createWebWindowControls() })

createApp(App).mount('#app')
