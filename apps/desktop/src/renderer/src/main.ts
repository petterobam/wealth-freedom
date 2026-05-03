import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'
import './styles/theme.css'
import './styles/dark-override.css'
import './styles/global.scss'
import { createI18n, i18nKey } from './i18n'
import en from 'element-plus/es/locale/lang/en'

const i18n = createI18n()
const elLocale = i18n.locale.value === 'en' ? en : zhCn

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.provide(i18nKey, i18n)
app.use(ElementPlus, { locale: elLocale })

app.mount('#app')
