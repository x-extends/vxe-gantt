import { App } from 'vue'
import { VxeUI } from '@vxe-ui/core'
import VxeGantt from './gantt'
import './ui'

import type { VxeGlobalConfig } from 'vxe-pc-ui'

const { setConfig } = VxeUI

const components = [VxeGantt]

export function install(app: App, options?: VxeGlobalConfig) {
  setConfig(options)

  components.forEach((component) => app.use(component))
}

export { VxeUI }

// Components
export * from './gantt'
