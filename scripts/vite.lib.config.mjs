import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

/**
 * 共享的包级 lib 构建配置（vite lib mode）：
 * 产出 dist/index.js（ESM，不压缩便于审查）+ dist/index.d.ts。
 * 构建以包目录为 cwd（pnpm -r build），依赖 vue 与 @ux/* 一律外置。
 * 包内 vite.lib.config.ts 仅需 `export default createLibConfig()`。
 */
export function createLibConfig() {
  return defineConfig({
    plugins: [
      vue(),
      dts({
        tsconfigPath: fileURLToPath(new URL('../tsconfig.json', import.meta.url)),
        include: ['src/**/*.ts', 'src/**/*.vue'],
        exclude: ['src/**/*.test.ts'],
        cleanVueFileName: true,
      }),
    ],
    build: {
      lib: { entry: 'src/index.ts', formats: ['es'] },
      rollupOptions: { external: [/^vue/, /^vue\//, /^@ux\//] },
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      minify: false,
    },
  })
}
