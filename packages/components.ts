import { App } from 'vue'
import { setConfig, VxeGlobalConfig } from '@vxe-ui/core'

import VxeGantt from './gantt'

const components = [
  VxeGantt
]

export function install (app: App, options?: VxeGlobalConfig) {
  setConfig(options)

  components.forEach(component => app.use(component))
}

export * from './ui'

// Components
export * from './gantt'
