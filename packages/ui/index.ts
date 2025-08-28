import { VxeUI } from '@vxe-ui/core'
import { errLog } from './src/log'

const { setConfig, setIcon, checkVersion } = VxeUI

VxeUI.ganttVersion = process.env.VUE_APP_VXE_VERSION as string

setConfig({
  gantt: {
    // size: null,
    // zoomConfig: {
    //   escRestore: true
    // },
    formConfig: {
      enabled: true
    },
    pagerConfig: {
      enabled: true
      // perfect: false
    },
    toolbarConfig: {
      enabled: true
      // perfect: false
    },
    proxyConfig: {
      enabled: true,
      autoLoad: true,
      showLoading: true,
      showResponseMsg: true,
      showActionMsg: true,
      response: {
        list: null,
        result: 'result',
        total: 'page.total',
        message: 'message'
      }
      // beforeItem: null,
      // beforeColumn: null,
      // beforeQuery: null,
      // afterQuery: null,
      // beforeDelete: null,
      // afterDelete: null,
      // beforeSave: null,
      // afterSave: null
    },
    taskViewScaleConfs: {
      week: {
        startDay: 1
      }
    },
    taskViewConfig: {
      showNowLine: true
    },
    taskSplitConfig: {
      enabled: true,
      resize: true,
      showCollapseTableButton: true,
      showCollapseTaskButton: true
    }
  }
})

const iconPrefix = 'vxe-icon-'

setIcon({
  // gantt
  GANTT_VIEW_LEFT_OPEN: iconPrefix + 'arrow-left',
  GANTT_VIEW_LEFT_CLOSE: iconPrefix + 'arrow-right',
  GANTT_VIEW_RIGHT_OPEN: iconPrefix + 'arrow-right',
  GANTT_VIEW_RIGHT_CLOSE: iconPrefix + 'arrow-left'
})

const pVersion = 3
const sVersion = 18
if (checkVersion) {
  if (!checkVersion(VxeUI.tableVersion, pVersion, sVersion)) {
    errLog('vxe.error.errorVersion', [`vxe-table@${VxeUI.tableVersion || '?'}`, `vxe-table v${pVersion}.${sVersion}+`])
  }
} else {
  errLog(`Requires vxe-table v${pVersion}.${sVersion}+`)
}

export {
  VxeUI
}
export default VxeUI
