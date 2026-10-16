import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 项目页地址：https://smoothwind.github.io/UX-FRW/
// 仅构建产物需要 /UX-FRW/ 前缀；本地 dev 仍走根路径，避免访问 http://localhost:5173/UX-FRW/。
const PAGES_BASE = '/UX-FRW/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? PAGES_BASE : '/',
  plugins: [vue()],
}))
