import { VxeUI } from '@vxe-ui/core'
import { errLog } from './src/log'

const { setConfig, setIcon, checkVersion } = VxeUI

VxeUI.ganttVersion = process.env.VUE_APP_VXE_VERSION as string

const ymdFormat = 'yyyy-MM-dd'
const ymdhmsFormat = 'yyyy-MM-dd HH:mm:ss'

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
    taskBarTooltipConfig: {
      enterable: true
    },
    taskViewScaleConfig: {
      year: {
        valueFormat: ymdFormat
      },
      quarter: {
        valueFormat: ymdFormat
      },
      month: {
        valueFormat: ymdFormat
      },
      week: {
        startDay: 1,
        valueFormat: ymdFormat
      },
      day: {
        valueFormat: ymdFormat
      },
      date: {
        valueFormat: ymdFormat
      },
      hour: {
        valueFormat: ymdhmsFormat
      },
      minute: {
        valueFormat: ymdhmsFormat
      },
      second: {
        valueFormat: ymdhmsFormat
      }
    },
    taskViewConfig: {
      showNowLine: true,
      gridding: {
        // leftSpacing: 0,
        // rightSpacing: 0
      }
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

const pVersion = 4
const sVersion = 16
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
