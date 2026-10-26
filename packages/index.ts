import * as VxeUIGanttExport from './components'

// 自动安装
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(VxeUIGanttExport)
}

export * from './components'

/**
 * A vue based PC component library
 */
export default VxeUIGanttExport
