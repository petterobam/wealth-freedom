import { reactive, computed, inject, type InjectionKey } from 'vue'
import zhCN from './zh-CN'
import en from './en'

export type Locale = 'zh-CN' | 'en'
export type Messages = typeof zhCN

const messages: Record<Locale, Messages> = { 'zh-CN': zhCN, en }

interface I18nState {
  locale: Locale
}

const state = reactive<I18nState>({
  locale: (localStorage.getItem('locale') as Locale) || 'zh-CN',
})

export const i18nKey: InjectionKey<ReturnType<typeof createI18n>> = Symbol('i18n')

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path
}

export function createI18n() {
  const t = (key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(messages[state.locale], key)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      })
    }
    return value
  }

  const setLocale = (locale: Locale) => {
    state.locale = locale
    localStorage.setItem('locale', locale)
    document.documentElement.setAttribute('lang', locale)
  }

  const locale = computed(() => state.locale)

  // Initialize html lang
  document.documentElement.setAttribute('lang', state.locale)

  return { t, setLocale, locale, state }
}

export type I18nInstance = ReturnType<typeof createI18n>

export function useI18n(): I18nInstance {
  const i18n = inject(i18nKey)
  if (!i18n) throw new Error('i18n not provided. Call app.provide(i18nKey, createI18n()) in main.ts')
  return i18n
}
