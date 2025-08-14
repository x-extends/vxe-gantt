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

if (!checkVersion(VxeUI.tableVersion, 4, 16)) {
  errLog('vxe.error.errorVersion', [`vxe-table@${VxeUI.tableVersion || '?'}`, 'vxe-table v4.16+'])
}

export {
  VxeUI
}
export default VxeUI
