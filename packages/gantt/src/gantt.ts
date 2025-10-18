import { h, ref, PropType, computed, provide, reactive, onUnmounted, watch, nextTick, VNode, onMounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import XEUtils from 'xe-utils'
import { getLastZIndex, nextZIndex, isEnableConf } from '../../ui/src/utils'
import { getOffsetHeight, getPaddingTopBottomSize, getDomNode, toCssUnit, addClass, removeClass } from '../../ui/src/dom'
import { getSlotVNs } from '../../ui/src/vn'
import { VxeUI } from '@vxe-ui/core'
import { ganttEmits } from './emits'
import { tableEmits } from './table-emits'
import { warnLog, errLog } from '../../ui/src/log'
import GanttViewComponent from './gantt-view'
import { VxeTable as VxeTableComponent } from 'vxe-table'

import type { VxeGanttConstructor, VxeGanttEmits, GanttReactData, GanttInternalData, VxeGanttPropTypes, GanttMethods, GanttPrivateMethods, VxeGanttPrivateMethods, GanttPrivateRef, VxeGanttProps, VxeGanttPrivateComputed, VxeGanttViewInstance, VxeGanttDefines } from '../../../types'
import type { ValueOf, VxeFormEvents, VxeFormInstance, VxePagerEvents, VxeFormItemProps, VxePagerInstance, VxeComponentStyleType } from 'vxe-pc-ui'
import type { VxeTableMethods, VxeToolbarPropTypes, VxeTableProps, VxeTablePropTypes, VxeTableConstructor, VxeTablePrivateMethods, VxeTableEvents, VxeTableDefines, VxeTableEventProps, VxeToolbarInstance, VxeGridPropTypes } from 'vxe-table'

const { getConfig, getIcon, getI18n, commands, hooks, useFns, createEvent, globalEvents, GLOBAL_EVENT_KEYS, renderEmptyElement } = VxeUI

const tableProps = (VxeTableComponent as any).props

const tableComponentPropKeys = Object.keys(tableProps) as (keyof VxeTableProps)[]
const tableComponentMethodKeys: (keyof VxeTableMethods)[] = ['clearAll', 'syncData', 'updateData', 'loadData', 'reloadData', 'reloadRow', 'loadColumn', 'reloadColumn', 'getRowNode', 'getColumnNode', 'getRowIndex', 'getVTRowIndex', 'getVMRowIndex', 'getColumnIndex', 'getVTColumnIndex', 'getVMColumnIndex', 'setRow', 'createData', 'createRow', 'revertData', 'clearData', 'isRemoveByRow', 'isInsertByRow', 'isUpdateByRow', 'getColumns', 'getColumnById', 'getColumnByField', 'getTableColumn', 'getFullColumns', 'getData', 'getCheckboxRecords', 'getParentRow', 'getTreeRowChildren', 'getTreeRowLevel', 'getTreeParentRow', 'getRowSeq', 'getRowById', 'getRowid', 'getTableData', 'getFullData', 'setColumnFixed', 'clearColumnFixed', 'setColumnWidth', 'getColumnWidth', 'recalcRowHeight', 'setRowHeightConf', 'getRowHeightConf', 'setRowHeight', 'getRowHeight', 'hideColumn', 'showColumn', 'resetColumn', 'refreshColumn', 'refreshScroll', 'recalculate', 'closeTooltip', 'isAllCheckboxChecked', 'isAllCheckboxIndeterminate', 'getCheckboxIndeterminateRecords', 'setCheckboxRow', 'setCheckboxRowKey', 'isCheckedByCheckboxRow', 'isCheckedByCheckboxRowKey', 'isIndeterminateByCheckboxRow', 'isIndeterminateByCheckboxRowKey', 'toggleCheckboxRow', 'setAllCheckboxRow', 'getRadioReserveRecord', 'clearRadioReserve', 'getCheckboxReserveRecords', 'clearCheckboxReserve', 'toggleAllCheckboxRow', 'clearCheckboxRow', 'setCurrentRow', 'isCheckedByRadioRow', 'isCheckedByRadioRowKey', 'setRadioRow', 'setRadioRowKey', 'clearCurrentRow', 'clearRadioRow', 'getCurrentRecord', 'getRadioRecord', 'getCurrentColumn', 'setCurrentColumn', 'clearCurrentColumn', 'setPendingRow', 'togglePendingRow', 'hasPendingByRow', 'isPendingByRow', 'getPendingRecords', 'clearPendingRow', 'setFilterByEvent', 'sort', 'setSort', 'setSortByEvent', 'clearSort', 'clearSortByEvent', 'isSort', 'getSortColumns', 'closeFilter', 'isFilter', 'clearFilterByEvent', 'isActiveFilterByColumn', 'isRowExpandLoaded', 'clearRowExpandLoaded', 'reloadRowExpand', 'reloadRowExpand', 'toggleRowExpand', 'setAllRowExpand', 'setRowExpand', 'isExpandByRow', 'isRowExpandByRow', 'clearRowExpand', 'clearRowExpandReserve', 'getRowExpandRecords', 'getTreeExpandRecords', 'isTreeExpandLoaded', 'clearTreeExpandLoaded', 'reloadTreeExpand', 'reloadTreeChilds', 'toggleTreeExpand', 'setAllTreeExpand', 'setTreeExpand', 'isTreeExpandByRow', 'clearTreeExpand', 'clearTreeExpandReserve', 'getScroll', 'scrollTo', 'scrollToRow', 'scrollToColumn', 'clearScroll', 'updateFooter', 'updateStatus', 'setMergeCells', 'removeInsertRow', 'removeMergeCells', 'getMergeCells', 'clearMergeCells', 'setMergeFooterItems', 'removeMergeFooterItems', 'getMergeFooterItems', 'clearMergeFooterItems', 'getCustomStoreData', 'setRowGroupExpand', 'setRowGroupExpandByField', 'setAllRowGroupExpand', 'clearRowGroupExpand', 'isRowGroupExpandByRow', 'isRowGroupRecord', 'isAggregateRecord', 'isAggregateExpandByRow', 'getAggregateContentByRow', 'getAggregateRowChildren', 'setRowGroups', 'clearRowGroups', 'openTooltip', 'moveColumnTo', 'moveRowTo', 'getCellLabel', 'getCellElement', 'focus', 'blur', 'connect']

const defaultLayouts: VxeGanttPropTypes.Layouts = [['Form'], ['Toolbar', 'Top', 'Gantt', 'Bottom', 'Pager']]

function createInternalData (): GanttInternalData {
  return {
    resizeTableWidth: 0
  }
}

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

export default defineVxeComponent({
  name: 'VxeGantt',
  mixins: [],
  props: {
    ...(tableProps as {
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
    taskResizeConfig: Object as PropType<VxeGanttPropTypes.TaskResizeConfig>,
    taskDragConfig: Object as PropType<VxeGanttPropTypes.TaskDragConfig>,
    size: {
      type: String as PropType<VxeGridPropTypes.Size>,
      default: () => getConfig().gantt.size || getConfig().size
    }
  },
  emits: ganttEmits,
  setup (props, context) {
    const { slots, emit } = context

    const xID = XEUtils.uniqueId()

    // 使用已安装的组件，如果未安装则不渲染
    const VxeUIFormComponent = VxeUI.getComponent('VxeForm')
    const VxeUIPagerComponent = VxeUI.getComponent('VxePager')
    const VxeTableComponent = VxeUI.getComponent('VxeTable')
    const VxeToolbarComponent = VxeUI.getComponent('VxeToolbar')

    const { computeSize } = useFns.useSize(props)

    const reactData = reactive<GanttReactData>({
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
    })

    const internalData = createInternalData()

    const refElem = ref<HTMLDivElement>()
    const refTable = ref<VxeTableConstructor & VxeTablePrivateMethods>()
    const refForm = ref<VxeFormInstance>()
    const refToolbar = ref<VxeToolbarInstance>()
    const refPager = ref<VxePagerInstance>()
    const refGanttContainerElem = ref<HTMLDivElement>()
    const refClassifyWrapperElem = ref<HTMLDivElement>()
    const refGanttView = ref<VxeGanttViewInstance>()

    const refPopupContainerElem = ref<HTMLDivElement>()

    const refFormWrapper = ref<HTMLDivElement>()
    const refToolbarWrapper = ref<HTMLDivElement>()
    const refTopWrapper = ref<HTMLDivElement>()
    const refBottomWrapper = ref<HTMLDivElement>()
    const refPagerWrapper = ref<HTMLDivElement>()
    const refTableWrapper = ref<HTMLDivElement>()
    const refGanttWrapper = ref<HTMLDivElement>()

    const refResizableSplitTip = ref<HTMLDivElement>()

    const extendTableMethods = <T>(methodKeys: T[]) => {
      const funcs: any = {}
      methodKeys.forEach(name => {
        funcs[name] = (...args: any[]) => {
          const $xeTable: any = refTable.value
          if ($xeTable && $xeTable[name]) {
            return $xeTable[name](...args)
          }
        }
      })
      return funcs
    }

    const ganttExtendTableMethods = extendTableMethods(tableComponentMethodKeys) as VxeTableMethods

    tableComponentMethodKeys.forEach(name => {
      ganttExtendTableMethods[name] = (...args: any[]) => {
        const $xeTable: any = refTable.value
        if ($xeTable && $xeTable[name]) {
          return $xeTable && $xeTable[name](...args)
        }
      }
    })

    const computeProxyOpts = computed(() => {
      return XEUtils.merge({}, XEUtils.clone(getConfig().gantt.proxyConfig, true), props.proxyConfig)
    })

    const computeIsRespMsg = computed(() => {
      const proxyOpts = computeProxyOpts.value
      return !!(XEUtils.isBoolean(proxyOpts.message) ? proxyOpts.message : proxyOpts.showResponseMsg)
    })

    const computeIsActiveMsg = computed(() => {
      const proxyOpts = computeProxyOpts.value
      return XEUtils.isBoolean(proxyOpts.showActionMsg) ? proxyOpts.showActionMsg : !!proxyOpts.showActiveMsg
    })

    const computePagerOpts = computed(() => {
      return Object.assign({}, getConfig().gantt.pagerConfig, props.pagerConfig)
    })

    const computeFormOpts = computed(() => {
      return Object.assign({}, getConfig().gantt.formConfig, props.formConfig)
    })

    const computeToolbarOpts = computed(() => {
      return Object.assign({}, getConfig().gantt.toolbarConfig, props.toolbarConfig)
    })

    const computeZoomOpts = computed(() => {
      return Object.assign({}, getConfig().gantt.zoomConfig, props.zoomConfig)
    })

    const computeTaskOpts = computed(() => {
      return Object.assign({}, getConfig().gantt.taskConfig, props.taskConfig)
    })

    const computeTaskViewScaleMapsOpts = computed(() => {
      return XEUtils.merge({}, getConfig().gantt.taskViewScaleConfs, props.taskViewScaleConfs)
    })

    const computeTaskViewOpts = computed(() => {
      return Object.assign({}, getConfig().gantt.taskViewConfig, props.taskViewConfig)
    })

    const computeTaskBarOpts = computed(() => {
      return Object.assign({}, getConfig().gantt.taskBarConfig, props.taskBarConfig)
    })

    const computeTaskSplitOpts = computed(() => {
      return Object.assign({}, getConfig().gantt.taskSplitConfig, props.taskSplitConfig)
    })

    const computeTaskScaleConfs = computed(() => {
      const taskViewOpts = computeTaskViewOpts.value
      const { scales } = taskViewOpts
      return scales
    })

    const computeTitleField = computed(() => {
      const taskOpts = computeTaskOpts.value
      return taskOpts.titleField || 'title'
    })

    const computeStartField = computed(() => {
      const taskOpts = computeTaskOpts.value
      return taskOpts.startField || 'start'
    })

    const computeEndField = computed(() => {
      const taskOpts = computeTaskOpts.value
      return taskOpts.endField || 'end'
    })

    const computeProgressField = computed(() => {
      const taskOpts = computeTaskOpts.value
      return taskOpts.progressField || 'progress'
    })

    const computeScrollbarOpts = computed(() => {
      return Object.assign({}, getConfig().gantt.scrollbarConfig, props.scrollbarConfig)
    })

    const computeScrollbarXToTop = computed(() => {
      const scrollbarOpts = computeScrollbarOpts.value
      return !!(scrollbarOpts.x && scrollbarOpts.x.position === 'top')
    })

    const computeScrollbarYToLeft = computed(() => {
      const scrollbarOpts = computeScrollbarOpts.value
      return !!(scrollbarOpts.y && scrollbarOpts.y.position === 'left')
    })

    const computeStyles = computed(() => {
      const { height, maxHeight } = props
      const { isZMax, tZindex } = reactData
      const taskViewOpts = computeTaskViewOpts.value
      const { tableStyle } = taskViewOpts
      const taskBarOpts = computeTaskBarOpts.value
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
    })

    const computeTableExtendProps = computed(() => {
      const rest: Record<string, any> = {}
      tableComponentPropKeys.forEach((key) => {
        rest[key] = (props as any)[key]
      })
      return rest
    })

    const computeTableProps = computed(() => {
      const { seqConfig, pagerConfig, editConfig, proxyConfig } = props
      const { isZMax, tablePage } = reactData
      const taskViewOpts = computeTaskViewOpts.value
      const { tableStyle } = taskViewOpts
      const tableExtendProps = computeTableExtendProps.value
      const proxyOpts = computeProxyOpts.value
      const pagerOpts = computePagerOpts.value
      const isLoading = computeIsLoading.value
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
    })

    const computeCurrLayoutConf = computed(() => {
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
    })

    const computeCustomCurrentPageFlag = computed(() => {
      const pagerOpts = computePagerOpts.value
      return pagerOpts.currentPage
    })

    const computeCustomPageSizeFlag = computed(() => {
      const pagerOpts = computePagerOpts.value
      return pagerOpts.pageSize
    })

    const computeCustomTotalFlag = computed(() => {
      const pagerOpts = computePagerOpts.value
      return pagerOpts.total
    })

    const computePageCount = computed(() => {
      const { tablePage } = reactData
      return Math.max(Math.ceil(tablePage.total / tablePage.pageSize), 1)
    })

    const computeIsLoading = computed(() => {
      const { loading, proxyConfig } = props
      const { tableLoading } = reactData
      const proxyOpts = computeProxyOpts.value
      const { showLoading } = proxyOpts
      return loading || (tableLoading && showLoading && proxyConfig && isEnableConf(proxyOpts))
    })

    const computeTableBorder = computed(() => {
      let { border } = props
      const taskViewOpts = computeTaskViewOpts.value
      const { viewStyle } = taskViewOpts
      if (viewStyle) {
        if (!XEUtils.eqNull(viewStyle.border)) {
          border = viewStyle.border
        }
      }
      if (border === true) {
        return 'full'
      }
      if (border) {
        return border
      }
      return 'default'
    })

    const refMaps: GanttPrivateRef = {
      refElem,
      refTable,
      refForm,
      refToolbar,
      refPager,
      refGanttContainerElem,
      refClassifyWrapperElem,
      refPopupContainerElem
    }

    const computeMaps: VxeGanttPrivateComputed = {
      computeProxyOpts,
      computePagerOpts,
      computeFormOpts,
      computeToolbarOpts,
      computeZoomOpts,
      computeTaskOpts,
      computeTaskViewScaleMapsOpts,
      computeTaskViewOpts,
      computeTaskBarOpts,
      computeTaskSplitOpts,
      computeTaskScaleConfs,
      computeTitleField,
      computeStartField,
      computeEndField,
      computeProgressField,
      computeScrollbarOpts,
      computeScrollbarXToTop,
      computeScrollbarYToLeft
    }

    const $xeGantt = {
      xID,
      props: props as VxeGanttProps,
      context,
      reactData,
      internalData,
      getRefMaps: () => refMaps,
      getComputeMaps: () => computeMaps
    } as VxeGanttConstructor & VxeGanttPrivateMethods

    const handleTaskScaleConfig = () => {
      const taskScaleConfs = computeTaskScaleConfs.value
      const taskViewScaleMapsOpts = computeTaskViewScaleMapsOpts.value
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
    }

    const initToolbar = () => {
      const toolbarOpts = computeToolbarOpts.value
      if (props.toolbarConfig && isEnableConf(toolbarOpts)) {
        nextTick(() => {
          const $xeTable = refTable.value
          const $xeToolbar = refToolbar.value
          if ($xeTable && $xeToolbar) {
            $xeTable.connectToolbar($xeToolbar)
          }
        })
      }
    }

    const initGanttView = () => {
      const $xeTable = refTable.value
      const $ganttView = refGanttView.value
      if ($xeTable && $ganttView) {
        $xeTable.handleConnectGanttView($ganttView)
      }
    }

    const getFormData = () => {
      const { proxyConfig } = props
      const { formData } = reactData
      const proxyOpts = computeProxyOpts.value
      const formOpts = computeFormOpts.value
      return proxyConfig && isEnableConf(proxyOpts) && proxyOpts.form ? formData : formOpts.data
    }

    const initPages = (propKey?: 'currentPage' | 'pageSize' | 'total') => {
      const { tablePage } = reactData
      const { pagerConfig } = props
      const pagerOpts = computePagerOpts.value
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
    }

    const triggerPendingEvent = (code: string) => {
      const isActiveMsg = computeIsActiveMsg.value
      const $xeTable = refTable.value
      const selectRecords = $xeTable ? $xeTable.getCheckboxRecords() : []
      if (selectRecords.length) {
        if ($xeTable) {
          $xeTable.togglePendingRow(selectRecords)
        }
        $xeGantt.clearCheckboxRow()
      } else {
        if (isActiveMsg) {
          if (VxeUI.modal) {
            VxeUI.modal.message({ id: code, content: getI18n('vxe.grid.selectOneRecord'), status: 'warning' })
          }
        }
      }
    }

    const getRespMsg = (rest: any, defaultMsg: string) => {
      const proxyOpts = computeProxyOpts.value
      const resConfigs = proxyOpts.response || proxyOpts.props || {}
      const messageProp = resConfigs.message
      const $xeTable = refTable.value
      let msg
      if (rest && messageProp) {
        msg = XEUtils.isFunction(messageProp) ? messageProp({ data: rest, $table: $xeTable as VxeTableConstructor, $grid: null, $gantt: $xeGantt }) : XEUtils.get(rest, messageProp)
      }
      return msg || getI18n(defaultMsg)
    }

    const handleDeleteRow = (code: string, alertKey: string, callback: () => void): Promise<void> => {
      const isActiveMsg = computeIsActiveMsg.value
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
    }

    const pageChangeEvent: VxePagerEvents.PageChange = (params) => {
      const { proxyConfig } = props
      const { tablePage } = reactData
      const { $event, currentPage, pageSize } = params
      const proxyOpts = computeProxyOpts.value
      tablePage.currentPage = currentPage
      tablePage.pageSize = pageSize
      $xeGantt.dispatchEvent('page-change', params, $event)
      if (proxyConfig && isEnableConf(proxyOpts)) {
        $xeGantt.commitProxy('query').then((rest) => {
          $xeGantt.dispatchEvent('proxy-query', rest, $event)
        })
      }
    }

    const handleSortEvent: VxeTableEvents.SortChange | VxeTableEvents.ClearAllSort = (params) => {
      const $xeTable = refTable.value
      const { proxyConfig } = props
      if (!$xeTable) {
        return
      }
      const { computeSortOpts } = $xeTable.getComputeMaps()
      const proxyOpts = computeProxyOpts.value
      const sortOpts = computeSortOpts.value
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
    }

    const sortChangeEvent: VxeTableEvents.SortChange = (params) => {
      handleSortEvent(params)
      $xeGantt.dispatchEvent('sort-change', params, params.$event)
    }

    const clearAllSortEvent: VxeTableEvents.ClearAllSort = (params) => {
      handleSortEvent(params)
      $xeGantt.dispatchEvent('clear-all-sort', params, params.$event)
    }

    const handleFilterEvent: VxeTableEvents.FilterChange | VxeTableEvents.ClearAllFilter = (params) => {
      const $xeTable = refTable.value
      const { proxyConfig } = props
      if (!$xeTable) {
        return
      }
      const { computeFilterOpts } = $xeTable.getComputeMaps()
      const proxyOpts = computeProxyOpts.value
      const filterOpts = computeFilterOpts.value
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
    }

    const filterChangeEvent: VxeTableEvents.FilterChange = (params) => {
      handleFilterEvent(params)
      $xeGantt.dispatchEvent('filter-change', params, params.$event)
    }

    const clearAllFilterEvent: VxeTableEvents.ClearAllFilter = (params) => {
      handleFilterEvent(params)
      $xeGantt.dispatchEvent('clear-all-filter', params, params.$event)
    }

    const submitFormEvent: VxeFormEvents.Submit = (params) => {
      const { proxyConfig } = props
      const proxyOpts = computeProxyOpts.value
      if (reactData.tableLoading) {
        return
      }
      if (proxyConfig && isEnableConf(proxyOpts)) {
        $xeGantt.commitProxy('reload').then((rest) => {
          $xeGantt.dispatchEvent('proxy-query', { ...rest, isReload: true }, params.$event)
        })
      }
      $xeGantt.dispatchEvent('form-submit', params, params.$event)
    }

    const resetFormEvent: VxeFormEvents.Reset = (params) => {
      const $xeTable = refTable.value
      const { proxyConfig } = props
      const { $event } = params
      const proxyOpts = computeProxyOpts.value
      if (proxyConfig && isEnableConf(proxyOpts)) {
        if ($xeTable) {
          $xeTable.clearScroll()
        }
        $xeGantt.commitProxy('reload').then((rest) => {
          $xeGantt.dispatchEvent('proxy-query', { ...rest, isReload: true }, $event)
        })
      }
      $xeGantt.dispatchEvent('form-reset', params, $event)
    }

    const submitInvalidEvent: VxeFormEvents.SubmitInvalid = (params) => {
      $xeGantt.dispatchEvent('form-submit-invalid', params, params.$event)
    }

    const collapseEvent: VxeFormEvents.Collapse = (params) => {
      const { $event } = params
      $xeGantt.dispatchEvent('form-toggle-collapse', params, $event)
      $xeGantt.dispatchEvent('form-collapse', params, $event)
    }

    const handleZoom = (isMax?: boolean) => {
      const { isZMax } = reactData
      if (isMax ? !isZMax : isZMax) {
        reactData.isZMax = !isZMax
        if (reactData.tZindex < getLastZIndex()) {
          reactData.tZindex = nextZIndex()
        }
      }
      return nextTick()
        .then(() => $xeGantt.recalculate(true))
        .then(() => {
          setTimeout(() => $xeGantt.recalculate(true), 15)
          return reactData.isZMax
        })
    }

    const getFuncSlot = (optSlots: any, slotKey: string) => {
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
    }

    const getConfigSlot = (slotConfigs?: Record<string, any>) => {
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
    }

    const dragSplitEvent = (evnt: MouseEvent) => {
      const el = refElem.value
      if (!el) {
        return
      }
      const ganttContainerEl = refGanttContainerElem.value
      if (!ganttContainerEl) {
        return
      }
      const tableWrapperEl = refTableWrapper.value
      if (!tableWrapperEl) {
        return
      }
      const rsSplitLineEl = refResizableSplitTip.value
      if (!rsSplitLineEl) {
        return
      }
      const taskViewOpts = computeTaskViewOpts.value
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
        const $xeTable = refTable.value
        if ($xeTable) {
          $xeTable.recalculate(true)
        }
      }
      rsSplitLineEl.style.display = 'block'
      handleReStyle(evnt)
    }

    const handleSplitLeftViewEvent = () => {
      reactData.showLeftView = !reactData.showLeftView
    }

    const handleSplitRightViewEvent = () => {
      reactData.showRightView = !reactData.showRightView
    }

    const tableCompEvents: VxeTableEventProps = {}
    tableEmits.forEach(name => {
      const type = XEUtils.camelCase(`on-${name}`) as keyof VxeTableEventProps
      tableCompEvents[type] = (...args: any[]) => emit(name, ...args)
    })

    const getDefaultFormData = () => {
      const formOpts = computeFormOpts.value
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
    }

    const initProxy = () => {
      const { proxyConfig, formConfig } = props
      const { proxyInited } = reactData
      const proxyOpts = computeProxyOpts.value
      const formOpts = computeFormOpts.value
      if (proxyConfig && isEnableConf(proxyOpts)) {
        if (formConfig && isEnableConf(formOpts) && proxyOpts.form && formOpts.items) {
          reactData.formData = getDefaultFormData()
        }
        if (!proxyInited) {
          reactData.proxyInited = true
          if (proxyOpts.autoLoad !== false) {
            nextTick().then(() => $xeGantt.commitProxy('initial')).then((rest) => {
              dispatchEvent('proxy-query', { ...rest, isInited: true }, new Event('initial'))
            })
          }
        }
      }
    }

    const handleGlobalKeydownEvent = (evnt: KeyboardEvent) => {
      const zoomOpts = computeZoomOpts.value
      const isEsc = globalEvents.hasKey(evnt, GLOBAL_EVENT_KEYS.ESCAPE)
      if (isEsc && reactData.isZMax && zoomOpts.escRestore !== false) {
        $xeGantt.triggerZoomEvent(evnt)
      }
    }

    const dispatchEvent = (type: ValueOf<VxeGanttEmits>, params: Record<string, any>, evnt: Event | null) => {
      emit(type, createEvent(evnt, { $grid: null, $gantt: $xeGantt }, params))
    }

    const ganttMethods: GanttMethods = {
      dispatchEvent,
      getEl () {
        return refElem.value as HTMLDivElement
      },
      /**
       * 提交指令，支持 code 或 button
       * @param {String/Object} code 字符串或对象
       */
      commitProxy (proxyTarget: string | VxeToolbarPropTypes.ButtonConfig, ...args: any[]) {
        const { proxyConfig, toolbarConfig, pagerConfig, editRules, validConfig } = props
        const { tablePage } = reactData
        const isActiveMsg = computeIsActiveMsg.value
        const isRespMsg = computeIsRespMsg.value
        const proxyOpts = computeProxyOpts.value
        const pagerOpts = computePagerOpts.value
        const toolbarOpts = computeToolbarOpts.value
        const { beforeQuery, afterQuery, beforeDelete, afterDelete, beforeSave, afterSave, ajax = {} } = proxyOpts
        const resConfigs = proxyOpts.response || proxyOpts.props || {}
        const $xeTable = refTable.value
        if (!$xeTable) {
          return nextTick()
        }
        let formData = getFormData()
        let button: VxeToolbarPropTypes.ButtonConfig | null = null
        let code: string | null = null
        if (XEUtils.isString(proxyTarget)) {
          const { buttons } = toolbarOpts
          const matchObj = toolbarConfig && isEnableConf(toolbarOpts) && buttons ? XEUtils.findTree(buttons, (item) => item.code === proxyTarget, { children: 'dropdowns' }) : null
          button = matchObj ? matchObj.item : null
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
            triggerPendingEvent(code)
            break
          case 'remove':
            return handleDeleteRow(code, 'vxe.grid.removeSelectRecord', () => $xeTable.removeCheckboxRow())
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
            return $xeTable.resetCustom(true)
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
                return nextTick()
              }
              let sortList: any[] = []
              let filterList: VxeTableDefines.FilterCheckedParams[] = []
              let pageParams: any = {}
              if (pagerConfig) {
                if (isInited || isReload) {
                  // 重置分页
                  tablePage.currentPage = 1
                }
                if (isEnableConf(pagerOpts)) {
                  pageParams = { ...tablePage }
                }
              }
              if (isInited) {
                // 重置代理表单数据
                if (proxyConfig && isEnableConf(proxyOpts) && proxyOpts.form) {
                  formData = getDefaultFormData()
                  reactData.formData = formData
                }
                if ($xeTable) {
                  const tableInternalData = $xeTable.internalData
                  const { tableFullColumn, fullColumnFieldData } = tableInternalData
                  const { computeSortOpts } = $xeTable.getComputeMaps()
                  const sortOpts = computeSortOpts.value
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
              return Promise.resolve((beforeQuery || ajaxMethods)(commitParams, ...args))
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
                    nextTick(() => {
                      if ($xeTable) {
                        $xeTable.loadData(tableData)
                      }
                    })
                  }
                  if (afterQuery) {
                    afterQuery(commitParams, ...args)
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
              const selectRecords = $xeGantt.getCheckboxRecords()
              const removeRecords = selectRecords.filter(row => !$xeTable.isInsertByRow(row))
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
              if (selectRecords.length) {
                return handleDeleteRow(code, 'vxe.grid.deleteSelectRecord', () => {
                  if (!removeRecords.length) {
                    return $xeTable.remove(selectRecords)
                  }
                  reactData.tableLoading = true
                  return Promise.resolve((beforeDelete || ajaxMethods)(commitParams, ...args))
                    .then(rest => {
                      reactData.tableLoading = false
                      $xeTable.setPendingRow(removeRecords, false)
                      if (isRespMsg) {
                        if (VxeUI.modal) {
                          VxeUI.modal.message({ content: getRespMsg(rest, 'vxe.grid.delSuccess'), status: 'success' })
                        }
                      }
                      if (afterDelete) {
                        afterDelete(commitParams, ...args)
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
                        if (VxeUI.modal) {
                          VxeUI.modal.message({ id: code, content: getRespMsg(rest, 'vxe.grid.operError'), status: 'error' })
                        }
                      }
                      if (deleteErrorMethods) {
                        deleteErrorMethods({ ...commitParams, response: rest })
                      }
                      return { status: false }
                    })
                })
              } else {
                if (isActiveMsg) {
                  if (VxeUI.modal) {
                    VxeUI.modal.message({ id: code, content: getI18n('vxe.grid.selectOneRecord'), status: 'warning' })
                  }
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
              const body = $xeTable.getRecordset()
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
              // 排除掉新增且标记为删除的数据
              if (insertRecords.length) {
                body.pendingRecords = pendingRecords.filter((row) => $xeTable.findRowIndexOf(insertRecords, row) === -1)
              }
              // 排除已标记为删除的数据
              if (pendingRecords.length) {
                body.insertRecords = insertRecords.filter((row) => $xeTable.findRowIndexOf(pendingRecords, row) === -1)
              }
              let restPromise: Promise<any> = Promise.resolve()
              if (editRules) {
                // 只校验新增和修改的数据
                restPromise = $xeTable[validConfig && validConfig.msgMode === 'full' ? 'fullValidate' : 'validate'](body.insertRecords.concat(updateRecords))
              }
              return restPromise.then((errMap) => {
                if (errMap) {
                  // 如果校验不通过
                  return
                }
                if (body.insertRecords.length || removeRecords.length || updateRecords.length || body.pendingRecords.length) {
                  reactData.tableLoading = true
                  return Promise.resolve((beforeSave || ajaxMethods)(commitParams, ...args))
                    .then(rest => {
                      reactData.tableLoading = false
                      $xeTable.clearPendingRow()
                      if (isRespMsg) {
                        if (VxeUI.modal) {
                          VxeUI.modal.message({ content: getRespMsg(rest, 'vxe.grid.saveSuccess'), status: 'success' })
                        }
                      }
                      if (afterSave) {
                        afterSave(commitParams, ...args)
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
                        if (VxeUI.modal) {
                          VxeUI.modal.message({ id: code, content: getRespMsg(rest, 'vxe.grid.operError'), status: 'error' })
                        }
                      }
                      if (saveErrorMethods) {
                        saveErrorMethods({ ...commitParams, response: rest })
                      }
                      return { status: false }
                    })
                } else {
                  if (isActiveMsg) {
                    if (VxeUI.modal) {
                      VxeUI.modal.message({ id: code, content: getI18n('vxe.grid.dataUnchanged'), status: 'info' })
                    }
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
                tCommandMethod({ code, button, $table: $xeTable, $grid: null, $gantt: $xeGantt }, ...args)
              } else {
                errLog('vxe.error.notCommands', [code])
              }
            }
          }
        }
        return nextTick()
      },
      getParams () {
        return props.params
      },
      zoom () {
        if (reactData.isZMax) {
          return $xeGantt.revert()
        }
        return $xeGantt.maximize()
      },
      isMaximized () {
        return reactData.isZMax
      },
      maximize () {
        return handleZoom(true)
      },
      revert () {
        return handleZoom()
      },
      getFormData,
      getFormItems (itemIndex?: number): any {
        const formOpts = computeFormOpts.value
        const { formConfig } = props
        const { items } = formOpts
        const itemList: VxeFormItemProps[] = []
        XEUtils.eachTree(formConfig && isEnableConf(formOpts) && items ? items : [], item => {
          itemList.push(item)
        }, { children: 'children' })
        return XEUtils.isUndefined(itemIndex) ? itemList : itemList[itemIndex]
      },
      resetForm () {
        const $form = refForm.value
        if ($form) {
          return $form.reset()
        }
        return nextTick()
      },
      validateForm () {
        const $form = refForm.value
        if ($form) {
          return $form.validate()
        }
        return nextTick()
      },
      validateFormField (field) {
        const $form = refForm.value
        if ($form) {
          return $form.validateField(field)
        }
        return nextTick()
      },
      clearFormValidate (field) {
        const $form = refForm.value
        if ($form) {
          return $form.clearValidate(field)
        }
        return nextTick()
      },
      homePage () {
        const { tablePage } = reactData
        tablePage.currentPage = 1
        return nextTick()
      },
      homePageByEvent (evnt) {
        const $pager = refPager.value
        if ($pager) {
          $pager.homePageByEvent(evnt)
        }
      },
      endPage () {
        const { tablePage } = reactData
        const pageCount = computePageCount.value
        tablePage.currentPage = pageCount
        return nextTick()
      },
      endPageByEvent (evnt) {
        const $pager = refPager.value
        if ($pager) {
          $pager.endPageByEvent(evnt)
        }
      },
      setCurrentPage (currentPage) {
        const { tablePage } = reactData
        const pageCount = computePageCount.value
        tablePage.currentPage = Math.min(pageCount, Math.max(1, XEUtils.toNumber(currentPage)))
        return nextTick()
      },
      setCurrentPageByEvent (evnt, currentPage) {
        const $pager = refPager.value
        if ($pager) {
          $pager.setCurrentPageByEvent(evnt, currentPage)
        }
      },
      setPageSize (pageSize) {
        const { tablePage } = reactData
        tablePage.pageSize = Math.max(1, XEUtils.toNumber(pageSize))
        return nextTick()
      },
      setPageSizeByEvent (evnt, pageSize) {
        const $pager = refPager.value
        if ($pager) {
          $pager.setPageSizeByEvent(evnt, pageSize)
        }
      },
      getProxyInfo () {
        const $xeTable = refTable.value
        if (props.proxyConfig) {
          const { sortData } = reactData
          return {
            data: $xeTable ? $xeTable.getFullData() : [],
            filter: reactData.filterData,
            form: getFormData(),
            sort: sortData.length ? sortData[0] : {},
            sorts: sortData,
            pager: reactData.tablePage,
            pendingRecords: $xeTable ? $xeTable.getPendingRecords() : []
          }
        }
        return null
      },
      // setProxyInfo (options) {
      //   if (props.proxyConfig && options) {
      //     const { pager, form } = options
      //     const proxyOpts = computeProxyOpts.value
      //     if (pager) {
      //       if (pager.currentPage) {
      //         reactData.tablePage.currentPage = Number(pager.currentPage)
      //       }
      //       if (pager.pageSize) {
      //         reactData.tablePage.pageSize = Number(pager.pageSize)
      //       }
      //     }
      //     if (proxyOpts.form && form) {
      //       Object.assign(reactData.formData, form)
      //     }
      //   }
      //   return nextTick()
      // },
      refreshTaskView () {
        const $ganttView = refGanttView.value
        if ($ganttView) {
          return $ganttView.refreshData()
        }
        return nextTick()
      },
      hasTableViewVisible () {
        return reactData.showLeftView
      },
      showTableView () {
        reactData.showLeftView = true
        return nextTick()
      },
      hideTableView () {
        reactData.showLeftView = false
        return nextTick()
      },
      hasTaskViewVisible () {
        return reactData.showRightView
      },
      showTaskView () {
        reactData.showRightView = true
        return nextTick()
      },
      hideTaskView () {
        reactData.showRightView = false
        return nextTick()
      }
    }

    const ganttPrivateMethods: GanttPrivateMethods = {
      extendTableMethods,
      callSlot (slotFunc, params) {
        if (slotFunc) {
          if (XEUtils.isString(slotFunc)) {
            slotFunc = slots[slotFunc] || null
          }
          if (XEUtils.isFunction(slotFunc)) {
            return getSlotVNs(slotFunc(params))
          }
        }
        return []
      },
      /**
       * 获取需要排除的高度
       */
      getExcludeHeight () {
        const { isZMax } = reactData
        const el = refElem.value
        if (el) {
          const formWrapper = refFormWrapper.value
          const toolbarWrapper = refToolbarWrapper.value
          const topWrapper = refTopWrapper.value
          const bottomWrapper = refBottomWrapper.value
          const pagerWrapper = refPagerWrapper.value
          const parentEl = el.parentElement as HTMLElement
          const parentPaddingSize = isZMax ? 0 : (parentEl ? getPaddingTopBottomSize(parentEl) : 0)
          return parentPaddingSize + getPaddingTopBottomSize(el) + getOffsetHeight(formWrapper) + getOffsetHeight(toolbarWrapper) + getOffsetHeight(topWrapper) + getOffsetHeight(bottomWrapper) + getOffsetHeight(pagerWrapper)
        }
        return 0
      },
      getParentHeight () {
        const el = refElem.value
        if (el) {
          const parentEl = el.parentElement as HTMLElement
          return (reactData.isZMax ? getDomNode().visibleHeight : (parentEl ? XEUtils.toNumber(getComputedStyle(parentEl).height) : 0)) - ganttPrivateMethods.getExcludeHeight()
        }
        return 0
      },
      triggerToolbarCommitEvent (params, evnt) {
        const { code } = params
        return $xeGantt.commitProxy(params, evnt).then((rest) => {
          if (code && rest && rest.status && ['query', 'reload', 'delete', 'save'].includes(code)) {
            $xeGantt.dispatchEvent(code === 'delete' || code === 'save' ? `proxy-${code as 'delete' | 'save'}` : 'proxy-query', { ...rest, isReload: code === 'reload' }, evnt)
          }
        })
      },
      triggerToolbarBtnEvent (button, evnt) {
        $xeGantt.triggerToolbarCommitEvent(button, evnt)
        $xeGantt.dispatchEvent('toolbar-button-click', { code: button.code, button }, evnt)
      },
      triggerToolbarTolEvent (tool, evnt) {
        $xeGantt.triggerToolbarCommitEvent(tool, evnt)
        $xeGantt.dispatchEvent('toolbar-tool-click', { code: tool.code, tool }, evnt)
      },
      triggerZoomEvent (evnt) {
        $xeGantt.zoom()
        $xeGantt.dispatchEvent('zoom', { type: reactData.isZMax ? 'max' : 'revert' }, evnt)
      },
      handleTaskCellClickEvent (evnt, params) {
        const $xeTable = refTable.value
        if ($xeTable) {
          const tableProps = $xeTable.props
          const { highlightCurrentRow } = tableProps
          const tableReactData = $xeTable.reactData
          const { radioColumn, checkboxColumn } = tableReactData
          const { computeRadioOpts, computeCheckboxOpts, computeRowOpts } = $xeTable.getComputeMaps()
          const radioOpts = computeRadioOpts.value
          const checkboxOpts = computeCheckboxOpts.value
          const rowOpts = computeRowOpts.value
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
      handleTaskCellDblclickEvent (evnt, params) {
        $xeGantt.dispatchEvent('task-cell-dblclick', params, evnt)
      },
      handleTaskBarClickEvent (evnt, params) {
        $xeGantt.dispatchEvent('task-bar-click', params, evnt)
      },
      handleTaskBarDblclickEvent (evnt, params) {
        $xeGantt.dispatchEvent('task-bar-dblclick', params, evnt)
      },
      handleTaskHeaderContextmenuEvent (evnt, params) {
        const $xeTable = refTable.value
        if ($xeTable) {
          const tableProps = $xeTable.props
          const { menuConfig } = tableProps
          if (isEnableConf(menuConfig)) {
            evnt.stopPropagation()
            $xeTable.handleOpenMenuEvent(evnt, 'header', params)
          }
        }
      },
      handleTaskBodyContextmenuEvent (evnt, params) {
        const $xeTable = refTable.value
        if ($xeTable) {
          const tableProps = $xeTable.props
          const { menuConfig } = tableProps
          if (isEnableConf(menuConfig)) {
            evnt.stopPropagation()
            $xeTable.handleOpenMenuEvent(evnt, 'body', params)
          }
        }
      },
      handleTaskFooterContextmenuEvent (evnt, params) {
        const $xeTable = refTable.value
        if ($xeTable) {
          const tableProps = $xeTable.props
          const { menuConfig } = tableProps
          if (isEnableConf(menuConfig)) {
            evnt.stopPropagation()
            $xeTable.handleOpenMenuEvent(evnt, 'footer', params)
          }
        }
      },
      handleTaskBarContextmenuEvent (evnt, params) {
        const $xeTable = refTable.value
        if ($xeTable) {
          const tableProps = $xeTable.props
          const { menuConfig } = tableProps
          if (isEnableConf(menuConfig)) {
            evnt.stopPropagation()
            $xeTable.handleOpenMenuEvent(evnt, 'body', params)
          }
        }
      }
    }

    Object.assign($xeGantt, ganttExtendTableMethods, ganttMethods, ganttPrivateMethods, {
      // 检查插槽
      loadColumn (columns: any[]) {
        const $xeTable = refTable.value
        XEUtils.eachTree(columns, (column) => {
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
        if ($xeTable) {
          return $xeTable.loadColumn(columns)
        }
        return nextTick()
      },
      reloadColumn (columns: any[]) {
        $xeGantt.clearAll()
        return $xeGantt.loadColumn(columns)
      }
    })

    /**
     * 渲染表单
     */
    const renderForm = () => {
      const { formConfig, proxyConfig } = props
      const { formData } = reactData
      const proxyOpts = computeProxyOpts.value
      const formOpts = computeFormOpts.value
      if ((formConfig && isEnableConf(formOpts)) || slots.form) {
        let slotVNs: VNode[] = []
        if (slots.form) {
          slotVNs = slots.form({ $grid: null, $gantt: $xeGantt })
        } else {
          if (formOpts.items) {
            const formSlots: { [key: string]: () => VNode[] } = {}
            if (!(formOpts as any).inited) {
              (formOpts as any).inited = true
              const beforeItem = proxyOpts.beforeItem
              if (proxyOpts && beforeItem) {
                formOpts.items.forEach((item) => {
                  beforeItem({ $grid: null, $gantt: $xeGantt, item })
                })
              }
            }
            // 处理插槽
            formOpts.items.forEach((item) => {
              XEUtils.each(item.slots, (func) => {
                if (!XEUtils.isFunction(func)) {
                  if (slots[func]) {
                    formSlots[func] = slots[func] as any
                  }
                }
              })
            })
            if (VxeUIFormComponent) {
              slotVNs.push(
                h(VxeUIFormComponent, {
                  ref: refForm,
                  ...Object.assign({}, formOpts, {
                    data: proxyConfig && isEnableConf(proxyOpts) && proxyOpts.form ? formData : formOpts.data
                  }),
                  onSubmit: submitFormEvent,
                  onReset: resetFormEvent,
                  onSubmitInvalid: submitInvalidEvent,
                  onCollapse: collapseEvent
                }, formSlots)
              )
            }
          }
        }
        return h('div', {
          ref: refFormWrapper,
          key: 'form',
          class: 'vxe-gantt--form-wrapper'
        }, slotVNs)
      }
      return renderEmptyElement($xeGantt)
    }

    /**
     * 渲染工具栏
     */
    const renderToolbar = () => {
      const { toolbarConfig } = props
      const toolbarOpts = computeToolbarOpts.value
      const toolbarSlot = slots.toolbar
      if ((toolbarConfig && isEnableConf(toolbarOpts)) || toolbarSlot) {
        let slotVNs: VNode[] = []
        if (slots.toolbar) {
          slotVNs = slots.toolbar({ $grid: null, $gantt: $xeGantt })
        } else {
          const toolbarOptSlots = toolbarOpts.slots
          const toolbarSlots: {
            buttons?(params: any): any
            buttonPrefix?(params: any): any
            buttonSuffix?(params: any): any
            tools?(params: any): any
            toolPrefix?(params: any): any
            toolSuffix?(params: any): any
           } = {}
          if (toolbarOptSlots) {
            const buttonsSlot = getFuncSlot(toolbarOptSlots, 'buttons')
            const buttonPrefixSlot = getFuncSlot(toolbarOptSlots, 'buttonPrefix')
            const buttonSuffixSlot = getFuncSlot(toolbarOptSlots, 'buttonSuffix')
            const toolsSlot = getFuncSlot(toolbarOptSlots, 'tools')
            const toolPrefixSlot = getFuncSlot(toolbarOptSlots, 'toolPrefix')
            const toolSuffixSlot = getFuncSlot(toolbarOptSlots, 'toolSuffix')
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
          slotVNs.push(
            h(VxeToolbarComponent, {
              ref: refToolbar,
              ...toolbarOpts,
              slots: undefined
            }, toolbarSlots)
          )
        }
        return h('div', {
          ref: refToolbarWrapper,
          key: 'toolbar',
          class: 'vxe-gantt--toolbar-wrapper'
        }, slotVNs)
      }
      return renderEmptyElement($xeGantt)
    }

    /**
     * 渲染表格顶部区域
     */
    const renderTop = () => {
      const topSlot = slots.top
      if (topSlot) {
        return h('div', {
          ref: refTopWrapper,
          key: 'top',
          class: 'vxe-gantt--top-wrapper'
        }, topSlot({ $grid: null, $gantt: $xeGantt }))
      }
      return renderEmptyElement($xeGantt)
    }

    const renderTableLeft = () => {
      const leftSlot = slots.left
      if (leftSlot) {
        return h('div', {
          class: 'vxe-gantt--left-wrapper'
        }, leftSlot({ $grid: null, $gantt: $xeGantt }))
      }
      return renderEmptyElement($xeGantt)
    }

    const renderTableRight = () => {
      const rightSlot = slots.right
      if (rightSlot) {
        return h('div', {
          class: 'vxe-gantt--right-wrapper'
        }, rightSlot({ $grid: null, $gantt: $xeGantt }))
      }
      return renderEmptyElement($xeGantt)
    }

    /**
     * 渲染表格
     */
    const renderTable = () => {
      const { proxyConfig } = props
      const tableProps = computeTableProps.value
      const proxyOpts = computeProxyOpts.value
      const tableOns = Object.assign({}, tableCompEvents)
      const emptySlot = slots.empty
      const loadingSlot = slots.loading
      const rowDragIconSlot = slots.rowDragIcon || slots['row-drag-icon']
      const columnDragIconSlot = slots.columnDragIcon || slots['column-drag-icon']
      const headerTooltipSlot = slots.headerTooltip || slots['header-tooltip']
      const tooltipSlot = slots.tooltip
      const footerTooltipSlot = slots.footerTooltip || slots['footer-tooltip']
      if (proxyConfig && isEnableConf(proxyOpts)) {
        if (proxyOpts.sort) {
          tableOns.onSortChange = sortChangeEvent
          tableOns.onClearAllSort = clearAllSortEvent
        }
        if (proxyOpts.filter) {
          tableOns.onFilterChange = filterChangeEvent
          tableOns.onClearAllFilter = clearAllFilterEvent
        }
      }
      const slotObj: {
        empty?(params: any): any
        loading?(params: any): any
        rowDragIcon?(params: any): any
        columnDragIcon?(params: any): any
        headerTooltip?(params: any): any
        tooltip?(params: any): any
        footerTooltip?(params: any): any
      } = {}
      if (emptySlot) {
        slotObj.empty = emptySlot
      }
      if (loadingSlot) {
        slotObj.loading = loadingSlot
      }
      if (rowDragIconSlot) {
        slotObj.rowDragIcon = rowDragIconSlot
      }
      if (columnDragIconSlot) {
        slotObj.columnDragIcon = columnDragIconSlot
      }
      if (headerTooltipSlot) {
        slotObj.headerTooltip = headerTooltipSlot
      }
      if (tooltipSlot) {
        slotObj.tooltip = tooltipSlot
      }
      if (footerTooltipSlot) {
        slotObj.footerTooltip = footerTooltipSlot
      }
      return h('div', {
        ref: refTableWrapper,
        class: 'vxe-gantt--table-wrapper'
      }, [
        h(VxeTableComponent, {
          ref: refTable,
          ...tableProps,
          ...tableOns
        }, slotObj)
      ])
    }

    /**
     * 渲染表格底部区域
     */
    const renderBottom = () => {
      if (slots.bottom) {
        return h('div', {
          ref: refBottomWrapper,
          key: 'bottom',
          class: 'vxe-gantt--bottom-wrapper'
        }, slots.bottom({ $grid: null, $gantt: $xeGantt }))
      }
      return renderEmptyElement($xeGantt)
    }

    /**
     * 渲染分页
     */
    const renderPager = () => {
      const { proxyConfig, pagerConfig } = props
      const proxyOpts = computeProxyOpts.value
      const pagerOpts = computePagerOpts.value
      const pagerSlot = slots.pager
      if ((pagerConfig && isEnableConf(pagerOpts)) || slots.pager) {
        return h('div', {
          ref: refPagerWrapper,
          key: 'pager',
          class: 'vxe-gantt--pager-wrapper'
        }, pagerSlot
          ? pagerSlot({ $grid: null, $gantt: $xeGantt })
          : [
              VxeUIPagerComponent
                ? h(VxeUIPagerComponent, {
                  ref: refPager,
                  ...pagerOpts,
                  ...(proxyConfig && isEnableConf(proxyOpts) ? reactData.tablePage : {}),
                  onPageChange: pageChangeEvent
                }, getConfigSlot(pagerOpts.slots))
                : renderEmptyElement($xeGantt)
            ])
      }
      return renderEmptyElement($xeGantt)
    }

    /**
     * 渲染任务视图
     */
    const renderTaskView = () => {
      return h('div', {
        ref: refGanttWrapper,
        class: 'vxe-gantt--view-wrapper'
      }, [
        h(GanttViewComponent, {
          ref: refGanttView
        })
      ])
    }

    const renderSplitBar = () => {
      const { showLeftView, showRightView } = reactData
      const taskSplitOpts = computeTaskSplitOpts.value
      const { enabled, resize, showCollapseTableButton, showCollapseTaskButton } = taskSplitOpts
      if (!enabled) {
        return renderEmptyElement($xeGantt)
      }
      const isResize = resize && showLeftView && showRightView
      const ons: {
        onMousedown?: typeof dragSplitEvent
      } = {}
      if (isResize) {
        ons.onMousedown = dragSplitEvent
      }
      return h('div', {
        class: ['vxe-gantt--view-split-bar', {
          'is--resize': isResize
        }]
      }, [
        h('div', {
          class: 'vxe-gantt--view-split-bar-handle',
          ...ons
        }),
        showCollapseTableButton || showCollapseTaskButton
          ? h('div', {
            class: 'vxe-gantt--view-split-bar-btn-wrapper'
          }, [
            showCollapseTableButton && showRightView
              ? h('div', {
                class: 'vxe-gantt--view-split-bar-left-btn',
                onClick: handleSplitLeftViewEvent
              }, [
                h('i', {
                  class: showLeftView ? getIcon().GANTT_VIEW_LEFT_OPEN : getIcon().GANTT_VIEW_LEFT_CLOSE
                })
              ])
              : renderEmptyElement($xeGantt),
            showCollapseTaskButton && showLeftView
              ? h('div', {
                class: 'vxe-gantt--view-split-bar-right-btn',
                onClick: handleSplitRightViewEvent
              }, [
                h('i', {
                  class: showRightView ? getIcon().GANTT_VIEW_RIGHT_OPEN : getIcon().GANTT_VIEW_RIGHT_CLOSE
                })
              ])
              : renderEmptyElement($xeGantt)
          ])
          : renderEmptyElement($xeGantt)
      ])
    }

    const renderChildLayout = (layoutKeys: VxeGanttDefines.LayoutKey[]) => {
      const childVNs: VNode[] = []
      layoutKeys.forEach(key => {
        switch (key) {
          case 'Form':
            childVNs.push(renderForm())
            break
          case 'Toolbar':
            childVNs.push(renderToolbar())
            break
          case 'Top':
            childVNs.push(renderTop())
            break
          case 'Gantt':
            childVNs.push(
              h('div', {
                ref: refGanttContainerElem,
                key: 'tv',
                class: 'vxe-gantt--gantt-container'
              }, [
                renderTableLeft(),
                renderTable(),
                renderSplitBar(),
                renderTaskView(),
                renderTableRight(),
                h('div', {
                  ref: refClassifyWrapperElem
                }),
                h('div', {
                  ref: refResizableSplitTip,
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
            childVNs.push(renderBottom())
            break
          case 'Pager':
            childVNs.push(renderPager())
            break
          default:
            errLog('vxe.error.notProp', [`layouts -> ${key}`])
            break
        }
      })
      return childVNs
    }

    const renderLayout = () => {
      const currLayoutConf = computeCurrLayoutConf.value
      const { headKeys, bodyKeys, footKeys } = currLayoutConf
      const asideLeftSlot = slots.asideLeft || slots['aside-left']
      const asideRightSlot = slots.asideRight || slots['aside-right']
      return [
        h('div', {
          class: 'vxe-gantt--layout-header-wrapper'
        }, renderChildLayout(headKeys)),
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
          }, renderChildLayout(bodyKeys)),
          asideRightSlot
            ? h('div', {
              class: 'vxe-gantt--layout-aside-right-wrapper'
            }, asideRightSlot({}))
            : renderEmptyElement($xeGantt)
        ]),
        h('div', {
          class: 'vxe-gantt--layout-footer-wrapper'
        }, renderChildLayout(footKeys)),
        h('div', {
          ref: refPopupContainerElem
        })
      ]
    }

    const renderVN = () => {
      const { showLeftView, showRightView } = reactData
      const vSize = computeSize.value
      const styles = computeStyles.value
      const isLoading = computeIsLoading.value
      const tableBorder = computeTableBorder.value
      const scrollbarXToTop = computeScrollbarXToTop.value
      const scrollbarYToLeft = computeScrollbarYToLeft.value
      return h('div', {
        ref: refElem,
        class: ['vxe-gantt', `border--${tableBorder}`, `sx-pos--${scrollbarXToTop ? 'top' : 'bottom'}`, `sy-pos--${scrollbarYToLeft ? 'left' : 'right'}`, {
          [`size--${vSize}`]: vSize,
          'is--round': props.round,
          'is--maximize': reactData.isZMax,
          'is--loading': isLoading,
          'show--left': showLeftView,
          'show--right': showRightView
        }],
        style: styles
      }, renderLayout())
    }

    const columnFlag = ref(0)
    watch(() => props.columns ? props.columns.length : -1, () => {
      columnFlag.value++
    })
    watch(() => props.columns, () => {
      columnFlag.value++
    })
    watch(columnFlag, () => {
      nextTick(() => $xeGantt.loadColumn(props.columns || []))
    })

    watch(() => props.toolbarConfig, () => {
      initToolbar()
    })

    watch(computeCustomCurrentPageFlag, () => {
      initPages('currentPage')
    })

    watch(computeCustomPageSizeFlag, () => {
      initPages('pageSize')
    })

    watch(computeCustomTotalFlag, () => {
      initPages('total')
    })

    watch(() => props.proxyConfig, () => {
      initProxy()
    })

    watch(computeTaskScaleConfs, () => {
      handleTaskScaleConfig()
    })

    hooks.forEach((options) => {
      const { setupGantt } = options
      if (setupGantt) {
        const hookRest = setupGantt($xeGantt)
        if (hookRest && XEUtils.isObject(hookRest)) {
          Object.assign($xeGantt, hookRest)
        }
      }
    })

    handleTaskScaleConfig()
    initPages()

    onMounted(() => {
      nextTick(() => {
        const { columns } = props
        const proxyOpts = computeProxyOpts.value

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

        // const { data, columns, proxyConfig } = props
        // const formOpts = computeFormOpts.value
        // if (isEnableConf(proxyConfig) && (data || (proxyOpts.form && formOpts.data))) {
        //   errLog('vxe.error.errConflicts', ['grid.data', 'grid.proxy-config'])
        // }

        if (proxyOpts.props) {
          warnLog('vxe.error.delProp', ['proxy-config.props', 'proxy-config.response'])
        }
        if (props.expandConfig) {
          warnLog('vxe.error.notProp', ['expand-config'])
        }

        if (columns && columns.length) {
          $xeGantt.loadColumn(columns)
        }
        initToolbar()
        initProxy()
      })
      initGanttView()
      globalEvents.on($xeGantt, 'keydown', handleGlobalKeydownEvent)
    })

    onUnmounted(() => {
      globalEvents.off($xeGantt, 'keydown')
      XEUtils.assign(internalData, createInternalData())
    })

    $xeGantt.renderVN = renderVN

    provide('$xeGrid', null)
    provide('$xeGantt', $xeGantt)

    return $xeGantt
  },
  render () {
    return this.renderVN()
  }
})
