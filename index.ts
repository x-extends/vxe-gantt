import * as VxeUIGanttExport from './packages/components'
import './styles/all.scss'

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(VxeUIGanttExport)
}

export * from './packages/components'
export default VxeUIGanttExport
