import { VxeUI } from '@vxe-ui/core'

const { log } = VxeUI

const ganttVersion = `gantt v${process.env.VUE_APP_VXE_VERSION}`

export function createComponentLog (name: string) {
  const uiVersion = VxeUI.uiVersion ? `ui v${VxeUI.uiVersion}` : ''
  const tableVersion = VxeUI.tableVersion ? `table v${VxeUI.tableVersion}` : ''
  const designVersion = VxeUI.designVersion ? `design v${VxeUI.designVersion}` : ''
  const versionInfo = [uiVersion, tableVersion, ganttVersion, designVersion].join(' ')
  return {
    warnLog: log.create('warn', versionInfo + '] [' + name),
    errLog: log.create('error', versionInfo + '] [' + name)
  }
}

export const warnLog = log.create('warn', ganttVersion)
export const errLog = log.create('error', ganttVersion)
