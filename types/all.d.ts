import { App } from 'vue'
import { VxeUIExport, VxeGlobalConfig, VxeComponentKebabCaseKeys } from 'vxe-pc-ui'

import VxeGantt from 'vxe-pc-ui/types/components/gantt'

declare global {
  interface Window {
    VxeUIGantt: VxeUIExport
  }
}

export function install (app: App, options?: VxeGlobalConfig): void

interface AllComponents {
  /**
   * Gantt 甘特图
   */
  VxeGantt: typeof VxeGantt
}

declare module '@vue/runtime-core' {
  export interface GlobalComponents extends AllComponents {}
}

declare module '@vxe-ui/core' {
  export interface VxeGlobalComponents extends AllComponents, VxeComponentKebabCaseKeys<AllComponents> {}
}

// Vxe core
export * from 'vxe-pc-ui/types/ui'

// Vxe Gantt
export * from 'vxe-pc-ui/types/components/gantt'
