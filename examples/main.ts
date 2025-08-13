import Vue from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

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

window.axios.defaults.baseURL = process.env.VUE_APP_SERVE_API_URL

Vue.use(VxeUIAll)
Vue.use(VxeUITable)
Vue.use(VxeUIGantt)

Vue.config.productionTip = false

new Vue({
  router,
  i18n,
  render: h => h(App)
}).$mount('#app')
