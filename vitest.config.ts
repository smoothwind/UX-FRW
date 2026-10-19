import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@ux/composables': fileURLToPath(
        new URL('./packages/composables/src/index.ts', import.meta.url),
      ),
      '@ux/services': fileURLToPath(
        new URL('./packages/services/src/index.ts', import.meta.url),
      ),
      '@ux/tokens': fileURLToPath(new URL('./packages/tokens/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['packages/*/src/**/*.test.ts'],
  },
})
