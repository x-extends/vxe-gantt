import { VueConstructor } from 'vue'
import { VxeUI } from '@vxe-ui/core'
import VxeGanttComponent from './src/gantt'

let isReg = false

export const VxeGantt = Object.assign({}, VxeGanttComponent, {
  install (app: VueConstructor) {
    if (typeof window !== 'undefined') {
      const VxeGanttExtendGanttChart = (window as any).VxeGanttExtendGanttChart
      if (VxeGanttExtendGanttChart && VxeGanttExtendGanttChart.use) {
        VxeGanttExtendGanttChart.use(VxeUI)
      }
    }
    if (!isReg) {
      isReg = true
      if (VxeUI.dynamicApp) {
        VxeUI.dynamicApp.use(VxeGantt)
      }
    }
    app.component(VxeGanttComponent.name as string, VxeGanttComponent)
  }
})

VxeUI.component(VxeGanttComponent)

export const Gantt = VxeGantt
export default VxeGantt
