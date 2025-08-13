import { VNode, CreateElement } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import { setScrollTop, setScrollLeft } from '../../ui/src/dom'
import { getRefElem } from './util'
import XEUtils from 'xe-utils'
import GanttViewHeaderComponent from './gantt-header'
import GanttViewBodyComponent from './gantt-body'

import type { TableReactData, TableInternalData, VxeTableConstructor, VxeTableMethods, VxeTablePrivateMethods } from 'vxe-table'
import type { VxeGanttViewConstructor, GanttViewReactData, VxeGanttPropTypes, VxeGanttDefines, VxeGanttViewPrivateMethods, GanttViewInternalData, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

const { globalEvents } = VxeUI

function createInternalData (): GanttViewInternalData {
  return {
    xeTable: null,
    startMaps: {},
    endMaps: {},
    chartMaps: {},
    elemStore: {},
    // 存放横向 X 虚拟滚动相关的信息
    scrollXStore: {
      preloadSize: 0,
      offsetSize: 0,
      visibleSize: 0,
      visibleStartIndex: 0,
      visibleEndIndex: 0,
      startIndex: 0,
      endIndex: 0
    },
    // 存放纵向 Y 虚拟滚动相关信息
    scrollYStore: {
      preloadSize: 0,
      offsetSize: 0,
      visibleSize: 0,
      visibleStartIndex: 0,
      visibleEndIndex: 0,
      startIndex: 0,
      endIndex: 0
    }
  }
}
const maxYHeight = 5e6
const maxXWidth = 5e6

function handleParseColumn ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const $xeGantt = $xeGanttView.$xeGantt
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const { minViewDate, maxViewDate } = reactData
  const taskViewOpts = $xeGantt.computeTaskViewOpts
  const fullCols: VxeGanttPropTypes.Column[] = []
  const groupCols: VxeGanttPropTypes.Column[][] = []
  switch (taskViewOpts.mode) {
    case 'year':
      break
    case 'quarter':
      break
    case 'month':
      break
    case 'week':
      break
    default: {
      if (minViewDate && maxViewDate) {
        const currTime = minViewDate.getTime()
        const diffDayNum = maxViewDate.getTime() - minViewDate.getTime()
        const countDayNum = Math.max(6, Math.floor(diffDayNum / 86400000) + 1)
        const groupList: VxeGanttDefines.GroupHeaderColumn[] = []
        const colList: VxeGanttPropTypes.Column[] = []
        const groupMaps: Record<string, VxeGanttDefines.GroupHeaderColumn> = {}
        for (let i = 0; i < countDayNum; i++) {
          const itemDate = new Date(currTime + (i * 86400000))
          const yyyyy = `${itemDate.getFullYear()}-${itemDate.getMonth() + 1}`
          const mmDd = `${itemDate.getDate()}`
          let groupCol = groupMaps[yyyyy]
          const column = {
            field: `${yyyyy}-${mmDd}`,
            title: mmDd
          }
          if (groupCol) {
            groupCol.children.push(column)
            fullCols.push(groupCol)
          } else {
            groupCol = {
              field: yyyyy,
              title: yyyyy,
              children: [column]
            }
            groupList.push(groupCol)
            fullCols.push(groupCol)
            groupMaps[yyyyy] = groupCol
          }
          colList.push(column)
        }
        groupCols.push(groupList, colList)

        const $xeTable = internalData.xeTable
        if ($xeTable) {
          const startField = $xeGantt.computeStartField
          const endField = $xeGantt.computeEndField
          const tableInternalData = $xeTable as unknown as TableInternalData
          const { afterFullData } = tableInternalData
          const ctMaps: Record<string, VxeGanttDefines.RowCacheItem> = {}
          afterFullData.forEach(row => {
            const rowid = $xeTable.getRowid(row)
            const startValue = XEUtils.get(row, startField)
            const endValue = XEUtils.get(row, endField)
            if (startValue && endValue) {
              const startDate = XEUtils.toStringDate(startValue)
              const endDate = XEUtils.toStringDate(endValue)
              const oLeftSize = Math.floor((startDate.getTime() - minViewDate.getTime()) / 86400000)
              const oWidthSize = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1
              ctMaps[rowid] = {
                row,
                rowid,
                oLeftSize,
                oWidthSize
              }
            }
          })
          internalData.chartMaps = ctMaps
        }
      }
      break
    }
  }
  reactData.tableColumn = fullCols
  reactData.headerGroups = groupCols
}

function handleUpdateData ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const $xeGantt = $xeGanttView.$xeGantt
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const $xeTable = internalData.xeTable
  const sdMaps: Record<string, any> = {}
  const edMaps: Record<string, any> = {}
  let minDate: Date | null = null
  let maxDate: Date | null = null
  if ($xeTable) {
    const startField = $xeGantt.computeStartField
    const endField = $xeGantt.computeEndField
    const tableInternalData = $xeTable as unknown as TableInternalData
    const { afterFullData } = tableInternalData
    afterFullData.forEach(row => {
      const startValue = XEUtils.get(row, startField)
      const endValue = XEUtils.get(row, endField)
      if (startValue && endValue) {
        const startDate = XEUtils.toStringDate(startValue)
        if (!minDate || minDate.getTime() > startDate.getTime()) {
          minDate = startDate
        }
        const endDate = XEUtils.toStringDate(endValue)
        if (!maxDate || maxDate.getTime() < endDate.getTime()) {
          maxDate = endDate
        }
      }
    })
  }
  reactData.minViewDate = minDate
  reactData.maxViewDate = maxDate
  internalData.startMaps = sdMaps
  internalData.endMaps = edMaps
  handleParseColumn($xeGanttView)
}

function calcScrollbar ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const $xeGantt = $xeGanttView.$xeGantt
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const { scrollXWidth, scrollYHeight } = reactData
  const { elemStore } = internalData
  const scrollbarOpts = $xeGantt.computeScrollbarOpts
  const bodyWrapperElem = getRefElem(elemStore['main-body-wrapper'])
  const xHandleEl = $xeGanttView.$refs.refScrollXHandleElem as HTMLDivElement
  const yHandleEl = $xeGanttView.$refs.refScrollYHandleElem as HTMLDivElement
  let overflowY = false
  let overflowX = false
  if (bodyWrapperElem) {
    overflowY = scrollYHeight > bodyWrapperElem.clientHeight
    if (yHandleEl) {
      reactData.scrollbarWidth = scrollbarOpts.width || (yHandleEl.offsetWidth - yHandleEl.clientWidth) || 14
    }
    reactData.overflowY = overflowY

    overflowX = scrollXWidth > bodyWrapperElem.clientWidth
    if (xHandleEl) {
      reactData.scrollbarHeight = scrollbarOpts.height || (xHandleEl.offsetHeight - xHandleEl.clientHeight) || 14
    }

    reactData.overflowX = overflowX
  }
}

function updateChart ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const { viewCellWidth } = reactData
  const { elemStore, chartMaps } = internalData
  const chartWrapper = getRefElem(elemStore['main-chart-wrapper'])
  if (chartWrapper) {
    XEUtils.arrayEach(chartWrapper.children, (rowEl) => {
      const barEl = rowEl.children[0] as HTMLDivElement
      if (!barEl) {
        return
      }
      const rowid = rowEl.getAttribute('rowid')
      const rowRest = rowid ? chartMaps[rowid] : null
      if (rowRest) {
        barEl.style.left = `${viewCellWidth * rowRest.oLeftSize}px`
        barEl.style.width = `${viewCellWidth * rowRest.oWidthSize}px`
      }
    })
  }
  return $xeGanttView.$nextTick()
}

function updateStyle ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const $xeGantt = $xeGanttView.$xeGantt
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const { scrollbarWidth, scrollbarHeight, tableColumn } = reactData
  const { elemStore } = internalData
  const $xeTable = internalData.xeTable

  const el = $xeGanttView.$refs.refElem as HTMLDivElement
  if (!el || !el.clientHeight) {
    return
  }

  const scrollbarXToTop = $xeGantt.computeScrollbarXToTop

  const xLeftCornerEl = $xeGanttView.$refs.refScrollXLeftCornerElem as HTMLDivElement
  const xRightCornerEl = $xeGanttView.$refs.refScrollXRightCornerElem as HTMLDivElement
  const scrollXVirtualEl = $xeGanttView.$refs.refScrollXVirtualElem as HTMLDivElement

  const osbWidth = scrollbarWidth
  const osbHeight = scrollbarHeight

  let tbHeight = 0
  let tHeaderHeight = 0
  let tFooterHeight = 0
  if ($xeTable) {
    const tableInternalData = $xeTable as unknown as TableInternalData
    tbHeight = tableInternalData.tBodyHeight
    tHeaderHeight = tableInternalData.tHeaderHeight
    tFooterHeight = tableInternalData.tFooterHeight
  }

  const headerScrollElem = getRefElem(elemStore['main-header-scroll'])
  if (headerScrollElem) {
    headerScrollElem.style.height = `${tHeaderHeight}px`
  }
  const bodyScrollElem = getRefElem(elemStore['main-body-scroll'])
  if (bodyScrollElem) {
    bodyScrollElem.style.height = `${tbHeight}px`
  }

  if (scrollXVirtualEl) {
    scrollXVirtualEl.style.height = `${osbHeight}px`
    scrollXVirtualEl.style.visibility = 'visible'
  }
  const xWrapperEl = $xeGanttView.$refs.refScrollXWrapperElem as HTMLDivElement
  if (xWrapperEl) {
    xWrapperEl.style.left = scrollbarXToTop ? `${osbWidth}px` : ''
    xWrapperEl.style.width = `${el.clientWidth - osbWidth}px`
  }
  if (xLeftCornerEl) {
    xLeftCornerEl.style.width = scrollbarXToTop ? `${osbWidth}px` : ''
    xLeftCornerEl.style.display = scrollbarXToTop ? (osbHeight ? 'block' : '') : ''
  }
  if (xRightCornerEl) {
    xRightCornerEl.style.width = scrollbarXToTop ? '' : `${osbWidth}px`
    xRightCornerEl.style.display = scrollbarXToTop ? '' : (osbHeight ? 'block' : '')
  }

  const scrollYVirtualEl = $xeGanttView.$refs.refScrollYVirtualElem as HTMLDivElement
  if (scrollYVirtualEl) {
    scrollYVirtualEl.style.width = `${osbWidth}px`
    scrollYVirtualEl.style.height = `${tbHeight + tHeaderHeight + tFooterHeight}px`
    scrollYVirtualEl.style.visibility = 'visible'
  }
  const yTopCornerEl = $xeGanttView.$refs.refScrollYTopCornerElem as HTMLDivElement
  if (yTopCornerEl) {
    yTopCornerEl.style.height = `${tHeaderHeight}px`
    yTopCornerEl.style.display = tHeaderHeight ? 'block' : ''
  }
  const yWrapperEl = $xeGanttView.$refs.refScrollYWrapperElem as HTMLDivElement
  if (yWrapperEl) {
    yWrapperEl.style.height = `${tbHeight}px`
    yWrapperEl.style.top = `${tHeaderHeight}px`
  }
  const yBottomCornerEl = $xeGanttView.$refs.refScrollYBottomCornerElem as HTMLDivElement
  if (yBottomCornerEl) {
    yBottomCornerEl.style.height = `${tFooterHeight}px`
    yBottomCornerEl.style.top = `${tHeaderHeight + tbHeight}px`
    yBottomCornerEl.style.display = tFooterHeight ? 'block' : ''
  }

  const colInfoElem = $xeGanttView.$refs.refColInfoElem as HTMLDivElement
  if (colInfoElem) {
    reactData.viewCellWidth = colInfoElem.clientWidth || 40
  }
  let viewTableWidth = reactData.viewCellWidth * tableColumn.length
  if (bodyScrollElem) {
    const viewWidth = bodyScrollElem.clientWidth
    const remainWidth = viewWidth - viewTableWidth
    if (remainWidth > 0) {
      reactData.viewCellWidth += Math.floor(remainWidth / tableColumn.length)
      viewTableWidth = viewWidth
    }
  }
  const headerTableElem = getRefElem(elemStore['main-header-table'])
  const bodyTableElem = getRefElem(elemStore['main-body-table'])
  if (headerTableElem) {
    headerTableElem.style.width = `${viewTableWidth}px`
  }
  if (bodyTableElem) {
    bodyTableElem.style.width = `${viewTableWidth}px`
  }

  reactData.scrollXWidth = viewTableWidth

  return updateChart($xeGanttView)
}

function handleLazyRecalculate ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  calcScrollbar($xeGanttView)
  updateStyle($xeGanttView)
  return $xeGanttView.$nextTick()
}

function updateScrollXSpace ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const { scrollXLoad, scrollXWidth } = reactData
  const { elemStore } = internalData
  const bodyScrollElem = getRefElem(elemStore['main-body-scroll'])
  const bodyTableElem = getRefElem(elemStore['main-body-table'])

  let xSpaceLeft = 0

  let clientWidth = 0
  if (bodyScrollElem) {
    clientWidth = bodyScrollElem.clientWidth
  }
  // 虚拟渲染
  let isScrollXBig = false
  let ySpaceWidth = scrollXWidth
  if (scrollXWidth > maxXWidth) {
    // 触右
    if (bodyScrollElem && bodyTableElem && bodyScrollElem.scrollLeft + clientWidth >= maxXWidth) {
      xSpaceLeft = maxXWidth - bodyTableElem.clientWidth
    } else {
      xSpaceLeft = (maxXWidth - clientWidth) * (xSpaceLeft / (scrollXWidth - clientWidth))
    }
    ySpaceWidth = maxXWidth
    isScrollXBig = true
  }

  if (bodyTableElem) {
    bodyTableElem.style.transform = `translate(${xSpaceLeft}px, ${reactData.scrollYTop || 0}px)`
  }

  const layoutList = ['header', 'body', 'footer']
  layoutList.forEach(layout => {
    const xSpaceElem = getRefElem(elemStore[`main-${layout}-xSpace`])
    if (xSpaceElem) {
      xSpaceElem.style.width = scrollXLoad ? `${ySpaceWidth}px` : ''
    }
  })

  reactData.scrollXLeft = xSpaceLeft
  reactData.scrollXWidth = ySpaceWidth
  reactData.isScrollXBig = isScrollXBig

  const scrollXSpaceEl = $xeGanttView.$refs.refScrollXSpaceElem as HTMLDivElement
  if (scrollXSpaceEl) {
    scrollXSpaceEl.style.width = `${ySpaceWidth}px`
  }

  calcScrollbar($xeGanttView)
  return $xeGanttView.$nextTick().then(() => {
    updateStyle($xeGanttView)
  })
}

function updateScrollYSpace ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const { scrollYLoad, overflowY } = reactData
  const { elemStore } = internalData
  const $xeTable = internalData.xeTable
  const bodyScrollElem = getRefElem(elemStore['main-body-scroll'])
  const bodyTableElem = getRefElem(elemStore['main-body-table'])

  let ySpaceTop = 0
  let scrollYHeight = 0
  let isScrollYBig = false
  if ($xeTable) {
    const tableReactData = $xeTable as unknown as TableReactData
    ySpaceTop = tableReactData.scrollYTop
    scrollYHeight = tableReactData.scrollYHeight
    isScrollYBig = tableReactData.isScrollYBig
  }

  let ySpaceHeight = scrollYHeight
  let scrollYTop = ySpaceTop

  let clientHeight = 0
  if (bodyScrollElem) {
    clientHeight = bodyScrollElem.clientHeight
  }
  if (isScrollYBig) {
    // 触底
    if (bodyScrollElem && bodyTableElem && bodyScrollElem.scrollTop + clientHeight >= maxYHeight) {
      scrollYTop = maxYHeight - bodyTableElem.clientHeight
    } else {
      scrollYTop = (maxYHeight - clientHeight) * (ySpaceTop / (scrollYHeight - clientHeight))
    }
    ySpaceHeight = maxYHeight
  }
  if (!(scrollYLoad && overflowY)) {
    scrollYTop = 0
  }

  if (bodyTableElem) {
    bodyTableElem.style.transform = `translate(${reactData.scrollXLeft || 0}px, ${scrollYTop}px)`
  }

  const layoutList = ['header', 'body', 'footer']
  layoutList.forEach(layout => {
    const ySpaceElem = getRefElem(elemStore[`main-${layout}-ySpace`])
    if (ySpaceElem) {
      ySpaceElem.style.height = ySpaceHeight ? `${ySpaceHeight}px` : ''
    }
  })

  const scrollYSpaceEl = $xeGanttView.$refs.refScrollYSpaceElem as HTMLDivElement
  if (scrollYSpaceEl) {
    scrollYSpaceEl.style.height = ySpaceHeight ? `${ySpaceHeight}px` : ''
  }
  reactData.scrollYTop = scrollYTop
  reactData.scrollYHeight = scrollYHeight
  reactData.isScrollYBig = isScrollYBig

  calcScrollbar($xeGanttView)
  return $xeGanttView.$nextTick().then(() => {
    updateStyle($xeGanttView)
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function checkLastSyncScroll ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods, isRollX: boolean, isRollY: boolean) {
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const { lcsTimeout } = internalData
  reactData.lazScrollLoading = true
  if (lcsTimeout) {
    clearTimeout(lcsTimeout)
  }
  internalData.lcsTimeout = setTimeout(() => {
    internalData.lcsRunTime = Date.now()
    internalData.lcsTimeout = undefined
    internalData.intoRunScroll = false
    internalData.inVirtualScroll = false
    internalData.inWheelScroll = false
    internalData.inHeaderScroll = false
    internalData.inBodyScroll = false
    internalData.inFooterScroll = false
    reactData.lazScrollLoading = false
  }, 200)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleScrollEvent ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods, evnt: Event, isRollY: boolean, isRollX: boolean, scrollTop: number, scrollLeft: number) {
  checkLastSyncScroll($xeGanttView, isRollX, isRollY)
}

/**
 * 同步表格滚动
 */
function syncTableScrollTop ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods, scrollTop: number) {
  const internalData = $xeGanttView.internalData

  const $xeTable = internalData.xeTable
  if ($xeTable) {
    const tableInternalData = $xeTable as unknown as TableInternalData
    const { elemStore: tableElemStore } = tableInternalData
    const tableBodyScrollElem = getRefElem(tableElemStore['main-body-scroll'])
    if (tableBodyScrollElem) {
      tableBodyScrollElem.scrollTop = scrollTop
    }
  }
}

export default defineVxeComponent({
  name: 'VxeGanttView',
  inject: {
    $xeGantt: {
      default: null
    }
  },
  provide () {
    const $xeGanttView = this

    return {
      $xeGanttView
    }
  },
  props: {},
  data () {
    const xID = XEUtils.uniqueId()

    const reactData: GanttViewReactData = {
      // 是否启用了横向 X 可视渲染方式加载
      scrollXLoad: false,
      // 是否启用了纵向 Y 可视渲染方式加载
      scrollYLoad: false,
      // 是否存在纵向滚动条
      overflowY: false,
      // 是否存在横向滚动条
      overflowX: false,
      // 纵向滚动条的宽度
      scrollbarWidth: 0,
      // 横向滚动条的高度
      scrollbarHeight: 0,

      lazScrollLoading: false,

      scrollVMLoading: false,
      scrollYHeight: 0,
      scrollYTop: 0,
      isScrollYBig: false,
      scrollXLeft: 0,
      scrollXWidth: 0,
      isScrollXBig: false,

      minViewDate: null,
      maxViewDate: null,
      tableData: [],
      tableColumn: [],
      headerGroups: [],

      viewCellWidth: 40,

      rowHeightStore: {
        large: 52,
        default: 48,
        medium: 44,
        small: 40,
        mini: 36
      }
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
      $xeGantt(): (VxeGanttConstructor & VxeGanttPrivateMethods)
    })
  },
  methods: {
    //
    // Method
    //
    refreshData (): Promise<void> {
      const $xeGanttView = this

      handleUpdateData($xeGanttView)
      return handleLazyRecalculate($xeGanttView)
    },
    updateViewData (): Promise<void> {
      const $xeGanttView = this
      const reactData = $xeGanttView.reactData
      const internalData = $xeGanttView.internalData

      const $xeTable = internalData.xeTable
      if ($xeTable) {
        const tableReactData = $xeTable as unknown as TableReactData
        const { tableData } = tableReactData
        reactData.tableData = tableData
      }
      return $xeGanttView.$nextTick()
    },
    connectUpdate ({ $table }: {
      $table: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods
    }) {
      const $xeGanttView = this
      const internalData = $xeGanttView.internalData

      if ($table) {
        internalData.xeTable = $table
      }
      return $xeGanttView.$nextTick()
    },
    handleUpdateStyle () {
      const $xeGanttView = this

      return updateStyle($xeGanttView)
    },
    handleLazyRecalculate () {
      const $xeGanttView = this

      return handleLazyRecalculate($xeGanttView)
    },
    triggerHeaderScrollEvent (evnt: Event) {
      const $xeGanttView = this
      const internalData = $xeGanttView.internalData

      const { elemStore, inVirtualScroll, inBodyScroll, inFooterScroll } = internalData
      if (inVirtualScroll) {
        return
      }
      if (inBodyScroll || inFooterScroll) {
        return
      }
      const wrapperEl = evnt.currentTarget as HTMLDivElement
      const bodyScrollElem = getRefElem(elemStore['main-body-scroll'])
      const xHandleEl = $xeGanttView.$refs.refScrollXHandleElem as HTMLDivElement
      if (bodyScrollElem && wrapperEl) {
        const isRollX = true
        const isRollY = false
        const currLeftNum = wrapperEl.scrollLeft
        internalData.inHeaderScroll = true
        setScrollLeft(xHandleEl, currLeftNum)
        setScrollLeft(bodyScrollElem, currLeftNum)
        handleScrollEvent($xeGanttView, evnt, isRollY, isRollX, wrapperEl.scrollTop, currLeftNum)
      }
    },
    triggerBodyScrollEvent (evnt: Event) {
      const $xeGanttView = this
      const internalData = $xeGanttView.internalData

      const { elemStore, inVirtualScroll, inHeaderScroll, inFooterScroll } = internalData
      if (inVirtualScroll) {
        return
      }
      if (inHeaderScroll || inFooterScroll) {
        return
      }
      const wrapperEl = evnt.currentTarget as HTMLDivElement
      const headerScrollElem = getRefElem(elemStore['main-header-scroll'])
      const xHandleEl = $xeGanttView.$refs.refScrollXHandleElem as HTMLDivElement
      const yHandleEl = $xeGanttView.$refs.refScrollYHandleElem as HTMLDivElement
      if (headerScrollElem && wrapperEl) {
        const isRollX = true
        const isRollY = true
        const currLeftNum = wrapperEl.scrollLeft
        const currTopNum = wrapperEl.scrollTop
        internalData.inBodyScroll = true
        setScrollLeft(xHandleEl, currLeftNum)
        setScrollLeft(headerScrollElem, currLeftNum)
        setScrollTop(yHandleEl, currTopNum)
        syncTableScrollTop($xeGanttView, currTopNum)
        handleScrollEvent($xeGanttView, evnt, isRollY, isRollX, wrapperEl.scrollTop, currLeftNum)
      }
    },
    triggerFooterScrollEvent (evnt: Event) {
      const $xeGanttView = this
      const internalData = $xeGanttView.internalData

      const { inVirtualScroll, inHeaderScroll, inBodyScroll } = internalData
      if (inVirtualScroll) {
        return
      }
      if (inHeaderScroll || inBodyScroll) {
        return
      }
      const wrapperEl = evnt.currentTarget as HTMLDivElement
      if (wrapperEl) {
        const isRollX = true
        const isRollY = false
        const currLeftNum = wrapperEl.scrollLeft
        handleScrollEvent($xeGanttView, evnt, isRollY, isRollX, wrapperEl.scrollTop, currLeftNum)
      }
    },
    triggerVirtualScrollXEvent (evnt: Event) {
      const $xeGanttView = this
      const internalData = $xeGanttView.internalData

      const { elemStore, inHeaderScroll, inBodyScroll } = internalData
      if (inHeaderScroll || inBodyScroll) {
        return
      }
      const wrapperEl = evnt.currentTarget as HTMLDivElement
      const headerScrollElem = getRefElem(elemStore['main-header-scroll'])
      const bodyScrollElem = getRefElem(elemStore['main-body-scroll'])
      if (wrapperEl) {
        const isRollY = false
        const isRollX = true
        const currLeftNum = wrapperEl.scrollLeft
        internalData.inVirtualScroll = true
        setScrollLeft(headerScrollElem, currLeftNum)
        setScrollLeft(bodyScrollElem, currLeftNum)
        handleScrollEvent($xeGanttView, evnt, isRollY, isRollX, wrapperEl.scrollTop, currLeftNum)
      }
    },
    triggerVirtualScrollYEvent (evnt: Event) {
      const $xeGanttView = this
      const internalData = $xeGanttView.internalData

      const { elemStore, inHeaderScroll, inBodyScroll } = internalData
      if (inHeaderScroll || inBodyScroll) {
        return
      }
      const wrapperEl = evnt.currentTarget as HTMLDivElement
      const bodyScrollElem = getRefElem(elemStore['main-body-scroll'])
      if (wrapperEl) {
        const isRollY = true
        const isRollX = false
        const currTopNum = wrapperEl.scrollTop
        internalData.inVirtualScroll = true
        setScrollTop(bodyScrollElem, currTopNum)
        syncTableScrollTop($xeGanttView, currTopNum)
        handleScrollEvent($xeGanttView, evnt, isRollY, isRollX, currTopNum, wrapperEl.scrollLeft)
      }
    },
    updateScrollXSpace () {
      const $xeGanttView = this

      return updateScrollXSpace($xeGanttView)
    },
    updateScrollYSpace () {
      const $xeGanttView = this

      return updateScrollYSpace($xeGanttView)
    },
    handleGlobalResizeEvent () {
      const $xeGanttView = this

      handleLazyRecalculate($xeGanttView)
    },

    //
    // Render
    //
    renderScrollX (h: CreateElement) {
      const $xeGanttView = this

      return h('div', {
        key: 'vsx',
        ref: 'refScrollXVirtualElem',
        class: 'vxe-gantt-view--scroll-x-virtual'
      }, [
        h('div', {
          ref: 'refScrollXLeftCornerElem',
          class: 'vxe-gantt-view--scroll-x-left-corner'
        }),
        h('div', {
          ref: 'refScrollXWrapperElem',
          class: 'vxe-gantt-view--scroll-x-wrapper'
        }, [
          h('div', {
            ref: 'refScrollXHandleElem',
            class: 'vxe-gantt-view--scroll-x-handle',
            on: {
              scroll: $xeGanttView.triggerVirtualScrollXEvent
            }
          }, [
            h('div', {
              ref: 'refScrollXSpaceElem',
              class: 'vxe-gantt-view--scroll-x-space'
            })
          ])
        ]),
        h('div', {
          ref: 'refScrollXRightCornerElem',
          class: 'vxe-gantt-view--scroll-x-right-corner'
        })
      ])
    },
    renderScrollY (h: CreateElement) {
      const $xeGanttView = this

      return h('div', {
        ref: 'refScrollYVirtualElem',
        class: 'vxe-gantt-view--scroll-y-virtual'
      }, [
        h('div', {
          ref: 'refScrollYTopCornerElem',
          class: 'vxe-gantt-view--scroll-y-top-corner'
        }),
        h('div', {
          ref: 'refScrollYWrapperElem',
          class: 'vxe-gantt-view--scroll-y-wrapper'
        }, [
          h('div', {
            ref: 'refScrollYHandleElem',
            class: 'vxe-gantt-view--scroll-y-handle',
            on: {
              scroll: $xeGanttView.triggerVirtualScrollYEvent
            }
          }, [
            h('div', {
              ref: 'refScrollYSpaceElem',
              class: 'vxe-gantt-view--scroll-y-space'
            })
          ])
        ]),
        h('div', {
          ref: 'refScrollYBottomCornerElem',
          class: 'vxe-gantt-view--scroll-y-bottom-corner'
        })
      ])
    },
    renderViewport (h: CreateElement) {
      return h('div', {
        class: 'vxe-gantt-view--viewport-wrapper'
      }, [
        h(GanttViewHeaderComponent),
        h(GanttViewBodyComponent)
      ])
    },
    renderBody (h: CreateElement) {
      const $xeGanttView = this
      const $xeGantt = $xeGanttView.$xeGantt

      const scrollbarYToLeft = $xeGantt.computeScrollbarYToLeft
      return h('div', {
        class: 'vxe-gantt-view--layout-wrapper'
      }, scrollbarYToLeft
        ? [
            $xeGanttView.renderScrollY(h),
            $xeGanttView.renderViewport(h)
          ]
        : [
            $xeGanttView.renderViewport(h),
            $xeGanttView.renderScrollY(h)
          ])
    },
    renderVN (h: CreateElement): VNode {
      const $xeGanttView = this
      const $xeGantt = $xeGanttView.$xeGantt
      const reactData = $xeGanttView.reactData

      const { overflowX, overflowY, scrollXLoad, scrollYLoad } = reactData
      const taskViewOpts = $xeGantt.computeTaskViewOpts
      const scrollbarXToTop = $xeGantt.computeScrollbarXToTop
      return h('div', {
        ref: 'refElem',
        class: ['vxe-gantt-view', `mode--${taskViewOpts.mode || 'day'}`, {
          'is--scroll-y': overflowY,
          'is--scroll-x': overflowX,
          'is--virtual-x': scrollXLoad,
          'is--virtual-y': scrollYLoad
        }]
      }, [
        h('div', {
          class: 'vxe-gantt-view--render-wrapper'
        }, scrollbarXToTop
          ? [
              $xeGanttView.renderScrollX(h),
              $xeGanttView.renderBody(h)
            ]
          : [
              $xeGanttView.renderBody(h),
              $xeGanttView.renderScrollX(h)
            ]),
        h('div', {
          class: 'vxe-gantt-view--render-vars'
        }, [
          h('div', {
            ref: 'refColInfoElem',
            class: 'vxe-gantt-view--column-info'
          })
        ])
      ])
    }
  },
  watch: {
    'reactData.tableData' () {
      const $xeGanttView = this

      handleUpdateData($xeGanttView)
    }
  },
  mounted () {
    const $xeGanttView = this

    globalEvents.on($xeGanttView, 'resize', $xeGanttView.handleGlobalResizeEvent)
  },
  beforeDestroy () {
    const $xeGanttView = this
    const internalData = $xeGanttView.internalData

    globalEvents.off($xeGanttView, 'keydown')
    XEUtils.assign(internalData, createInternalData())
  },
  render (this: any, h) {
    return this.renderVN(h)
  }
})
