import { App } from 'vue'
import { VxeUIExport, VxeGlobalConfig } from 'vxe-pc-ui'

declare global {
  interface Window {
    VxeUIGantt: VxeUIExport
  }
}

export function install (app: App, options?: VxeGlobalConfig): void

// Vxe core
export * from 'vxe-pc-ui/types/ui'

// Vxe Gantt
export * from 'vxe-pc-ui/types/components/gantt'
