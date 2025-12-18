import { App } from 'vue'
import { VxeUI } from '@vxe-ui/core'
import { checkDependVersion } from '../ui/src/depend'
import VxeGanttComponent from './src/gantt'

export const VxeGantt = Object.assign({}, VxeGanttComponent, {
  install (app: App) {
    checkDependVersion()
    app.component(VxeGanttComponent.name as string, VxeGanttComponent)
  }
})

if (VxeUI.dynamicApp) {
  VxeUI.dynamicApp.use(VxeGantt)
}
VxeUI.component(VxeGanttComponent)

export * from './src/static'

export const Gantt = VxeGantt
export default VxeGantt
