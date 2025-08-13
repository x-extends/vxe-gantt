import { App } from 'vue'
import VxeUI from './ui'
import VxeGantt from './gantt'

import type { VxeGlobalConfig } from 'vxe-pc-ui'

const { setConfig } = VxeUI

const components = [
  VxeGantt
]

export function install (app: App, options?: VxeGlobalConfig) {
  setConfig(options)

  components.forEach(component => app.use(component))
}

export { VxeUI }

// Components
export * from './gantt'
