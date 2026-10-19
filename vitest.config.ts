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
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'json-summary'],
      include: ['packages/*/src/**'],
      exclude: [
        'packages/*/src/**/*.test.ts',
        'packages/*/src/**/*.d.ts',
        'packages/*/src/index.ts',
        'packages/*/src/types.ts',
        'packages/*/src/**/*.css',
        'packages/tokens/src/**',
      ],
      thresholds: { lines: 85, branches: 77, functions: 81, statements: 83 },
    },
  },
})
