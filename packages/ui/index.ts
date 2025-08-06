import { VxeUI, setConfig, setIcon } from '@vxe-ui/core'

VxeUI.ganttVersion = process.env.VUE_APP_VXE_VERSION as string

setConfig({
  gantt: {}
})

setIcon({})

export * from '@vxe-ui/core'
export default VxeUI
