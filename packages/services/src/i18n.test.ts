import { describe, expect, it, vi } from 'vitest'
import { createI18n, type MessageTree } from './i18n'

const messages: Record<string, MessageTree> = {
  zh: {
    app: { title: '工作台', greet: '你好，{name}！共 {count} 条' },
    only: '仅在中文',
  },
  en: {
    app: { title: 'Workbench', greet: 'Hello, {name}! {count} items' },
  },
}

describe('createI18n', () => {
  it('点分 key 查找当前语言', () => {
    const i18n = createI18n({ locale: 'zh', messages })
    expect(i18n.t('app.title')).toBe('工作台')
  })

  it('插值：缺参保留占位符', () => {
    const i18n = createI18n({ locale: 'zh', messages })
    expect(i18n.t('app.greet', { name: 'Ada', count: 3 })).toBe('你好，Ada！共 3 条')
    expect(i18n.t('app.greet', { name: 'Ada' })).toBe('你好，Ada！共 {count} 条')
    expect(i18n.t('app.greet')).toBe('你好，{name}！共 {count} 条')
  })

  it('回落链：当前语言缺失回落 fallback，全缺失返回 key', () => {
    const i18n = createI18n({ locale: 'en', fallback: 'zh', messages })
    expect(i18n.t('only')).toBe('仅在中文')
    expect(i18n.t('no.such.key')).toBe('no.such.key')
  })

  it('setLocale 非法语言无效，合法语言生效并触发回调', () => {
    const onChange = vi.fn()
    const i18n = createI18n({ locale: 'zh', messages, onLocaleChange: onChange })
    i18n.setLocale('fr')
    expect(i18n.locale.value).toBe('zh')
    expect(onChange).not.toHaveBeenCalled()
    i18n.setLocale('en')
    expect(i18n.locale.value).toBe('en')
    expect(i18n.t('app.title')).toBe('Workbench')
    expect(onChange).toHaveBeenCalledWith('en')
  })

  it('availableLocales 为消息表键集', () => {
    const i18n = createI18n({ locale: 'zh', messages })
    expect(i18n.availableLocales).toEqual(['zh', 'en'])
  })
})
