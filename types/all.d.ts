import { VueConstructor } from 'vue'
import { VxeUIExport, VxeGlobalConfig } from 'vxe-pc-ui'

declare global {
  interface Window {
    VxeUIDesign: VxeUIExport
  }
}

export function install (app: VueConstructor, options?: VxeGlobalConfig): void

// Vxe core
export * from 'vxe-pc-ui/types/ui'

// Vxe Gantt
export * from 'vxe-pc-ui/types/components/gantt'
