import * as VxeUIGanttExport from './packages/components'
import './styles/all.scss'

// 自动安装
if (typeof window !== 'undefined') {
  if (window.Vue) {
    window.Vue.use(VxeUIGanttExport)
  }
}

export * from './packages/components'
export default VxeUIGanttExport
