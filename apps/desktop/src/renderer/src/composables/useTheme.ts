import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'wealth-freedom-theme'

const theme = ref<Theme>(loadTheme())

function loadTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY) as Theme | null
  if (saved && ['light', 'dark', 'system'].includes(saved)) return saved
  return 'system'
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(t: Theme) {
  const resolved = t === 'system' ? getSystemTheme() : t
  const html = document.documentElement

  // 添加过渡动画
  html.classList.add('theme-transition')

  if (resolved === 'dark') {
    html.setAttribute('data-theme', 'dark')
  } else {
    html.removeAttribute('data-theme')
  }

  // 移除过渡（避免影响后续交互）
  requestAnimationFrame(() => {
    setTimeout(() => html.classList.remove('theme-transition'), 300)
  })
}

export function useTheme() {
  watch(theme, (val) => {
    localStorage.setItem(THEME_KEY, val)
    applyTheme(val)
  }, { immediate: true })

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemChange = () => {
    if (theme.value === 'system') applyTheme('system')
  }
  mediaQuery.addEventListener('change', onSystemChange)

  const isDark = ref(theme.value === 'dark' || (theme.value === 'system' && getSystemTheme() === 'dark'))
  watch(theme, () => {
    const resolved = theme.value === 'system' ? getSystemTheme() : theme.value
    isDark.value = resolved === 'dark'
  })

  const toggleTheme = () => {
    theme.value = isDark.value ? 'light' : 'dark'
  }

  return { theme, isDark, toggleTheme }
}
