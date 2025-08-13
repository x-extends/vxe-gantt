import { VueConstructor } from 'vue'
import { VxeUI } from '@vxe-ui/core'
import VxeGanttComponent from './src/gantt'

export const VxeGantt = Object.assign({}, VxeGanttComponent, {
  install (app: VueConstructor) {
    app.component(VxeGanttComponent.name as string, VxeGanttComponent)
  }
})

if (VxeUI.dynamicApp) {
  VxeUI.dynamicApp.use(VxeGantt)
}
VxeUI.component(VxeGanttComponent)

export const Gantt = VxeGantt
export default VxeGantt
