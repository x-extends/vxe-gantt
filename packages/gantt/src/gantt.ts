import { PropType, VNode, CreateElement, Component } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import XEUtils from 'xe-utils'
import { getLastZIndex, nextZIndex, isEnableConf } from '../../ui/src/utils'
import { getOffsetHeight, getPaddingTopBottomSize, getDomNode, toCssUnit, addClass, removeClass } from '../../ui/src/dom'
import { getSlotVNs } from '../../ui/src/vn'
import { warnLog, errLog } from '../../ui/src/log'
import GanttViewComponent from './gantt-view'
import { VxeTable as VxeTableComponent } from 'vxe-table'

import type { ValueOf, VxeFormInstance, VxeFormItemProps, VxePagerInstance, VxePagerDefines, VxeComponentStyleType, VxeComponentSizeType, VxeFormDefines, VxeFormItemPropTypes } from 'vxe-pc-ui'
import type { VxeTableMethods, VxeToolbarPropTypes, VxeTableProps, VxeTableConstructor, VxeTablePrivateMethods, VxeTableDefines, TableReactData, VxeToolbarInstance, TableInternalData, VxeTablePropTypes, VxeGridPropTypes } from 'vxe-table'
import type { VxeGanttEmits, GanttReactData, GanttInternalData, VxeGanttPropTypes, VxeGanttViewInstance, VxeGanttDefines, VxeGanttConstructor } from '../../../types'

const { getConfig, getIcon, getI18n, commands, globalMixins, createEvent, globalEvents, GLOBAL_EVENT_KEYS, renderEmptyElement } = VxeUI

const tableProps = (VxeTableComponent as any).props

const tableMethods: VxeTableMethods = {} as VxeTableMethods
const propKeys = Object.keys(tableProps) as (keyof VxeTableProps)[]

const defaultLayouts: VxeGanttPropTypes.Layouts = [['Form'], ['Toolbar', 'Top', 'Gantt', 'Bottom', 'Pager']]

const viewTypeLevelMaps = {
  year: 19,
  quarter: 17,
  month: 15,
  week: 13,
  day: 11,
  date: 9,
  hour: 7,
  minute: 5,
  second: 3
}

function getViewTypeLevel (type: VxeGanttDefines.ColumnScaleType) {
  return viewTypeLevelMaps[type || 'date'] || viewTypeLevelMaps.date
}

function getTableOns ($xeGantt: VxeGanttConstructor) {
  const _vm = $xeGantt as any
  const $listeners = _vm.$listeners

  const props = $xeGantt

  const { proxyConfig } = props
  const proxyOpts = $xeGantt.computeProxyOpts
  const ons: any = {}
  XEUtils.each($listeners, (cb: any, type: any) => {
    ons[type] = (...args: any[]) => {
      $xeGantt.$emit(type, ...args)
    }
  })
  if (proxyConfig) {
    if (proxyOpts.sort) {
      ons['sort-change'] = _vm.sortChangeEvent
      ons['clear-all-sort'] = _vm.clearAllSortEvent
    }
    if (proxyOpts.filter) {
      ons['filter-change'] = _vm.filterChangeEvent
      ons['clear-all-filter'] = _vm.clearAllFilterEvent
    }
  }
  return ons
}

XEUtils.each((VxeTableComponent as any).methods, (fn, name) => {
  tableMethods[name as keyof VxeTableMethods] = function (this: any, ...args: any[]) {
    const $xeGantt = this
    const $xeTable = $xeGantt.$refs.refTable

    return $xeTable && $xeTable[name](...args)
  }
})

function createInternalData (): GanttInternalData {
  return {
    resizeTableWidth: 0
  }
}

export default /* define-vxe-component start */ defineVxeComponent({
  name: 'VxeGantt',
  mixins: [
    globalMixins.sizeMixin
  ],
  props: {
    ...(tableProps as unknown as {
      border: PropType<VxeTablePropTypes.Border>
      round: PropType<VxeTablePropTypes.Round>
      loading: PropType<VxeTablePropTypes.Loading>
      height: PropType<VxeTablePropTypes.Height>
      minHeight: PropType<VxeTablePropTypes.MinHeight>
      maxHeight: PropType<VxeTablePropTypes.MaxHeight>
      seqConfig: PropType<VxeTablePropTypes.SeqConfig>
      editConfig: PropType<VxeTablePropTypes.EditConfig>
      sortConfig: PropType<VxeTablePropTypes.SortConfig>
      filterConfig: PropType<VxeTablePropTypes.FilterConfig>
      expandConfig: PropType<VxeTablePropTypes.ExpandConfig>
      aggregateConfig: PropType<VxeTablePropTypes.AggregateConfig>
      validConfig: PropType<VxeTablePropTypes.ValidConfig>
      editRules: PropType<VxeTablePropTypes.EditRules>
      animat: PropType<VxeTablePropTypes.Animat>
      scrollbarConfig: PropType<VxeTablePropTypes.ScrollbarConfig>
      params: PropType<VxeTablePropTypes.Params>
    }),

    columns: Array as PropType<VxeGridPropTypes.Columns<any>>,
    pagerConfig: Object as PropType<VxeGridPropTypes.PagerConfig>,
    proxyConfig: Object as PropType<VxeGridPropTypes.ProxyConfig<any>>,
    toolbarConfig: Object as PropType<VxeGridPropTypes.ToolbarConfig>,
    formConfig: Object as PropType<VxeGridPropTypes.FormConfig>,
    zoomConfig: Object as PropType<VxeGridPropTypes.ZoomConfig>,

    layouts: Array as PropType<VxeGanttPropTypes.Layouts>,
    taskConfig: Object as PropType<VxeGanttPropTypes.TaskConfig>,
    taskViewScaleConfs: Object as PropType<VxeGanttPropTypes.TaskViewScaleConfs>,
    taskViewConfig: Object as PropType<VxeGanttPropTypes.TaskViewConfig>,
    taskBarConfig: Object as PropType<VxeGanttPropTypes.TaskBarConfig>,
    taskSplitConfig: Object as PropType<VxeGanttPropTypes.TaskSplitConfig>,
    size: {
      type: String as PropType<VxeGridPropTypes.Size>,
      default: () => getConfig().gantt.size || getConfig().size
    }
  },
  provide () {
    const $xeGantt = this
    const $xeGrid = null

    return {
      $xeGrid,
      $xeGantt
    }
  },
  data () {
    const xID = XEUtils.uniqueId()

    const reactData: GanttReactData = {
      tableLoading: false,
      proxyInited: false,
      isZMax: false,
      tableData: [],
      filterData: [],
      formData: {},
      sortData: [],
      tZindex: 0,
      tablePage: {
        total: 0,
        pageSize: getConfig().pager?.pageSize || 10,
        currentPage: 1
      },
      showLeftView: true,
      showRightView: true,
      taskScaleList: []
    }

    const internalData = createInternalData()

    return {
      xID,
      reactData,
      internalData
    }
  },
  computed: {
    ...({} as {
      computeSize(): VxeComponentSizeType
    }),
    computeProxyOpts () {
      const $xeGantt = this
      const props = $xeGantt

      return XEUtils.merge({}, XEUtils.clone(getConfig().gantt.proxyConfig, true), props.proxyConfig)
    },
    computeIsRespMsg () {
      const $xeGantt = this

      const proxyOpts = $xeGantt.computeProxyOpts as VxeGanttPropTypes.ProxyConfig
      return !!(XEUtils.isBoolean(proxyOpts.message) ? proxyOpts.message : proxyOpts.showResponseMsg)
    },
    computeIsActiveMsg () {
      const $xeGantt = this

      const proxyOpts = $xeGantt.computeProxyOpts as VxeGanttPropTypes.ProxyConfig
      return XEUtils.isBoolean(proxyOpts.showActionMsg) ? proxyOpts.showActionMsg : !!proxyOpts.showActiveMsg
    },
    computePagerOpts () {
      const $xeGantt = this
      const props = $xeGantt

      return Object.assign({}, getConfig().gantt.pagerConfig, props.pagerConfig)
    },
    computeFormOpts () {
      const $xeGantt = this
      const props = $xeGantt

      return Object.assign({}, getConfig().gantt.formConfig, props.formConfig)
    },
    computeToolbarOpts () {
      const $xeGantt = this
      const props = $xeGantt

      return Object.assign({}, getConfig().gantt.toolbarConfig, props.toolbarConfig)
    },
    computeZoomOpts () {
      const $xeGantt = this
      const props = $xeGantt

      return Object.assign({}, getConfig().gantt.zoomConfig, props.zoomConfig)
    },
    computeTaskOpts () {
      const $xeGantt = this
      const props = $xeGantt

      return Object.assign({}, getConfig().gantt.taskConfig, props.taskConfig)
    },
    computeTaskViewScaleMapsOpts () {
      const $xeGantt = this
      const props = $xeGantt

      return XEUtils.merge({}, getConfig().gantt.taskViewScaleConfs, props.taskViewScaleConfs)
    },
    computeTaskViewOpts () {
      const $xeGantt = this
      const props = $xeGantt

      return Object.assign({}, getConfig().gantt.taskViewConfig, props.taskViewConfig)
    },
    computeTaskBarOpts () {
      const $xeGantt = this
      const props = $xeGantt

      return Object.assign({}, getConfig().gantt.taskBarConfig, props.taskBarConfig)
    },
    computeTaskSplitOpts () {
      const $xeGantt = this
      const props = $xeGantt

      return Object.assign({}, getConfig().gantt.taskSplitConfig, props.taskSplitConfig)
    },
    computeTaskScaleConfs () {
      const $xeGantt = this

      const taskViewOpts = $xeGantt.computeTaskViewOpts as VxeGanttPropTypes.TaskViewConfig
      const { scales } = taskViewOpts
      return scales
    },
    computeTitleField () {
      const $xeGantt = this

      const taskOpts = $xeGantt.computeTaskOpts as VxeGanttPropTypes.TaskConfig
      return taskOpts.titleField || 'title'
    },
    computeStartField () {
      const $xeGantt = this

      const taskOpts = $xeGantt.computeTaskOpts as VxeGanttPropTypes.TaskConfig
      return taskOpts.startField || 'start'
    },
    computeEndField () {
      const $xeGantt = this

      const taskOpts = $xeGantt.computeTaskOpts as VxeGanttPropTypes.TaskConfig
      return taskOpts.endField || 'end'
    },
    computeProgressField () {
      const $xeGantt = this

      const taskOpts = $xeGantt.computeTaskOpts as VxeGanttPropTypes.TaskConfig
      return taskOpts.progressField || 'progress'
    },
    computeScrollbarOpts () {
      const $xeGantt = this
      const props = $xeGantt

      return Object.assign({}, getConfig().gantt.scrollbarConfig, props.scrollbarConfig)
    },
    computeScrollbarXToTop () {
      const $xeGantt = this

      const scrollbarOpts = $xeGantt.computeScrollbarOpts as VxeTablePropTypes.ScrollbarConfig
      return !!(scrollbarOpts.x && scrollbarOpts.x.position === 'top')
    },
    computeScrollbarYToLeft () {
      const $xeGantt = this

      const scrollbarOpts = $xeGantt.computeScrollbarOpts as VxeTablePropTypes.ScrollbarConfig
      return !!(scrollbarOpts.y && scrollbarOpts.y.position === 'left')
    },
    computeStyles () {
      const $xeGantt = this
      const props = $xeGantt
      const reactData = $xeGantt.reactData

      const { height, maxHeight } = props
      const { isZMax, tZindex } = reactData
      const taskViewOpts = $xeGantt.computeTaskViewOpts as VxeGanttPropTypes.TaskViewConfig
      const { tableStyle } = taskViewOpts
      const taskBarOpts = $xeGantt.computeTaskBarOpts as VxeGanttPropTypes.TaskBarConfig
      const { barStyle } = taskBarOpts
      const stys: VxeComponentStyleType = {}
      if (isZMax) {
        stys.zIndex = tZindex
      } else {
        if (height) {
          stys.height = height === 'auto' || height === '100%' ? '100%' : toCssUnit(height)
        }
        if (maxHeight) {
          stys.maxHeight = maxHeight === 'auto' || maxHeight === '100%' ? '100%' : toCssUnit(maxHeight)
        }
      }
      if (barStyle && !XEUtils.isFunction(barStyle)) {
        const { bgColor, completedBgColor } = barStyle
        if (bgColor) {
          stys['--vxe-ui-gantt-view-task-bar-background-color'] = bgColor
        }
        if (completedBgColor) {
          stys['--vxe-ui-gantt-view-task-bar-completed-background-color'] = completedBgColor
        }
      }
      if (tableStyle) {
        const { width: defTbWidth } = tableStyle
        if (defTbWidth) {
          stys['--vxe-ui-gantt-view-table-default-width'] = toCssUnit(defTbWidth)
        }
      }
      return stys
    },
    computeTableExtendProps () {
      const $xeGantt = this
      const props = $xeGantt

      const rest: any = {}
      const gridProps: any = props
      propKeys.forEach(key => {
        rest[key] = gridProps[key]
      })
      return rest
    },
    computeTableProps () {
      const $xeGantt = this
      const props = $xeGantt
      const reactData = $xeGantt.reactData

      const { seqConfig, pagerConfig, editConfig, proxyConfig } = props
      const { isZMax, tablePage } = reactData
      const taskViewOpts = $xeGantt.computeTaskViewOpts
      const { tableStyle } = taskViewOpts
      const tableExtendProps = $xeGantt.computeTableExtendProps as any
      const proxyOpts = $xeGantt.computeProxyOpts
      const pagerOpts = $xeGantt.computePagerOpts
      const isLoading = $xeGantt.computeIsLoading
      const tProps = Object.assign({}, tableExtendProps, {
        // 不支持修改的属性
        showOverflow: true,
        showHeaderOverflow: true,
        showFooterOverflow: true
      })
      if (tableStyle) {
        const { border } = tableStyle
        if (!XEUtils.eqNull(border)) {
          tProps.border = border
        }
      }
      if (isZMax) {
        if (tableExtendProps.maxHeight) {
          tProps.maxHeight = '100%'
        } else {
          tProps.height = '100%'
        }
      }
      if (proxyConfig && isEnableConf(proxyOpts)) {
        tProps.loading = isLoading
        if (pagerConfig && proxyOpts.seq && isEnableConf(pagerOpts)) {
          tProps.seqConfig = Object.assign({}, seqConfig, { startIndex: (tablePage.currentPage - 1) * tablePage.pageSize })
        }
      }
      if (editConfig) {
        tProps.editConfig = Object.assign({}, editConfig)
      }
      return tProps
    },
    tableProps () {
      const $xeGantt = this

      return $xeGantt.computeTableProps
    },
    computeCurrLayoutConf () {
      const $xeGantt = this
      const props = $xeGantt

      const { layouts } = props
      let confs: VxeGanttPropTypes.Layouts = []
      if (layouts && layouts.length) {
        confs = layouts
      } else {
        confs = getConfig().gantt.layouts || defaultLayouts
      }
      let headKeys: VxeGanttDefines.LayoutKey[] = []
      let bodyKeys: VxeGanttDefines.LayoutKey[] = []
      let footKeys: VxeGanttDefines.LayoutKey[] = []
      if (confs.length) {
        if (XEUtils.isArray(confs[0])) {
          headKeys = confs[0] as VxeGanttDefines.LayoutKey[]
          bodyKeys = (confs[1] || []) as VxeGanttDefines.LayoutKey[]
          footKeys = (confs[2] || []) as VxeGanttDefines.LayoutKey[]
        } else {
          bodyKeys = confs as VxeGanttDefines.LayoutKey[]
        }
      }
      return {
        headKeys,
        bodyKeys,
        footKeys
      }
    },
    computeCustomCurrentPageFlag () {
      const $xeGantt = this

      const pagerOpts = $xeGantt.computePagerOpts as VxeGanttPropTypes.PagerConfig
      return pagerOpts.currentPage
    },
    computeCustomPageSizeFlag () {
      const $xeGantt = this

      const pagerOpts = $xeGantt.computePagerOpts as VxeGanttPropTypes.PagerConfig
      return pagerOpts.pageSize
    },
    computeCustomTotalFlag () {
      const $xeGantt = this

      const pagerOpts = $xeGantt.computePagerOpts as VxeGanttPropTypes.PagerConfig
      return pagerOpts.total
    },
    computePageCount () {
      const $xeGantt = this
      const reactData = ($xeGantt as any).reactData

      const { tablePage } = reactData
      return Math.max(Math.ceil(tablePage.total / tablePage.pageSize), 1)
    },
    computeIsLoading () {
      const $xeGantt = this
      const props = $xeGantt
      const reactData = ($xeGantt as any).reactData

      const { loading, proxyConfig } = props
      const { tableLoading } = reactData
      const proxyOpts = $xeGantt.computeProxyOpts as VxeGanttPropTypes.ProxyConfig
      const { showLoading } = proxyOpts
      return loading || (tableLoading && showLoading && proxyConfig && isEnableConf(proxyOpts))
    },
    computeTableBorder () {
      const $xeGantt = this
      const props = $xeGantt

      let { border } = props
      const taskViewOpts = $xeGantt.computeTaskViewOpts as VxeGanttPropTypes.TaskViewConfig
      const { viewStyle } = taskViewOpts
      if (viewStyle) {
        if (!XEUtils.eqNull(viewStyle.border)) {
          border = viewStyle.border as VxeTablePropTypes.Border
        }
      }
      if (border === true) {
        return 'full'
      }
      if (border) {
        return border
      }
      return 'default'
    }
  },
  watch: {
    columns () {
      const $xeGantt = this
      const props = $xeGantt

      $xeGantt.$nextTick(() => $xeGantt.loadColumn(props.columns || []))
    },
    toolbarConfig () {
      const $xeGantt = this

      $xeGantt.initToolbar()
    },
    computeCustomCurrentPageFlag () {
      const $xeGantt = this

      $xeGantt.initPages('currentPage')
    },
    computeCustomPageSizeFlag () {
      const $xeGantt = this

      $xeGantt.initPages('pageSize')
    },
    computeCustomTotalFlag () {
      const $xeGantt = this

      $xeGantt.initPages('total')
    },
    proxyConfig () {
      const $xeGantt = this

      $xeGantt.initProxy()
    },
    computeTaskScaleConfs () {
      const $xeGantt = this

      $xeGantt.handleTaskScaleConfig()
    }
  },
  methods: {
    ...tableMethods,
    dispatchEvent (type: ValueOf<VxeGanttEmits>, params: Record<string, any>, evnt: Event | null) {
      const $xeGantt = this

      $xeGantt.$emit(type, createEvent(evnt, { $grid: null, $gantt: $xeGantt }, params))
    },
    handleTaskScaleConfig () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      const taskScaleConfs = $xeGantt.computeTaskScaleConfs
      const taskViewScaleMapsOpts = $xeGantt.computeTaskViewScaleMapsOpts
      const scaleConfs: VxeGanttDefines.ColumnScaleObj[] = []
      if (taskScaleConfs) {
        const keyMaps: Record<string, boolean> = {}
        taskScaleConfs.forEach(conf => {
          const sConf = !conf || XEUtils.isString(conf) ? { type: conf } : conf
          const { type } = sConf
          if (!type || !viewTypeLevelMaps[type]) {
            errLog('vxe.error.errProp', [`type=${type}`, XEUtils.keys(viewTypeLevelMaps).join(',')])
            return
          }
          if (keyMaps[type]) {
            errLog('vxe.error.repeatProp', ['type', type])
            return
          }
          keyMaps[type] = true
          scaleConfs.push(Object.assign({}, type ? taskViewScaleMapsOpts[type] || {} : {}, sConf, {
            level: getViewTypeLevel(type)
          }))
        })
      }
      if (!scaleConfs.length) {
        scaleConfs.push(
          { type: 'month', level: viewTypeLevelMaps.month },
          { type: 'date', level: viewTypeLevelMaps.date }
        )
      }
      reactData.taskScaleList = XEUtils.orderBy(scaleConfs, { field: 'level', order: 'desc' })
    },
    initToolbar () {
      const $xeGantt = this

      $xeGantt.$nextTick(() => {
        const $xeTable = $xeGantt.$refs.refTable as VxeTableConstructor & VxeTablePrivateMethods
        const $xeToolbar = $xeGantt.$refs.refToolbar as VxeToolbarInstance
        if ($xeTable && $xeToolbar) {
          $xeTable.connectToolbar($xeToolbar)
        }
      })
    },
    initGanttView () {
      const $xeGantt = this

      const $xeTable = $xeGantt.$refs.refTable as VxeTableConstructor & VxeTablePrivateMethods
      const $ganttView = $xeGantt.$refs.refGanttView as VxeGanttViewInstance
      if ($xeTable && $ganttView) {
        $xeTable.handleConnectGanttView($ganttView)
      }
    },
    initPages (propKey?: 'currentPage' | 'pageSize' | 'total') {
      const $xeGantt = this
      const props = $xeGantt
      const reactData = $xeGantt.reactData

      const { tablePage } = reactData
      const { pagerConfig } = props
      const pagerOpts = $xeGantt.computePagerOpts
      if (pagerConfig && isEnableConf(pagerOpts)) {
        if (propKey) {
          if (pagerOpts[propKey]) {
            tablePage[propKey] = XEUtils.toNumber(pagerOpts[propKey])
          }
        } else {
          const { currentPage, pageSize, total } = pagerOpts
          if (currentPage) {
            tablePage.currentPage = currentPage
          }
          if (pageSize) {
            tablePage.pageSize = pageSize
          }
          if (total) {
            tablePage.total = total
          }
        }
      }
    },
    triggerPendingEvent (code: string) {
      const $xeGantt = this

      const isActiveMsg = $xeGantt.computeIsActiveMsg
      const $xeTable = $xeGantt.$refs.refTable as VxeTableConstructor & VxeTablePrivateMethods
      const selectRecords = $xeTable.getCheckboxRecords()
      if (selectRecords.length) {
        $xeTable.togglePendingRow(selectRecords)
        $xeGantt.clearCheckboxRow()
      } else {
        if (isActiveMsg) {
          if (VxeUI.modal) {
            VxeUI.modal.message({ id: code, content: getI18n('vxe.grid.selectOneRecord'), status: 'warning' })
          }
        }
      }
    },
    getRespMsg (rest: any, defaultMsg: string) {
      const $xeGantt = this

      const proxyOpts = $xeGantt.computeProxyOpts
      const resConfigs = proxyOpts.response || proxyOpts.props || {}
      const messageProp = resConfigs.message
      const $xeTable = $xeGantt.$refs.refTable as VxeTableConstructor & VxeTablePrivateMethods
      let msg
      if (rest && messageProp) {
        msg = XEUtils.isFunction(messageProp) ? messageProp({ data: rest, $table: $xeTable, $grid: null, $gantt: $xeGantt }) : XEUtils.get(rest, messageProp)
      }
      return msg || getI18n(defaultMsg)
    },
    handleDeleteRow (code: string, alertKey: string, callback: () => void): Promise<void> {
      const $xeGantt = this

      const isActiveMsg = $xeGantt.computeIsActiveMsg
      const selectRecords = $xeGantt.getCheckboxRecords()
      if (isActiveMsg) {
        if (selectRecords.length) {
          if (VxeUI.modal) {
            return VxeUI.modal.confirm({ id: `cfm_${code}`, content: getI18n(alertKey), escClosable: true }).then((type) => {
              if (type === 'confirm') {
                return callback()
              }
            })
          }
        } else {
          if (VxeUI.modal) {
            VxeUI.modal.message({ id: `msg_${code}`, content: getI18n('vxe.grid.selectOneRecord'), status: 'warning' })
          }
        }
      } else {
        if (selectRecords.length) {
          callback()
        }
      }
      return Promise.resolve()
    },
    pageChangeEvent (params: VxePagerDefines.PageChangeEventParams) {
      const $xeGantt = this
      const props = $xeGantt
      const reactData = $xeGantt.reactData

      const { proxyConfig } = props
      const { tablePage } = reactData
      const { $event, currentPage, pageSize } = params
      const proxyOpts = $xeGantt.computeProxyOpts
      tablePage.currentPage = currentPage
      tablePage.pageSize = pageSize
      $xeGantt.dispatchEvent('page-change', params, $event)
      if (proxyConfig && isEnableConf(proxyOpts)) {
        $xeGantt.commitProxy('query').then((rest) => {
          $xeGantt.dispatchEvent('proxy-query', rest, $event)
        })
      }
    },
    handleSortEvent (params: VxeTableDefines.SortChangeEventParams) {
      const $xeGantt = this
      const props = $xeGantt
      const reactData = $xeGantt.reactData
      const $xeTable = $xeGantt.$refs.refTable as VxeTableConstructor & VxeTablePrivateMethods

      const { proxyConfig } = props
      const proxyOpts = $xeGantt.computeProxyOpts
      const sortOpts = $xeTable.computeSortOpts
      // 如果是服务端排序
      if (sortOpts.remote) {
        reactData.sortData = params.sortList
        if (proxyConfig && isEnableConf(proxyOpts)) {
          reactData.tablePage.currentPage = 1
          $xeGantt.commitProxy('query').then((rest) => {
            $xeGantt.dispatchEvent('proxy-query', rest, params.$event)
          })
        }
      }
    },
    sortChangeEvent (params: VxeTableDefines.SortChangeEventParams) {
      const $xeGantt = this

      $xeGantt.handleSortEvent(params)
      $xeGantt.dispatchEvent('sort-change', params, params.$event)
    },
    clearAllSortEvent (params: VxeTableDefines.SortChangeEventParams) {
      const $xeGantt = this

      $xeGantt.handleSortEvent(params)
      $xeGantt.dispatchEvent('clear-all-sort', params, params.$event)
    },
    handleFilterEvent (params: VxeTableDefines.ClearAllFilterEventParams) {
      const $xeGantt = this
      const props = $xeGantt
      const reactData = $xeGantt.reactData
      const $xeTable = $xeGantt.$refs.refTable as VxeTableConstructor & VxeTablePrivateMethods

      const { proxyConfig } = props
      const proxyOpts = $xeGantt.computeProxyOpts
      const filterOpts = $xeTable.computeFilterOpts
      // 如果是服务端过滤
      if (filterOpts.remote) {
        reactData.filterData = params.filterList
        if (proxyConfig && isEnableConf(proxyOpts)) {
          reactData.tablePage.currentPage = 1
          $xeGantt.commitProxy('query').then((rest) => {
            $xeGantt.dispatchEvent('proxy-query', rest, params.$event)
          })
        }
      }
    },
    filterChangeEvent (params: VxeTableDefines.ClearAllFilterEventParams) {
      const $xeGantt = this

      $xeGantt.handleFilterEvent(params)
      $xeGantt.dispatchEvent('filter-change', params, params.$event)
    },
    clearAllFilterEvent (params: VxeTableDefines.ClearAllFilterEventParams) {
      const $xeGantt = this

      $xeGantt.handleFilterEvent(params)
      $xeGantt.dispatchEvent('clear-all-filter', params, params.$event)
    },
    submitFormEvent (params: VxeFormDefines.SubmitEventParams) {
      const $xeGantt = this
      const props = $xeGantt
      const reactData = $xeGantt.reactData

      const { proxyConfig } = props
      const proxyOpts = $xeGantt.computeProxyOpts
      if (reactData.tableLoading) {
        return
      }
      if (proxyConfig && isEnableConf(proxyOpts)) {
        $xeGantt.commitProxy('reload').then((rest) => {
          $xeGantt.dispatchEvent('proxy-query', { ...rest, isReload: true }, params.$event)
        })
      }
      $xeGantt.dispatchEvent('form-submit', params, params.$event)
    },
    resetFormEvent (params: VxeFormDefines.ResetEventParams) {
      const $xeGantt = this
      const props = $xeGantt

      const $xeTable = $xeGantt.$refs.refTable as VxeTableConstructor & VxeTablePrivateMethods
      const { proxyConfig } = props
      const { $event } = params
      const proxyOpts = $xeGantt.computeProxyOpts
      if (proxyConfig && isEnableConf(proxyOpts)) {
        $xeTable.clearScroll()
        $xeGantt.commitProxy('reload').then((rest) => {
          $xeGantt.dispatchEvent('proxy-query', { ...rest, isReload: true }, $event)
        })
      }
      $xeGantt.dispatchEvent('form-reset', params, $event)
    },
    submitInvalidEvent (params: VxeFormDefines.SubmitInvalidEventParams) {
      const $xeGantt = this

      $xeGantt.dispatchEvent('form-submit-invalid', params, params.$event)
    },
    collapseEvent (params: VxeFormDefines.CollapseEventParams) {
      const $xeGantt = this

      const { $event } = params
      $xeGantt.dispatchEvent('form-toggle-collapse', params, $event)
      $xeGantt.dispatchEvent('form-collapse', params, $event)
    },
    handleZoom (isMax?: boolean) {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      const { isZMax } = reactData
      if (isMax ? !isZMax : isZMax) {
        reactData.isZMax = !isZMax
        if (reactData.tZindex < getLastZIndex()) {
          reactData.tZindex = nextZIndex()
        }
      }
      return $xeGantt.$nextTick()
        .then(() => $xeGantt.recalculate(true))
        .then(() => {
          setTimeout(() => $xeGantt.recalculate(true), 15)
          return reactData.isZMax
        })
    },
    dragSplitEvent (evnt: MouseEvent) {
      const $xeGantt = this

      const el = $xeGantt.$refs.refElem as HTMLDivElement
      if (!el) {
        return
      }
      const ganttContainerEl = $xeGantt.$refs.refGanttContainerElem as HTMLDivElement
      if (!ganttContainerEl) {
        return
      }
      const tableWrapperEl = $xeGantt.$refs.refTableWrapper as HTMLDivElement
      if (!tableWrapperEl) {
        return
      }
      const rsSplitLineEl = $xeGantt.$refs.refResizableSplitTip as HTMLDivElement
      if (!rsSplitLineEl) {
        return
      }
      const taskViewOpts = $xeGantt.computeTaskViewOpts
      const containerRect = ganttContainerEl.getBoundingClientRect()
      const rsSplitTipEl = rsSplitLineEl.children[0] as HTMLDivElement
      const disX = evnt.clientX
      const ganttWidth = ganttContainerEl.clientWidth
      const tableWidth = tableWrapperEl.clientWidth
      const tableMinWidth = (taskViewOpts.tableStyle && XEUtils.toNumber(taskViewOpts.tableStyle.minWidth)) || 80
      let targetTableWidth = tableWidth
      let offsetLeft = -1
      addClass(el, 'is--split-drag')

      const handleReStyle = (evnt: MouseEvent) => {
        const rsNumLeftEl = rsSplitTipEl.children[0] as HTMLDivElement
        const rsNumRightEl = rsSplitTipEl.children[1] as HTMLDivElement
        let tipHeight = 0
        if (rsNumLeftEl) {
          if (offsetLeft < 0) {
            rsNumLeftEl.style.display = 'none'
          } else {
            rsNumLeftEl.textContent = `${targetTableWidth}px`
            rsNumLeftEl.style.display = 'block'
            tipHeight = rsNumLeftEl.offsetHeight
          }
        }
        if (rsNumRightEl) {
          if (offsetLeft < 0) {
            rsNumRightEl.textContent = `${Math.floor(containerRect.width - targetTableWidth)}px`
            rsNumRightEl.style.display = 'block'
            tipHeight = rsNumRightEl.offsetHeight
          } else {
            rsNumRightEl.style.display = 'none'
          }
        }
        const tipTop = evnt.clientY - containerRect.top - tipHeight / 2
        rsSplitLineEl.style.left = `${targetTableWidth}px`
        rsSplitTipEl.style.top = `${Math.min(containerRect.height - tipHeight - 1, Math.max(1, tipTop))}px`
      }

      document.onmousemove = (evnt) => {
        evnt.preventDefault()
        offsetLeft = (evnt.clientX - disX)
        targetTableWidth = Math.min(ganttWidth - 80, Math.max(tableMinWidth, tableWidth + offsetLeft))
        handleReStyle(evnt)
      }
      document.onmouseup = () => {
        document.onmousemove = null
        document.onmouseup = null
        rsSplitLineEl.style.display = ''
        tableWrapperEl.style.width = `${targetTableWidth}px`
        removeClass(el, 'is--split-drag')
        const $xeTable = $xeGantt.$refs.refTable as VxeTableConstructor & VxeTablePrivateMethods
        if ($xeTable) {
          $xeTable.recalculate(true)
        }
      }
      rsSplitLineEl.style.display = 'block'
      handleReStyle(evnt)
    },
    handleSplitLeftViewEvent () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      reactData.showLeftView = !reactData.showLeftView
    },
    handleSplitRightViewEvent () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      reactData.showRightView = !reactData.showRightView
    },
    getDefaultFormData () {
      const $xeGantt = this

      const formOpts = $xeGantt.computeFormOpts
      if (formOpts.items) {
        const fData: any = {}
        formOpts.items.forEach(item => {
          const { field, itemRender } = item
          if (field) {
            let itemValue: any = null
            if (itemRender) {
              const { defaultValue } = itemRender
              if (XEUtils.isFunction(defaultValue)) {
                itemValue = defaultValue({ item })
              } else if (!XEUtils.isUndefined(defaultValue)) {
                itemValue = defaultValue
              }
            }
            fData[field] = itemValue
          }
        })
        return fData
      }
      return {}
    },
    initProxy () {
      const $xeGantt = this
      const props = $xeGantt
      const reactData = $xeGantt.reactData

      const { proxyConfig, formConfig } = props
      const { proxyInited } = reactData
      const proxyOpts = $xeGantt.computeProxyOpts
      const formOpts = $xeGantt.computeFormOpts
      if (proxyConfig) {
        if (isEnableConf(formConfig) && proxyOpts.form && formOpts.items) {
          reactData.formData = $xeGantt.getDefaultFormData()
        }
        if (!proxyInited && proxyOpts.autoLoad !== false) {
          reactData.proxyInited = true
          $xeGantt.$nextTick().then(() => $xeGantt.commitProxy('initial')).then((rest) => {
            $xeGantt.dispatchEvent('proxy-query', { ...rest, isInited: true }, new Event('initial'))
          })
        }
      }
    },
    handleGlobalKeydownEvent (evnt: KeyboardEvent) {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      const zoomOpts = $xeGantt.computeZoomOpts
      const isEsc = globalEvents.hasKey(evnt, GLOBAL_EVENT_KEYS.ESCAPE)
      if (isEsc && reactData.isZMax && zoomOpts.escRestore !== false) {
        $xeGantt.triggerZoomEvent(evnt)
      }
    },
    getEl () {
      const $xeGantt = this

      return $xeGantt.$refs.refElem as HTMLDivElement
    },
    /**
       * 提交指令，支持 code 或 button
       * @param {String/Object} code 字符串或对象
       */
    commitProxy (proxyTarget: string | VxeToolbarPropTypes.ButtonConfig, ...args: any[]): Promise<any> {
      const $xeGantt = this
      const props = $xeGantt
      const reactData = $xeGantt.reactData

      /**
       * 已废弃
       * @deprecated
       */
      const toolbar = (props as any).toolbar

      const { proxyConfig, toolbarConfig, pagerConfig, editRules, validConfig } = props
      const { tablePage } = reactData
      const isActiveMsg = $xeGantt.computeIsActiveMsg
      const isRespMsg = $xeGantt.computeIsRespMsg
      const proxyOpts = $xeGantt.computeProxyOpts
      const pagerOpts = $xeGantt.computePagerOpts
      const toolbarOpts = $xeGantt.computeToolbarOpts
      const { beforeQuery, afterQuery, beforeDelete, afterDelete, beforeSave, afterSave, ajax = {} } = proxyOpts
      const resConfigs = proxyOpts.response || proxyOpts.props || {}
      const $xeTable = $xeGantt.$refs.refTable as VxeTableConstructor & VxeTablePrivateMethods
      let formData = $xeGantt.getFormData()
      let button: VxeToolbarPropTypes.ButtonConfig | null = null
      let code: string | null = null
      if (XEUtils.isString(proxyTarget)) {
        const { buttons } = toolbarOpts
        const matchObj = (toolbarConfig || toolbar) && isEnableConf(toolbarOpts) && buttons ? XEUtils.findTree(buttons, (item) => item.code === proxyTarget, { children: 'dropdowns' }) : null
        button = matchObj ? matchObj.item as any : null
        code = proxyTarget
      } else {
        button = proxyTarget
        code = button.code as string
      }
      const btnParams = button ? button.params : null
      switch (code) {
        case 'insert':
          return $xeTable.insert({})
        case 'insert_edit':
          return $xeTable.insert({}).then(({ row }) => $xeTable.setEditRow(row, true))

          // 已废弃
        case 'insert_actived':
          return $xeTable.insert({}).then(({ row }) => $xeTable.setEditRow(row, true))
          // 已废弃

        case 'mark_cancel':
          $xeGantt.triggerPendingEvent(code)
          break
        case 'remove':
          return $xeGantt.handleDeleteRow(code, 'vxe.grid.removeSelectRecord', () => $xeTable.removeCheckboxRow())
        case 'import':
          $xeTable.importData(btnParams)
          break
        case 'open_import':
          $xeTable.openImport(btnParams)
          break
        case 'export':
          $xeTable.exportData(btnParams)
          break
        case 'open_export':
          $xeTable.openExport(btnParams)
          break
        case 'reset_custom':
          $xeTable.resetCustom(true)
          break
        case 'initial':
        case 'reload':
        case 'query': {
          const ajaxMethods = ajax.query
          const querySuccessMethods = ajax.querySuccess
          const queryErrorMethods = ajax.queryError
          if (ajaxMethods) {
            const isInited = code === 'initial'
            const isReload = code === 'reload'
            if (!isInited && reactData.tableLoading) {
              return $xeGantt.$nextTick()
            }
            let sortList: any[] = []
            let filterList: VxeTableDefines.FilterCheckedParams[] = []
            let pageParams: any = {}
            if (pagerConfig) {
              if (isInited || isReload) {
                tablePage.currentPage = 1
              }
              if (isEnableConf(pagerConfig)) {
                pageParams = { ...tablePage }
              }
            }
            if (isInited) {
              // 重置代理表单数据
              if (proxyConfig && isEnableConf(proxyOpts) && proxyOpts.form) {
                formData = $xeGantt.getDefaultFormData()
                reactData.formData = formData
              }
              if ($xeTable) {
                const tableInternalData = $xeTable as unknown as TableInternalData
                const { tableFullColumn, fullColumnFieldData } = tableInternalData
                const sortOpts = $xeTable.computeSortOpts
                let defaultSort = sortOpts.defaultSort
                tableFullColumn.forEach((column) => {
                  column.order = null
                })
                // 如果使用默认排序
                if (defaultSort) {
                  if (!XEUtils.isArray(defaultSort)) {
                    defaultSort = [defaultSort]
                  }
                  sortList = defaultSort.map((item) => {
                    const { field, order } = item
                    const colRest = fullColumnFieldData[field]
                    if (colRest) {
                      const column = colRest.column
                      if (column) {
                        column.order = order
                      }
                    }
                    return {
                      field,
                      property: field,
                      order
                    }
                  })
                }
                filterList = $xeTable.getCheckedFilters()
              }
            } else {
              if ($xeTable) {
                if (isReload) {
                  $xeTable.clearAll()
                } else {
                  sortList = $xeTable.getSortColumns()
                  filterList = $xeTable.getCheckedFilters()
                }
              }
            }
            const commitParams = {
              $table: $xeTable,
              $grid: null,
              $gantt: $xeGantt,
              code,
              button,
              isInited,
              isReload,
              page: pageParams,
              sort: sortList.length ? sortList[0] : {},
              sorts: sortList,
              filters: filterList,
              form: formData,
              options: ajaxMethods
            }
            reactData.sortData = sortList
            reactData.filterData = filterList
            reactData.tableLoading = true
            const applyArgs = [commitParams].concat(args)
            return Promise.resolve((beforeQuery || ajaxMethods)(...applyArgs))
              .then(rest => {
                let tableData: any[] = []
                reactData.tableLoading = false
                if (rest) {
                  if (pagerConfig && isEnableConf(pagerOpts)) {
                    const totalProp = resConfigs.total
                    const total = (XEUtils.isFunction(totalProp) ? totalProp({ data: rest, $table: $xeTable, $grid: null, $gantt: $xeGantt }) : XEUtils.get(rest, totalProp || 'page.total')) || 0
                    tablePage.total = XEUtils.toNumber(total)
                    const resultProp = resConfigs.result
                    tableData = (XEUtils.isFunction(resultProp) ? resultProp({ data: rest, $table: $xeTable, $grid: null, $gantt: $xeGantt }) : XEUtils.get(rest, resultProp || 'result')) || []
                    // 检验当前页码，不能超出当前最大页数
                    const pageCount = Math.max(Math.ceil(total / tablePage.pageSize), 1)
                    if (tablePage.currentPage > pageCount) {
                      tablePage.currentPage = pageCount
                    }
                  } else {
                    const listProp = resConfigs.list
                    tableData = (listProp ? (XEUtils.isFunction(listProp) ? listProp({ data: rest, $table: $xeTable, $grid: null, $gantt: $xeGantt }) : XEUtils.get(rest, listProp)) : rest) || []
                  }
                }
                if ($xeTable as any) {
                  $xeTable.loadData(tableData)
                } else {
                  $xeTable.$nextTick(() => {
                    if ($xeTable) {
                      $xeTable.loadData(tableData)
                    }
                  })
                }
                if (afterQuery) {
                  afterQuery(...applyArgs)
                }
                if (querySuccessMethods) {
                  querySuccessMethods({ ...commitParams, response: rest })
                }
                return { status: true }
              }).catch((rest) => {
                reactData.tableLoading = false
                if (queryErrorMethods) {
                  queryErrorMethods({ ...commitParams, response: rest })
                }
                return { status: false }
              })
          } else {
            errLog('vxe.error.notFunc', ['proxy-config.ajax.query'])
          }
          break
        }
        case 'delete': {
          const ajaxMethods = ajax.delete
          const deleteSuccessMethods = ajax.deleteSuccess
          const deleteErrorMethods = ajax.deleteError
          if (ajaxMethods) {
            const selectRecords = $xeTable.getCheckboxRecords()
            const removeRecords = selectRecords.filter((row) => !$xeTable.isInsertByRow(row))
            const body = { removeRecords }
            const commitParams = {
              $table: $xeTable,
              $grid: null,
              $gantt: $xeGantt,
              code,
              button,
              body,
              form: formData,
              options: ajaxMethods
            }
            const applyArgs = [commitParams].concat(args)
            if (selectRecords.length) {
              return $xeGantt.handleDeleteRow(code, 'vxe.grid.deleteSelectRecord', () => {
                if (!removeRecords.length) {
                  return $xeTable.remove(selectRecords)
                }
                reactData.tableLoading = true
                return Promise.resolve((beforeDelete || ajaxMethods)(...applyArgs))
                  .then(rest => {
                    reactData.tableLoading = false
                    $xeTable.setPendingRow(removeRecords, false)
                    if (isRespMsg) {
                      // 检测弹窗模块
                      if (!VxeUI.modal) {
                        errLog('vxe.error.reqModule', ['Modal'])
                      }
                      VxeUI.modal.message({ content: $xeGantt.getRespMsg(rest, 'vxe.grid.delSuccess'), status: 'success' })
                    }
                    if (afterDelete) {
                      afterDelete(...applyArgs)
                    } else {
                      $xeGantt.commitProxy('query')
                    }
                    if (deleteSuccessMethods) {
                      deleteSuccessMethods({ ...commitParams, response: rest })
                    }
                    return { status: true }
                  })
                  .catch(rest => {
                    reactData.tableLoading = false
                    if (isRespMsg) {
                      // 检测弹窗模块
                      if (!VxeUI.modal) {
                        errLog('vxe.error.reqModule', ['Modal'])
                      }
                      VxeUI.modal.message({ id: code, content: $xeGantt.getRespMsg(rest, 'vxe.grid.operError'), status: 'error' })
                    }
                    if (deleteErrorMethods) {
                      deleteErrorMethods({ ...commitParams, response: rest })
                    }
                    return { status: false }
                  })
              })
            } else {
              if (isActiveMsg) {
                // 检测弹窗模块
                if (!VxeUI.modal) {
                  errLog('vxe.error.reqModule', ['Modal'])
                }
                VxeUI.modal.message({ id: code, content: getI18n('vxe.grid.selectOneRecord'), status: 'warning' })
              }
            }
          } else {
            errLog('vxe.error.notFunc', ['proxy-config.ajax.delete'])
          }
          break
        }
        case 'save': {
          const ajaxMethods = ajax.save
          const saveSuccessMethods = ajax.saveSuccess
          const saveErrorMethods = ajax.saveError
          if (ajaxMethods) {
            const body = $xeGantt.getRecordset()
            const { insertRecords, removeRecords, updateRecords, pendingRecords } = body
            const commitParams = {
              $table: $xeTable,
              $grid: null,
              $gantt: $xeGantt,
              code,
              button,
              body,
              form: formData,
              options: ajaxMethods
            }
            const applyArgs = [commitParams].concat(args)
            // 排除掉新增且标记为删除的数据
            if (insertRecords.length) {
              body.pendingRecords = pendingRecords.filter((row) => insertRecords.indexOf(row) === -1)
            }
            // 排除已标记为删除的数据
            if (pendingRecords.length) {
              body.insertRecords = insertRecords.filter((row) => pendingRecords.indexOf(row) === -1)
            }
            let restPromise: Promise<any> = Promise.resolve()
            if (editRules) {
              // 只校验新增和修改的数据
              restPromise = $xeGantt[validConfig && validConfig.msgMode === 'full' ? 'fullValidate' : 'validate'](body.insertRecords.concat(updateRecords))
            }
            return restPromise.then((errMap: any) => {
              if (errMap) {
                // 如果校验不通过
                return
              }
              if (body.insertRecords.length || removeRecords.length || updateRecords.length || body.pendingRecords.length) {
                reactData.tableLoading = true
                return Promise.resolve((beforeSave || ajaxMethods)(...applyArgs))
                  .then(rest => {
                    reactData.tableLoading = false
                    $xeTable.clearPendingRow()
                    if (isRespMsg) {
                      // 检测弹窗模块
                      if (!VxeUI.modal) {
                        errLog('vxe.error.reqModule', ['Modal'])
                      }
                      VxeUI.modal.message({ content: $xeGantt.getRespMsg(rest, 'vxe.grid.saveSuccess'), status: 'success' })
                    }
                    if (afterSave) {
                      afterSave(...applyArgs)
                    } else {
                      $xeGantt.commitProxy('query')
                    }
                    if (saveSuccessMethods) {
                      saveSuccessMethods({ ...commitParams, response: rest })
                    }
                    return { status: true }
                  })
                  .catch(rest => {
                    reactData.tableLoading = false
                    if (isRespMsg) {
                      // 检测弹窗模块
                      if (!VxeUI.modal) {
                        errLog('vxe.error.reqModule', ['Modal'])
                      }
                      VxeUI.modal.message({ id: code, content: $xeGantt.getRespMsg(rest, 'vxe.grid.operError'), status: 'error' })
                    }
                    if (saveErrorMethods) {
                      saveErrorMethods({ ...commitParams, response: rest })
                    }
                    return { status: false }
                  })
              } else {
                if (isActiveMsg) {
                  // 检测弹窗模块
                  if (!VxeUI.modal) {
                    errLog('vxe.error.reqModule', ['Modal'])
                  }
                  VxeUI.modal.message({ id: code, content: getI18n('vxe.grid.dataUnchanged'), status: 'info' })
                }
              }
            })
          } else {
            errLog('vxe.error.notFunc', ['proxy-config.ajax.save'])
          }
          break
        }
        default: {
          const gCommandOpts = commands.get(code)
          if (gCommandOpts) {
            const tCommandMethod = gCommandOpts.tableCommandMethod || gCommandOpts.commandMethod
            if (tCommandMethod) {
              tCommandMethod({ code, button, $grid: null, $table: $xeTable, $gantt: $xeGantt }, ...args)
            } else {
              errLog('vxe.error.notCommands', [code])
            }
          }
        }
      }
      return $xeGantt.$nextTick()
    },
    getParams () {
      const $xeGantt = this
      const props = $xeGantt

      return props.params
    },
    zoom () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      if (reactData.isZMax) {
        return $xeGantt.revert()
      }
      return $xeGantt.maximize()
    },
    isMaximized () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      return reactData.isZMax
    },
    maximize () {
      const $xeGantt = this

      return $xeGantt.handleZoom(true)
    },
    revert () {
      const $xeGantt = this

      return $xeGantt.handleZoom()
    },
    getFormData () {
      const $xeGantt = this
      const props = $xeGantt
      const reactData = $xeGantt.reactData

      const { proxyConfig } = props
      const { formData } = reactData
      const proxyOpts = $xeGantt.computeProxyOpts
      const formOpts = $xeGantt.computeFormOpts
      return proxyConfig && isEnableConf(proxyOpts) && proxyOpts.form ? formData : formOpts.data
    },
    getFormItems (itemIndex?: number): any {
      const $xeGantt = this
      const props = $xeGantt

      const formOpts = $xeGantt.computeFormOpts
      const { formConfig } = props
      const { items } = formOpts
      const itemList: VxeFormItemProps[] = []
      XEUtils.eachTree(formConfig && isEnableConf(formOpts) && items ? items : [], item => {
        itemList.push(item)
      }, { children: 'children' })
      return XEUtils.isUndefined(itemIndex) ? itemList : itemList[itemIndex]
    },
    resetForm () {
      const $xeGantt = this

      const $form = $xeGantt.$refs.refForm as VxeFormInstance
      if ($form) {
        return $form.reset()
      }
      return $xeGantt.$nextTick()
    },
    validateForm () {
      const $xeGantt = this

      const $form = $xeGantt.$refs.refForm as VxeFormInstance
      if ($form) {
        return $form.validate()
      }
      return $xeGantt.$nextTick()
    },
    validateFormField (field: VxeFormItemPropTypes.Field | VxeFormItemPropTypes.Field[] | VxeFormDefines.ItemInfo | VxeFormDefines.ItemInfo[] | null) {
      const $xeGantt = this

      const $form = $xeGantt.$refs.refForm as VxeFormInstance
      if ($form) {
        return $form.validateField(field)
      }
      return $xeGantt.$nextTick()
    },
    clearFormValidate (field?: VxeFormItemPropTypes.Field | VxeFormItemPropTypes.Field[] | VxeFormDefines.ItemInfo | VxeFormDefines.ItemInfo[] | null) {
      const $xeGantt = this

      const $form = $xeGantt.$refs.refForm as VxeFormInstance
      if ($form) {
        return $form.clearValidate(field)
      }
      return $xeGantt.$nextTick()
    },
    homePage () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      const { tablePage } = reactData
      tablePage.currentPage = 1
      return $xeGantt.$nextTick()
    },
    homePageByEvent (evnt: Event) {
      const $xeGantt = this

      const $pager = $xeGantt.$refs.refPager as VxePagerInstance
      if ($pager) {
        $pager.homePageByEvent(evnt)
      }
    },
    endPage () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      const { tablePage } = reactData
      const pageCount = $xeGantt.computePageCount
      tablePage.currentPage = pageCount
      return $xeGantt.$nextTick()
    },
    endPageByEvent (evnt: Event) {
      const $xeGantt = this

      const $pager = $xeGantt.$refs.refPager as VxePagerInstance
      if ($pager) {
        $pager.endPageByEvent(evnt)
      }
    },
    setCurrentPage (currentPage: number | string | null | undefined) {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      const { tablePage } = reactData
      const pageCount = $xeGantt.computePageCount
      tablePage.currentPage = Math.min(pageCount, Math.max(1, XEUtils.toNumber(currentPage)))
      return $xeGantt.$nextTick()
    },
    setCurrentPageByEvent (evnt: Event, currentPage: number | string | null | undefined) {
      const $xeGantt = this

      const $pager = $xeGantt.$refs.refPager as VxePagerInstance
      if ($pager) {
        $pager.setCurrentPageByEvent(evnt, currentPage)
      }
    },
    setPageSize (pageSize: number | string | null | undefined) {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      const { tablePage } = reactData
      tablePage.pageSize = Math.max(1, XEUtils.toNumber(pageSize))
      return $xeGantt.$nextTick()
    },
    setPageSizeByEvent (evnt: Event, pageSize: number | string | null | undefined) {
      const $xeGantt = this

      const $pager = $xeGantt.$refs.refPager as VxePagerInstance
      if ($pager) {
        $pager.setPageSizeByEvent(evnt, pageSize)
      }
    },
    getProxyInfo () {
      const $xeGantt = this
      const props = $xeGantt
      const $xeTable = $xeGantt.$refs.refTable as VxeTableConstructor & VxeTablePrivateMethods
      const reactData = $xeGantt.reactData

      if (props.proxyConfig) {
        const { sortData } = reactData
        return {
          data: $xeTable ? $xeTable.getFullData() : [],
          filter: reactData.filterData,
          form: $xeGantt.getFormData(),
          sort: sortData.length ? sortData[0] : {},
          sorts: sortData,
          pager: reactData.tablePage,
          pendingRecords: $xeTable ? $xeTable.getPendingRecords() : []
        }
      }
      return null
    },
    refreshTaskView () {
      const $xeGantt = this

      const $ganttView = $xeGantt.$refs.refGanttView as VxeGanttViewInstance
      if ($ganttView) {
        return $ganttView.refreshData()
      }
      return $xeGantt.$nextTick()
    },
    hasTableViewVisible () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      return reactData.showLeftView
    },
    showTableView () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      reactData.showLeftView = true
      return $xeGantt.$nextTick()
    },
    hideTableView () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      reactData.showLeftView = false
      return $xeGantt.$nextTick()
    },
    hasTaskViewVisible () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      return reactData.showRightView
    },
    showTaskView () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      reactData.showRightView = true
      return $xeGantt.$nextTick()
    },
    hideTaskView () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      reactData.showRightView = false
      return $xeGantt.$nextTick()
    },
    callSlot (slotFunc: any, params: any, h: CreateElement) {
      const $xeGantt = this
      const slots = $xeGantt.$scopedSlots

      if (slotFunc) {
        if (XEUtils.isString(slotFunc)) {
          slotFunc = slots[slotFunc] || null
        }
        if (XEUtils.isFunction(slotFunc)) {
          return getSlotVNs(slotFunc.call(this, params, h))
        }
      }
      return []
    },
    /**
     * 获取需要排除的高度
     */
    getExcludeHeight () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      const { isZMax } = reactData
      const el = $xeGantt.$refs.refElem as HTMLDivElement
      if (el) {
        const formWrapper = $xeGantt.$refs.refFormWrapper as HTMLDivElement
        const toolbarWrapper = $xeGantt.$refs.refToolbarWrapper as HTMLDivElement
        const topWrapper = $xeGantt.$refs.refTopWrapper as HTMLDivElement
        const bottomWrapper = $xeGantt.$refs.refBottomWrapper as HTMLDivElement
        const pagerWrapper = $xeGantt.$refs.refPagerWrapper as HTMLDivElement
        const parentEl = el.parentElement as HTMLElement
        const parentPaddingSize = isZMax ? 0 : (parentEl ? getPaddingTopBottomSize(parentEl) : 0)
        return parentPaddingSize + getPaddingTopBottomSize(el) + getOffsetHeight(formWrapper) + getOffsetHeight(toolbarWrapper) + getOffsetHeight(topWrapper) + getOffsetHeight(bottomWrapper) + getOffsetHeight(pagerWrapper)
      }
      return 0
    },
    getParentHeight () {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      const el = $xeGantt.$refs.refElem as HTMLDivElement
      if (el) {
        const parentEl = el.parentElement as HTMLElement
        return (reactData.isZMax ? getDomNode().visibleHeight : (parentEl ? XEUtils.toNumber(getComputedStyle(parentEl).height) : 0)) - $xeGantt.getExcludeHeight()
      }
      return 0
    },
    triggerToolbarCommitEvent (params: any, evnt: any) {
      const $xeGantt = this

      const { code } = params
      return $xeGantt.commitProxy(params, evnt).then((rest) => {
        if (code && rest && rest.status && ['query', 'reload', 'delete', 'save'].includes(code)) {
          $xeGantt.dispatchEvent(code === 'delete' || code === 'save' ? `proxy-${code as 'delete' | 'save'}` : 'proxy-query', { ...rest, isReload: code === 'reload' }, evnt)
        }
      })
    },
    triggerToolbarBtnEvent (button: any, evnt: any) {
      const $xeGantt = this

      $xeGantt.triggerToolbarCommitEvent(button, evnt)
      $xeGantt.dispatchEvent('toolbar-button-click', { code: button.code, button }, evnt)
    },
    triggerToolbarTolEvent (tool: any, evnt: any) {
      const $xeGantt = this

      $xeGantt.triggerToolbarCommitEvent(tool, evnt)
      $xeGantt.dispatchEvent('toolbar-tool-click', { code: tool.code, tool }, evnt)
    },
    triggerZoomEvent (evnt: Event) {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      $xeGantt.zoom()
      $xeGantt.dispatchEvent('zoom', { type: reactData.isZMax ? 'max' : 'revert' }, evnt)
    },
    handleTaskCellClickEvent (evnt: MouseEvent, params: VxeGanttDefines.TaskCellClickParams) {
      const $xeGantt = this
      const $xeTable = $xeGantt.$refs.refTable as VxeTableConstructor & VxeTablePrivateMethods

      if ($xeTable) {
        const tableProps = $xeTable
        const { highlightCurrentRow } = tableProps
        const tableReactData = $xeTable as unknown as TableReactData
        const { radioColumn, checkboxColumn } = tableReactData
        const radioOpts = $xeTable.computeRadioOpts
        const checkboxOpts = $xeTable.computeCheckboxOpts
        const rowOpts = $xeTable.computeRowOpts
        const { row } = params
        // 如果是当前行
        if (rowOpts.isCurrent || highlightCurrentRow) {
          $xeTable.triggerCurrentRowEvent(evnt, Object.assign({
            $table: $xeTable,
            rowIndex: $xeTable.getRowIndex(row),
            $rowIndex: $xeTable.getVMRowIndex(row)
          }, params))
        }
        // 如果是单选框
        if ((radioColumn && radioOpts.trigger === 'row')) {
          $xeTable.triggerRadioRowEvent(evnt, params)
        }
        // 如果是复选框
        if ((checkboxColumn && checkboxOpts.trigger === 'row')) {
          $xeTable.handleToggleCheckRowEvent(evnt, params)
        }
      }
      $xeGantt.dispatchEvent('task-cell-click', params, evnt)
    },
    handleTaskCellDblclickEvent (evnt: MouseEvent, params: VxeGanttDefines.TaskCellClickParams) {
      const $xeGantt = this

      $xeGantt.dispatchEvent('task-cell-dblclick', params, evnt)
    },
    handleTaskBarClickEvent (evnt: MouseEvent, params: VxeGanttDefines.TaskCellClickParams) {
      const $xeGantt = this

      $xeGantt.dispatchEvent('task-bar-click', params, evnt)
    },
    handleTaskBarDblclickEvent (evnt: MouseEvent, params: VxeGanttDefines.TaskCellClickParams) {
      const $xeGantt = this

      $xeGantt.dispatchEvent('task-bar-dblclick', params, evnt)
    },
    loadColumn (columns: any[]) {
      const $xeGantt = this
      const slots = $xeGantt.$scopedSlots
      const $xeTable = $xeGantt.$refs.refTable as VxeTableConstructor & VxeTablePrivateMethods

      XEUtils.eachTree(columns, column => {
        const { type } = column
        if (column.slots) {
          XEUtils.each(column.slots, (func) => {
            if (!XEUtils.isFunction(func)) {
              if (!slots[func]) {
                errLog('vxe.error.notSlot', [func])
              }
            }
          })
        }
        if (type === 'expand') {
          errLog('vxe.error.errProp', ['type=expand', 'type=seq,radio,checkbox,html'])
        }
      })
      return $xeTable.loadColumn(columns)
    },
    reloadColumn (columns: any[]) {
      const $xeGantt = this

      $xeGantt.clearAll()
      return $xeGantt.loadColumn(columns)
    },
    getConfigSlot (slotConfigs?: Record<string, any>) {
      const $xeGantt = this
      const slots = $xeGantt.$scopedSlots

      const slotConf: Record<string, any> = {}
      XEUtils.objectMap(slotConfigs, (slotFunc, slotKey) => {
        if (slotFunc) {
          if (XEUtils.isString(slotFunc)) {
            if (slots[slotFunc]) {
              slotConf[slotKey] = slots[slotFunc]
            } else {
              errLog('vxe.error.notSlot', [slotFunc])
            }
          } else {
            slotConf[slotKey] = slotFunc
          }
        }
      })
      return slotConf
    },
    getToolbarSlots () {
      const $xeGantt = this
      const slots = $xeGantt.$scopedSlots

      const toolbarOpts = $xeGantt.computeToolbarOpts
      const toolbarOptSlots = toolbarOpts.slots
      const toolbarSlots: {
        buttons?(params: any): any
        buttonPrefix?(params: any): any
        buttonSuffix?(params: any): any
        tools?(params: any): any
        toolPrefix?(params: any): any
        toolSuffix?(params: any): any
      } = {}
      if (slots.buttons && (!toolbarOptSlots || toolbarOptSlots.buttons !== 'buttons')) {
        warnLog('vxe.error.reqProp', ['toolbar-config.slots.buttons'])
      }
      if (slots.tools && (!toolbarOptSlots || toolbarOptSlots.tools !== 'tools')) {
        warnLog('vxe.error.reqProp', ['toolbar-config.slots.tools'])
      }
      if (toolbarOptSlots) {
        const buttonsSlot = $xeGantt.getFuncSlot(toolbarOptSlots, 'buttons')
        const buttonPrefixSlot = $xeGantt.getFuncSlot(toolbarOptSlots, 'buttonPrefix')
        const buttonSuffixSlot = $xeGantt.getFuncSlot(toolbarOptSlots, 'buttonSuffix')
        const toolsSlot = $xeGantt.getFuncSlot(toolbarOptSlots, 'tools')
        const toolPrefixSlot = $xeGantt.getFuncSlot(toolbarOptSlots, 'toolPrefix')
        const toolSuffixSlot = $xeGantt.getFuncSlot(toolbarOptSlots, 'toolSuffix')
        if (buttonsSlot) {
          toolbarSlots.buttons = buttonsSlot
        }
        if (buttonPrefixSlot) {
          toolbarSlots.buttonPrefix = buttonPrefixSlot
        }
        if (buttonSuffixSlot) {
          toolbarSlots.buttonSuffix = buttonSuffixSlot
        }
        if (toolsSlot) {
          toolbarSlots.tools = toolsSlot
        }
        if (toolPrefixSlot) {
          toolbarSlots.toolPrefix = toolPrefixSlot
        }
        if (toolSuffixSlot) {
          toolbarSlots.toolSuffix = toolSuffixSlot
        }
      }
      return toolbarSlots
    },
    getFuncSlot (optSlots: any, slotKey: any) {
      const $xeGantt = this
      const slots = $xeGantt.$scopedSlots

      const funcSlot = optSlots[slotKey]
      if (funcSlot) {
        if (XEUtils.isString(funcSlot)) {
          if (slots[funcSlot]) {
            return slots[funcSlot]
          } else {
            errLog('vxe.error.notSlot', [funcSlot])
          }
        } else {
          return funcSlot
        }
      }
      return null
    },

    //
    // Render
    //
    renderDefaultForm (h: CreateElement) {
      const VxeUIFormComponent = VxeUI.getComponent('VxeForm')

      const $xeGantt = this
      const props = $xeGantt
      const slots = $xeGantt.$scopedSlots
      const reactData = $xeGantt.reactData

      const { proxyConfig, formConfig } = props
      const { formData } = reactData
      const proxyOpts = $xeGantt.computeProxyOpts
      const formOpts = $xeGantt.computeFormOpts
      if (isEnableConf(formConfig) && formOpts.items && formOpts.items.length) {
        const formSlots: any = {}
        if (!(formOpts as any).inited) {
          (formOpts as any).inited = true
          const beforeItem = proxyOpts.beforeItem
          if (proxyOpts && beforeItem) {
            formOpts.items.forEach((item) => {
              beforeItem.call($xeGantt, { $grid: $xeGantt, $gantt: null, item })
            })
          }
        }
        // 处理插槽
        formOpts.items.forEach((item) => {
          XEUtils.each(item.slots, (func) => {
            if (!XEUtils.isFunction(func)) {
              if (slots[func]) {
                formSlots[func] = slots[func]
              }
            }
          })
        })
        return [
          VxeUIFormComponent
            ? h(VxeUIFormComponent, {
              props: Object.assign({}, formOpts, {
                data: proxyConfig && proxyOpts.form ? formData : formOpts.data
              }),
              on: {
                submit: $xeGantt.submitFormEvent,
                reset: $xeGantt.resetFormEvent,
                collapse: $xeGantt.collapseEvent,
                'submit-invalid': $xeGantt.submitInvalidEvent
              },
              scopedSlots: formSlots
            })
            : renderEmptyElement($xeGantt)
        ]
      }
      return []
    },
    renderForm (h: CreateElement) {
      const $xeGantt = this
      const props = $xeGantt
      const slots = $xeGantt.$scopedSlots

      const { formConfig } = props
      const formSlot = slots.form
      const hasForm = !!(formSlot || isEnableConf(formConfig))

      if (hasForm) {
        return h('div', {
          key: 'form',
          ref: 'refFormWrapper',
          class: 'vxe-gantt--form-wrapper'
        }, formSlot ? formSlot.call($xeGantt, { $grid: null, $gantt: $xeGantt }) : $xeGantt.renderDefaultForm(h))
      }
      return renderEmptyElement($xeGantt)
    },
    renderToolbar (h: CreateElement) {
      const VxeUIToolbarComponent = VxeUI.getComponent('VxeToolbar')

      const $xeGantt = this
      const props = $xeGantt
      const slots = $xeGantt.$scopedSlots

      const { toolbarConfig } = props
      const toolbarSlot = slots.toolbar
      const toolbarOpts = $xeGantt.computeToolbarOpts

      if ((toolbarConfig && isEnableConf(toolbarOpts)) || toolbarSlot) {
        return h('div', {
          key: 'toolbar',
          ref: 'refToolbarWrapper',
          class: 'vxe-gantt--toolbar-wrapper'
        }, toolbarSlot
          ? toolbarSlot.call($xeGantt, { $grid: null, $gantt: $xeGantt })
          : [
              h(VxeUIToolbarComponent, {
                props: Object.assign({}, toolbarOpts, { slots: undefined }),
                ref: 'refToolbar',
                scopedSlots: $xeGantt.getToolbarSlots()
              })
            ]
        )
      }
      return renderEmptyElement($xeGantt)
    },
    renderTop (h: CreateElement) {
      const $xeGantt = this
      const slots = $xeGantt.$scopedSlots

      const topSlot = slots.top
      return topSlot
        ? h('div', {
          key: 'top',
          ref: 'refTopWrapper',
          class: 'vxe-gantt--top-wrapper'
        }, topSlot.call($xeGantt, { $grid: null, $gantt: $xeGantt }))
        : renderEmptyElement($xeGantt)
    },
    renderTableLeft (h: CreateElement) {
      const $xeGantt = this
      const slots = $xeGantt.$scopedSlots

      const leftSlot = slots.left
      if (leftSlot) {
        return h('div', {
          class: 'vxe-gantt--left-wrapper'
        }, leftSlot({ $grid: null, $gantt: $xeGantt }))
      }
      return renderEmptyElement($xeGantt)
    },
    renderTableRight (h: CreateElement) {
      const $xeGantt = this
      const slots = $xeGantt.$scopedSlots

      const rightSlot = slots.right
      if (rightSlot) {
        return h('div', {
          class: 'vxe-gantt--right-wrapper'
        }, rightSlot({ $grid: null, $gantt: $xeGantt }))
      }
      return renderEmptyElement($xeGantt)
    },
    renderTable (h: CreateElement) {
      const $xeGantt = this
      const slots = $xeGantt.$scopedSlots

      const tableProps = $xeGantt.computeTableProps
      return h('div', {
        ref: 'refTableWrapper',
        class: 'vxe-gantt--table-wrapper'
      }, [
        h(VxeTableComponent as Component, {
          key: 'table',
          props: tableProps,
          on: getTableOns($xeGantt as VxeGanttConstructor),
          scopedSlots: slots,
          ref: 'refTable'
        })
      ])
    },
    renderBottom (h: CreateElement) {
      const $xeGantt = this
      const slots = $xeGantt.$scopedSlots

      const bottomSlot = slots.bottom
      return bottomSlot
        ? h('div', {
          key: 'bottom',
          ref: 'refBottomWrapper',
          class: 'vxe-gantt--bottom-wrapper'
        }, bottomSlot.call($xeGantt, { $grid: null, $gantt: $xeGantt }))
        : renderEmptyElement($xeGantt)
    },
    renderPager (h: CreateElement) {
      const VxeUIPagerComponent = VxeUI.getComponent('VxePager')

      const $xeGantt = this
      const props = $xeGantt
      const slots = $xeGantt.$scopedSlots
      const reactData = $xeGantt.reactData

      const { proxyConfig, pagerConfig } = props
      const proxyOpts = $xeGantt.computeProxyOpts
      const pagerOpts = $xeGantt.computePagerOpts
      const pagerSlot = slots.pager
      if ((pagerConfig && isEnableConf(pagerOpts)) || slots.pager) {
        return h('div', {
          ref: 'refPagerWrapper',
          key: 'pager',
          class: 'vxe-gantt--pager-wrapper'
        }, pagerSlot
          ? pagerSlot.call($xeGantt, { $grid: null, $gantt: $xeGantt })
          : [
              VxeUIPagerComponent
                ? h(VxeUIPagerComponent, {
                  ref: 'refPager',
                  props: {
                    ...pagerOpts,
                    ...(proxyConfig && isEnableConf(proxyOpts) ? reactData.tablePage : {})
                  },
                  on: {
                    'page-change': $xeGantt.pageChangeEvent
                  },
                  scopedSlots: $xeGantt.getConfigSlot(pagerOpts.slots)
                })
                : renderEmptyElement($xeGantt)
            ])
      }
      return renderEmptyElement($xeGantt)
    },
    /**
     * 渲染任务视图
     */
    renderTaskView (h: CreateElement) {
      return h('div', {
        ref: 'refGanttWrapper',
        class: 'vxe-gantt--view-wrapper'
      }, [
        h(GanttViewComponent, {
          ref: 'refGanttView'
        })
      ])
    },
    renderSplitBar (h: CreateElement) {
      const $xeGantt = this
      const reactData = $xeGantt.reactData

      const { showLeftView, showRightView } = reactData
      const taskSplitOpts = $xeGantt.computeTaskSplitOpts
      const { enabled, resize, showCollapseTableButton, showCollapseTaskButton } = taskSplitOpts
      if (!enabled) {
        return renderEmptyElement($xeGantt)
      }
      const isResize = resize && showLeftView && showRightView
      const ons: {
        mousedown?: any
      } = {}
      if (isResize) {
        ons.mousedown = $xeGantt.dragSplitEvent
      }
      return h('div', {
        class: ['vxe-gantt--view-split-bar', {
          'is--resize': isResize
        }]
      }, [
        h('div', {
          class: 'vxe-gantt--view-split-bar-handle',
          on: ons
        }),
        showCollapseTableButton || showCollapseTaskButton
          ? h('div', {
            class: 'vxe-gantt--view-split-bar-btn-wrapper'
          }, [
            showCollapseTableButton && showRightView
              ? h('div', {
                class: 'vxe-gantt--view-split-bar-left-btn',
                on: {
                  click: $xeGantt.handleSplitLeftViewEvent
                }
              }, [
                h('i', {
                  class: showLeftView ? getIcon().GANTT_VIEW_LEFT_OPEN : getIcon().GANTT_VIEW_LEFT_CLOSE
                })
              ])
              : renderEmptyElement($xeGantt),
            showCollapseTaskButton && showLeftView
              ? h('div', {
                class: 'vxe-gantt--view-split-bar-right-btn',
                on: {
                  click: $xeGantt.handleSplitRightViewEvent
                }
              }, [
                h('i', {
                  class: showRightView ? getIcon().GANTT_VIEW_RIGHT_OPEN : getIcon().GANTT_VIEW_RIGHT_CLOSE
                })
              ])
              : renderEmptyElement($xeGantt)
          ])
          : renderEmptyElement($xeGantt)
      ])
    },
    renderChildLayout (h: CreateElement, layoutKeys: VxeGanttDefines.LayoutKey[]) {
      const $xeGantt = this

      const childVNs: VNode[] = []
      layoutKeys.forEach(key => {
        switch (key) {
          case 'Form':
            childVNs.push($xeGantt.renderForm(h))
            break
          case 'Toolbar':
            childVNs.push($xeGantt.renderToolbar(h))
            break
          case 'Top':
            childVNs.push($xeGantt.renderTop(h))
            break
          case 'Gantt':
            childVNs.push(
              h('div', {
                ref: 'refGanttContainerElem',
                key: 'tv',
                class: 'vxe-gantt--gantt-container'
              }, [
                $xeGantt.renderTableLeft(h),
                $xeGantt.renderTable(h),
                $xeGantt.renderSplitBar(h),
                $xeGantt.renderTaskView(h),
                $xeGantt.renderTableRight(h),
                h('div', {
                  ref: 'refClassifyWrapperElem'
                }),
                h('div', {
                  ref: 'refResizableSplitTip',
                  class: 'vxe-gantt--resizable-split-tip'
                }, [
                  h('div', {
                    class: 'vxe-gantt--resizable-split-tip-number'
                  }, [
                    h('div', {
                      class: 'vxe-gantt--resizable-split-number-left'
                    }),
                    h('div', {
                      class: 'vxe-gantt--resizable-split-number-right'
                    })
                  ])
                ]),
                h('div', {
                  class: 'vxe-gantt--border-line'
                })
              ])
            )
            break
          case 'Bottom':
            childVNs.push($xeGantt.renderBottom(h))
            break
          case 'Pager':
            childVNs.push($xeGantt.renderPager(h))
            break
          default:
            errLog('vxe.error.notProp', [`layouts -> ${key}`])
            break
        }
      })
      return childVNs
    },
    renderLayout (h: CreateElement) {
      const $xeGantt = this
      const slots = $xeGantt.$scopedSlots

      const currLayoutConf = $xeGantt.computeCurrLayoutConf
      const { headKeys, bodyKeys, footKeys } = currLayoutConf
      const asideLeftSlot = slots.asideLeft || slots['aside-left']
      const asideRightSlot = slots.asideRight || slots['aside-right']
      return [
        h('div', {
          class: 'vxe-gantt--layout-header-wrapper'
        }, $xeGantt.renderChildLayout(h, headKeys)),
        h('div', {
          class: 'vxe-gantt--layout-body-wrapper'
        }, [
          asideLeftSlot
            ? h('div', {
              class: 'vxe-gantt--layout-aside-left-wrapper'
            }, asideLeftSlot({}))
            : renderEmptyElement($xeGantt),
          h('div', {
            class: 'vxe-gantt--layout-body-content-wrapper'
          }, $xeGantt.renderChildLayout(h, bodyKeys)),
          asideRightSlot
            ? h('div', {
              class: 'vxe-gantt--layout-aside-right-wrapper'
            }, asideRightSlot({}))
            : renderEmptyElement($xeGantt)
        ]),
        h('div', {
          class: 'vxe-gantt--layout-footer-wrapper'
        }, $xeGantt.renderChildLayout(h, footKeys))
      ]
    },
    renderVN (h: CreateElement): VNode {
      const $xeGantt = this
      const props = $xeGantt
      const reactData = $xeGantt.reactData

      const { showLeftView, showRightView } = reactData
      const vSize = $xeGantt.computeSize
      const styles = $xeGantt.computeStyles
      const isLoading = $xeGantt.computeIsLoading
      const tableBorder = $xeGantt.computeTableBorder
      const scrollbarXToTop = $xeGantt.computeScrollbarXToTop
      const scrollbarYToLeft = $xeGantt.computeScrollbarYToLeft
      return h('div', {
        ref: 'refElem',
        class: ['vxe-gantt', `border--${tableBorder}`, `sx-pos--${scrollbarXToTop ? 'top' : 'bottom'}`, `sy-pos--${scrollbarYToLeft ? 'left' : 'right'}`, {
          [`size--${vSize}`]: vSize,
          'is--round': props.round,
          'is--maximize': reactData.isZMax,
          'is--loading': isLoading,
          'show--left': showLeftView,
          'show--right': showRightView
        }],
        style: styles
      }, $xeGantt.renderLayout(h))
    }
  },
  created () {
    // 使用已安装的组件，如果未安装则不渲染
    const VxeUIFormComponent = VxeUI.getComponent('VxeForm')
    const VxeUIPagerComponent = VxeUI.getComponent('VxePager')
    const VxeUIToolbarComponent = VxeUI.getComponent('VxeToolbar')

    const $xeGantt = this
    const props = $xeGantt

    const proxyOpts = $xeGantt.computeProxyOpts

    if ((props as any).toolbar) {
      errLog('vxe.error.delProp', ['grid.toolbar', 'grid.toolbar-config'])
    }
    if (props.toolbarConfig && !XEUtils.isObject(props.toolbarConfig)) {
      errLog('vxe.error.errProp', [`grid.toolbar-config=${props.toolbarConfig}`, 'grid.toolbar-config={}'])
    }
    if (proxyOpts.props) {
      warnLog('vxe.error.delProp', ['proxy-config.props', 'proxy-config.response'])
    }
    if (props.expandConfig) {
      warnLog('vxe.error.notProp', ['expand-config'])
    }
    if (props.aggregateConfig) {
      warnLog('vxe.error.notProp', ['aggregate-config'])
    }

    $xeGantt.$nextTick(() => {
      if (props.formConfig) {
        if (!VxeUIFormComponent) {
          errLog('vxe.error.reqComp', ['vxe-form'])
        }
      }
      if (props.pagerConfig) {
        if (!VxeUIPagerComponent) {
          errLog('vxe.error.reqComp', ['vxe-pager'])
        }
      }
      if (props.toolbarConfig) {
        if (!VxeUIToolbarComponent) {
          errLog('vxe.error.reqComp', ['vxe-toolbar'])
        }
      }
    })

    $xeGantt.handleTaskScaleConfig()
    $xeGantt.initPages()
  },
  mounted () {
    const $xeGantt = this
    const props = $xeGantt

    const { columns } = props
    if (columns && columns.length) {
      $xeGantt.loadColumn(columns)
    }
    $xeGantt.initToolbar()
    $xeGantt.initProxy()
    $xeGantt.initGanttView()
    globalEvents.on($xeGantt, 'keydown', $xeGantt.handleGlobalKeydownEvent)
  },
  destroyed () {
    const $xeGantt = this
    const internalData = $xeGantt.internalData

    globalEvents.off($xeGantt, 'keydown')
    XEUtils.assign(internalData, createInternalData())
  },
  render (this: any, h) {
    return this.renderVN(h)
  }
}) /* define-vxe-component end */
