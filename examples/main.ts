import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './styles/index.scss'

// 引入组件库
import VxeUIAll, { VxeUI } from 'vxe-pc-ui'
import 'vxe-pc-ui/lib/style.css'

import VxeUITable from 'vxe-table'
import 'vxe-table/lib/style.css'

import VxeUIGantt from '../packages'
import '../styles/all.scss'

declare global {
  interface Window {
    axios: any;
  }
}

VxeUI.setConfig({
  permissionMethod ({ code }) {
    if (code === 'xx') {
      return {
        visible: true,
        disabled: true
      }
    }
    return {
      visible: false,
      disabled: true
    }
  }
})

VxeUI.setLanguage((localStorage.getItem('VXE_LANGUAGE') as 'zh-CN' | 'en-US') || 'zh-CN')

window.axios.defaults.baseURL = process.env.VUE_APP_SERVE_API_URL

const app = createApp(App)

app.use(router)
app.use(VxeUIAll)
app.use(VxeUITable)
app.use(VxeUIGantt)

app.mount('#app')
