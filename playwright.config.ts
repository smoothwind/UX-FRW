import { defineConfig, devices } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // 预置「导览已完成」标记：避免 PatternsDemo 的 TourGuide 首次访问自动全屏启动
    // （遮罩会拦截点击、onReflow 在滚动时反复 scrollIntoView，令元素永不稳定）。
    // 导览自身的行为由 e2e/tour.spec.ts 单独覆盖。
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE_URL,
          localStorage: [{ name: 'uxkit.playground.tour', value: '1' }],
        },
      ],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
