import { VueConstructor } from 'vue'
import { VxeUIExport, VxeGlobalConfig, VxeComponentKebabCaseKeys } from 'vxe-pc-ui'

import VxeGantt from 'vxe-pc-ui/types/components/gantt'

declare global {
  interface Window {
    VxeUIDesign: VxeUIExport
  }
}

export function install (app: VueConstructor, options?: VxeGlobalConfig): void

interface AllComponents {
  /**
   * Gantt 甘特图
   */
  VxeGantt: typeof VxeGantt
}

declare module '@vxe-ui/core' {
  export interface VxeGlobalComponents extends AllComponents, VxeComponentKebabCaseKeys<AllComponents> {}
}

// Vxe core
export * from 'vxe-pc-ui/types/ui'

// Vxe Gantt
export * from 'vxe-pc-ui/types/components/gantt'
