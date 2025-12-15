import { VxeUI } from '@vxe-ui/core'
import { errLog } from './log'

export function checkDependVersion () {
  const pVersion = 3
  const sVersion = 19
  if (VxeUI.checkVersion) {
    if (!VxeUI.checkVersion(VxeUI.tableVersion, pVersion, sVersion)) {
      errLog('vxe.error.errorVersion', [`vxe-table@${VxeUI.tableVersion || '?'}`, `vxe-table v${pVersion}.${sVersion}+`])
    }
  } else {
    errLog(`Requires vxe-table v${pVersion}.${sVersion}+`)
  }
}
