import { VxeUI, setConfig, setIcon } from '@vxe-ui/core'

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
    }
  }
})

setIcon({})

export * from '@vxe-ui/core'
export default VxeUI
