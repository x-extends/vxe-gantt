import { VueConstructor } from 'vue'
import { VxeUI } from '@vxe-ui/core'
import VxeGantt from './gantt'
import './ui'

import type { VxeGlobalConfig } from 'vxe-pc-ui'

const { setConfig } = VxeUI

const components = [VxeGantt]

export function install(app: VueConstructor, options?: VxeGlobalConfig) {
  setConfig(options)

  components.forEach((component) => app.use(component))
}

export * from '@vxe-ui/core'

// Components
export * from './gantt'
