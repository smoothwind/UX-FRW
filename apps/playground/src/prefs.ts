import { createPreferences } from '@ux/services'

export interface PlaygroundPrefs extends Record<string, unknown> {
  theme: 'light' | 'dark' | 'system'
  locale: string
  density: 'comfortable' | 'compact'
}

/** 应用级偏好单例：单一 localStorage key + 版本号，App 与各演示面板共享 */
export const prefs = createPreferences<PlaygroundPrefs>({
  key: 'uxkit.playground.prefs',
  version: 1,
  defaults: {
    theme: 'light',
    locale: 'zh-CN',
    density: 'comfortable',
  },
  migrate: (fromVersion, data) => {
    if (fromVersion < 1) {
      return { density: 'comfortable', ...data }
    }
    return data
  },
})
