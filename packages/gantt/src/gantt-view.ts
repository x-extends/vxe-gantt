import { VNode, CreateElement } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import { setScrollTop, setScrollLeft, removeClass, addClass } from '../../ui/src/dom'
import { getRefElem, getStandardGapTime, getTaskBarLeft, getTaskBarWidth } from './util'
import XEUtils from 'xe-utils'
import GanttViewHeaderComponent from './gantt-header'
import GanttViewBodyComponent from './gantt-body'
import GanttViewFooterComponent from './gantt-footer'

import type { TableReactData, TableInternalData, VxeTableConstructor, VxeTableMethods, VxeTablePrivateMethods } from 'vxe-table'
import type { VxeGanttViewConstructor, GanttViewReactData, VxeGanttDefines, VxeGanttViewPrivateMethods, GanttViewInternalData, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

const { globalEvents } = VxeUI

const sourceType = 'gantt'
const minuteMs = 1000 * 60
const dayMs = minuteMs * 60 * 24

function createInternalData (): GanttViewInternalData {
  return {
    xeTable: null,
    visibleColumn: [],
    startMaps: {},
    endMaps: {},
    chartMaps: {},
    todayDateMaps: {},
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
    // 最后滚动位置
    lastScrollTop: 0,
    lastScrollLeft: 0
  }
}
const maxYHeight = 5e6
// const maxXWidth = 5e6

function parseStringDate ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods, dateValue: any) {
  const $xeGantt = $xeGanttView.$xeGantt

  const taskOpts = $xeGantt.computeTaskOpts
  const { dateFormat } = taskOpts
  return XEUtils.toStringDate(dateValue, dateFormat || null)
}

function updateTodayData ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const $xeGantt = $xeGanttView.$xeGantt
  const internalData = $xeGanttView.internalData

  const ganttReactData = $xeGantt.reactData
  const { taskScaleList } = ganttReactData
  const weekScale = taskScaleList.find(item => item.type === 'week')
  const itemDate = new Date()
  const [yyyy, MM, dd, HH, mm, ss] = XEUtils.toDateString(itemDate, 'yyyy-M-d-H-m-s').split('-')
  const e = itemDate.getDay()
  const E = e + 1
  const q = Math.ceil((itemDate.getMonth() + 1) / 3)
  const W = XEUtils.getYearWeek(itemDate, weekScale ? weekScale.startDay : undefined)
  internalData.todayDateMaps = {
    year: yyyy,
    quarter: `${yyyy}_q${q}`,
    month: `${yyyy}_${MM}`,
    week: `${yyyy}_W${W}`,
    day: `${yyyy}_${MM}_${dd}_E${E}`,
    date: `${yyyy}_${MM}_${dd}`,
    hour: `${yyyy}_${MM}_${dd}_${HH}`,
    minute: `${yyyy}_${MM}_${dd}_${HH}_${mm}`,
    second: `${yyyy}_${MM}_${dd}_${HH}_${mm}_${ss}`
  }
}

function handleColumnHeader ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const $xeGantt = $xeGanttView.$xeGantt

  const ganttReactData = $xeGantt.reactData
  const { taskScaleList } = ganttReactData
  const scaleUnit = $xeGantt.computeScaleUnit
  const minScale = $xeGantt.computeMinScale
  const weekScale = $xeGantt.computeWeekScale
  const scaleDateList = $xeGanttView.computeScaleDateList
  const fullCols: VxeGanttDefines.ViewColumn[] = []
  const groupCols: VxeGanttDefines.GroupColumn[] = []

  if (minScale && scaleUnit && scaleDateList.length) {
    const renderListMaps: Record<VxeGanttDefines.ColumnScaleType, VxeGanttDefines.ViewColumn[]> = {
      year: [],
      quarter: [],
      month: [],
      week: [],
      day: [],
      date: [],
      hour: [],
      minute: [],
      second: []
    }

    const tempTypeMaps: Record<VxeGanttDefines.ColumnScaleType, Record<string, VxeGanttDefines.ViewColumn>> = {
      year: {},
      quarter: {},
      month: {},
      week: {},
      day: {},
      date: {},
      hour: {},
      minute: {},
      second: {}
    }

    const handleData = (type: VxeGanttDefines.ColumnScaleType, colMaps: Record<VxeGanttDefines.ColumnScaleType, VxeGanttDefines.ViewColumn>, minCol: VxeGanttDefines.ViewColumn) => {
      if (minScale.type === type) {
        return
      }
      const currCol = colMaps[type]
      const currKey = `${currCol.field}`
      let currGpCol = tempTypeMaps[type][currKey]
      if (!currGpCol) {
        currGpCol = currCol
        tempTypeMaps[type][currKey] = currGpCol
        renderListMaps[type].push(currGpCol)
      }
      if (currGpCol) {
        if (!currGpCol.children) {
          currGpCol.children = []
        }
        currGpCol.children.push(minCol)
      }
    }

    for (let i = 0; i < scaleDateList.length; i++) {
      const itemDate = scaleDateList[i]
      const [yy, yyyy, M, MM, d, dd, H, HH, m, mm, s, ss] = XEUtils.toDateString(itemDate, 'yy-yyyy-M-MM-d-dd-H-HH-m-mm-s-ss').split('-')
      const e = itemDate.getDay()
      const E = e + 1
      const q = Math.ceil((itemDate.getMonth() + 1) / 3)
      const W = `${XEUtils.getYearWeek(itemDate, weekScale ? weekScale.startDay : undefined)}`
      const WW = XEUtils.padStart(W, 2, '0')
      const dateObj: VxeGanttDefines.ScaleDateObj = { date: itemDate, yy, yyyy, M, MM, d, dd, H, HH, m, mm, s, ss, q, W, WW, E, e }
      const colMaps: Record<VxeGanttDefines.ColumnScaleType, VxeGanttDefines.ViewColumn> = {
        year: {
          field: yyyy,
          title: yyyy,
          dateObj
        },
        quarter: {
          field: `${yyyy}_q${q}`,
          title: `${q}`,
          dateObj
        },
        month: {
          field: `${yyyy}_${MM}`,
          title: MM,
          dateObj
        },
        week: {
          field: `${yyyy}_W${W}`,
          title: `${W}`,
          dateObj
        },
        day: {
          field: `${yyyy}_${MM}_${dd}_E${E}`,
          title: `${E}`,
          dateObj
        },
        date: {
          field: `${yyyy}_${MM}_${dd}`,
          title: dd,
          dateObj
        },
        hour: {
          field: `${yyyy}_${MM}_${dd}_${HH}`,
          title: HH,
          dateObj
        },
        minute: {
          field: `${yyyy}_${MM}_${dd}_${HH}_${mm}`,
          title: mm,
          dateObj
        },
        second: {
          field: `${yyyy}_${MM}_${dd}_${HH}_${mm}_${ss}`,
          title: ss,
          dateObj
        }
      }
      const minCol = colMaps[minScale.type]
      if (minScale.level < 19) {
        handleData('year', colMaps, minCol)
      }
      if (minScale.level < 17) {
        handleData('quarter', colMaps, minCol)
      }
      if (minScale.level < 15) {
        handleData('month', colMaps, minCol)
      }
      if (minScale.level < 13) {
        handleData('week', colMaps, minCol)
      }
      if (minScale.level < 11) {
        handleData('day', colMaps, minCol)
      }
      if (minScale.level < 9) {
        handleData('date', colMaps, minCol)
      }
      if (minScale.level < 7) {
        handleData('hour', colMaps, minCol)
      }
      if (minScale.level < 5) {
        handleData('minute', colMaps, minCol)
      }
      if (minScale.level < 3) {
        handleData('second', colMaps, minCol)
      }

      fullCols.push(minCol)
    }

    taskScaleList.forEach(scaleItem => {
      if (scaleItem.type === minScale.type) {
        groupCols.push({
          scaleItem,
          columns: fullCols
        })
        return
      }
      const list = renderListMaps[scaleItem.type] || []
      if (list) {
        list.forEach(item => {
          item.childCount = item.children ? item.children.length : 0
          item.children = undefined
        })
      }
      groupCols.push({
        scaleItem,
        columns: list
      })
    })
  }

  return {
    fullCols,
    groupCols
  }
}

function createChartRender ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods, fullCols: VxeGanttDefines.ViewColumn[]) {
  const $xeGantt = $xeGanttView.$xeGantt
  const reactData = $xeGanttView.reactData

  const { minViewDate } = reactData
  const minScale = $xeGantt.computeMinScale
  const scaleUnit = $xeGantt.computeScaleUnit
  const weekScale = $xeGantt.computeWeekScale
  switch (scaleUnit) {
    case 'year': {
      const indexMaps: Record<string, number> = {}
      fullCols.forEach(({ dateObj }, i) => {
        const yyyyMM = XEUtils.toDateString(dateObj.date, 'yyyy')
        indexMaps[yyyyMM] = i
      })
      return (startValue: any, endValue: any) => {
        const startDate = parseStringDate($xeGanttView, startValue)
        const endDate = parseStringDate($xeGanttView, endValue)
        const startStr = XEUtils.toDateString(startDate, 'yyyy')
        const startFirstDate = XEUtils.getWhatYear(startDate, 0, 'first')
        const endStr = XEUtils.toDateString(endDate, 'yyyy')
        const endFirstDate = XEUtils.getWhatYear(endDate, 0, 'first')
        const dateSize = Math.floor((XEUtils.getWhatYear(endDate, 1, 'first').getTime() - endFirstDate.getTime()) / dayMs)
        const subtract = (startDate.getTime() - startFirstDate.getTime()) / dayMs / dateSize
        const addSize = Math.max(0, (endDate.getTime() - endFirstDate.getTime()) / dayMs + 1) / dateSize
        const offsetLeftSize = (indexMaps[startStr] || 0) + subtract
        return {
          offsetLeftSize,
          offsetWidthSize: (indexMaps[endStr] || 0) - offsetLeftSize + addSize + 1
        }
      }
    }
    case 'quarter': {
      const indexMaps: Record<string, number> = {}
      fullCols.forEach(({ dateObj }, i) => {
        const q = XEUtils.toDateString(dateObj.date, 'yyyy-q')
        indexMaps[q] = i
      })
      return (startValue: any, endValue: any) => {
        const startDate = parseStringDate($xeGanttView, startValue)
        const endDate = parseStringDate($xeGanttView, endValue)
        const startStr = XEUtils.toDateString(startDate, 'yyyy-q')
        const startFirstDate = XEUtils.getWhatQuarter(startDate, 0, 'first')
        const endStr = XEUtils.toDateString(endDate, 'yyyy-q')
        const endFirstDate = XEUtils.getWhatQuarter(endDate, 0, 'first')
        const dateSize = Math.floor((XEUtils.getWhatQuarter(endDate, 1, 'first').getTime() - endFirstDate.getTime()) / dayMs)
        const subtract = (startDate.getTime() - startFirstDate.getTime()) / dayMs / dateSize
        const addSize = Math.max(0, (endDate.getTime() - endFirstDate.getTime()) / dayMs + 1) / dateSize
        const offsetLeftSize = (indexMaps[startStr] || 0) + subtract
        return {
          offsetLeftSize,
          offsetWidthSize: (indexMaps[endStr] || 0) - offsetLeftSize + addSize + 1
        }
      }
    }
    case 'month': {
      const indexMaps: Record<string, number> = {}
      fullCols.forEach(({ dateObj }, i) => {
        const yyyyMM = XEUtils.toDateString(dateObj.date, 'yyyy-MM')
        indexMaps[yyyyMM] = i
      })
      return (startValue: any, endValue: any) => {
        const startDate = parseStringDate($xeGanttView, startValue)
        const endDate = parseStringDate($xeGanttView, endValue)
        const startStr = XEUtils.toDateString(startDate, 'yyyy-MM')
        const startFirstDate = XEUtils.getWhatMonth(startDate, 0, 'first')
        const endStr = XEUtils.toDateString(endDate, 'yyyy-MM')
        const endFirstDate = XEUtils.getWhatMonth(endDate, 0, 'first')
        const dateSize = Math.floor((XEUtils.getWhatMonth(endDate, 1, 'first').getTime() - endFirstDate.getTime()) / dayMs)
        const subtract = (startDate.getTime() - startFirstDate.getTime()) / dayMs / dateSize
        const addSize = Math.max(0, (endDate.getTime() - endFirstDate.getTime()) / dayMs + 1) / dateSize
        const offsetLeftSize = (indexMaps[startStr] || 0) + subtract
        return {
          offsetLeftSize,
          offsetWidthSize: (indexMaps[endStr] || 0) - offsetLeftSize + addSize + 1
        }
      }
    }
    case 'week': {
      const indexMaps: Record<string, number> = {}
      fullCols.forEach(({ dateObj }, i) => {
        const yyyyW = XEUtils.toDateString(dateObj.date, 'yyyy-W', { firstDay: weekScale ? weekScale.startDay : undefined })
        indexMaps[yyyyW] = i
      })
      return (startValue: any, endValue: any) => {
        const startDate = parseStringDate($xeGanttView, startValue)
        const endDate = parseStringDate($xeGanttView, endValue)
        const startStr = XEUtils.toDateString(startDate, 'yyyy-W', { firstDay: weekScale ? weekScale.startDay : undefined })
        const startFirstDate = XEUtils.getWhatWeek(startDate, 0, weekScale ? weekScale.startDay : undefined, weekScale ? weekScale.startDay : undefined)
        const endStr = XEUtils.toDateString(endDate, 'yyyy-W', { firstDay: weekScale ? weekScale.startDay : undefined })
        const endFirstDate = XEUtils.getWhatWeek(endDate, 0, weekScale ? weekScale.startDay : undefined, weekScale ? weekScale.startDay : undefined)
        const dateSize = Math.floor((XEUtils.getWhatWeek(endDate, 1, weekScale ? weekScale.startDay : undefined, weekScale ? weekScale.startDay : undefined).getTime() - endFirstDate.getTime()) / dayMs)
        const subtract = (startDate.getTime() - startFirstDate.getTime()) / dayMs / dateSize
        const addSize = Math.max(0, (endDate.getTime() - endFirstDate.getTime()) / dayMs + 1) / dateSize
        const offsetLeftSize = (indexMaps[startStr] || 0) + subtract
        return {
          offsetLeftSize,
          offsetWidthSize: (indexMaps[endStr] || 0) - offsetLeftSize + addSize + 1
        }
      }
    }
    case 'day':
    case 'date': {
      const indexMaps: Record<string, number> = {}
      fullCols.forEach(({ dateObj }, i) => {
        const yyyyMM = XEUtils.toDateString(dateObj.date, 'yyyy-MM-dd')
        indexMaps[yyyyMM] = i
      })
      return (startValue: any, endValue: any) => {
        const startDate = parseStringDate($xeGanttView, startValue)
        const endDate = parseStringDate($xeGanttView, endValue)
        const startStr = XEUtils.toDateString(startDate, 'yyyy-MM-dd')
        const startFirstDate = XEUtils.getWhatDay(startDate, 0, 'first')
        const endStr = XEUtils.toDateString(endDate, 'yyyy-MM-dd')
        const endFirstDate = XEUtils.getWhatDay(endDate, 0, 'first')
        const minuteSize = Math.floor((XEUtils.getWhatDay(endDate, 1, 'first').getTime() - endFirstDate.getTime()) / minuteMs)
        const subtract = (startDate.getTime() - startFirstDate.getTime()) / minuteMs / minuteSize
        const addSize = Math.max(0, (endDate.getTime() - endFirstDate.getTime()) / minuteMs + 1) / minuteSize
        const offsetLeftSize = (indexMaps[startStr] || 0) + subtract
        return {
          offsetLeftSize,
          offsetWidthSize: (indexMaps[endStr] || 0) - offsetLeftSize + addSize + 1
        }
      }
    }
    case 'hour': {
      const indexMaps: Record<string, number> = {}
      fullCols.forEach(({ dateObj }, i) => {
        const yyyyMM = XEUtils.toDateString(dateObj.date, 'yyyy-MM-dd HH')
        indexMaps[yyyyMM] = i
      })
      return (startValue: any, endValue: any) => {
        const startDate = parseStringDate($xeGanttView, startValue)
        const endDate = parseStringDate($xeGanttView, endValue)
        const startStr = XEUtils.toDateString(startDate, 'yyyy-MM-dd HH')
        const startFirstDate = XEUtils.getWhatHours(startDate, 0, 'first')
        const endStr = XEUtils.toDateString(endDate, 'yyyy-MM-dd HH')
        const endFirstDate = XEUtils.getWhatHours(endDate, 0, 'first')
        const minuteSize = Math.floor((XEUtils.getWhatHours(endDate, 1, 'first').getTime() - endFirstDate.getTime()) / minuteMs)
        const subtract = (startDate.getTime() - startFirstDate.getTime()) / minuteMs / minuteSize
        const addSize = Math.max(0, (endDate.getTime() - endFirstDate.getTime()) / minuteMs + 1) / minuteSize
        const offsetLeftSize = (indexMaps[startStr] || 0) + subtract
        return {
          offsetLeftSize,
          offsetWidthSize: (indexMaps[endStr] || 0) - offsetLeftSize + addSize + 1
        }
      }
    }
    case 'minute': {
      const indexMaps: Record<string, number> = {}
      fullCols.forEach(({ dateObj }, i) => {
        const yyyyMM = XEUtils.toDateString(dateObj.date, 'yyyy-MM-dd HH:mm')
        indexMaps[yyyyMM] = i
      })
      return (startValue: any, endValue: any) => {
        const startDate = parseStringDate($xeGanttView, startValue)
        const endDate = parseStringDate($xeGanttView, endValue)
        const startStr = XEUtils.toDateString(startDate, 'yyyy-MM-dd HH:mm')
        const startFirstDate = XEUtils.getWhatMinutes(startDate, 0, 'first')
        const endStr = XEUtils.toDateString(endDate, 'yyyy-MM-dd HH:mm')
        const endFirstDate = XEUtils.getWhatMinutes(endDate, 0, 'first')
        const minuteSize = Math.floor((XEUtils.getWhatMinutes(endDate, 1, 'first').getTime() - endFirstDate.getTime()) / minuteMs)
        const subtract = (startDate.getTime() - startFirstDate.getTime()) / minuteMs / minuteSize
        const addSize = Math.max(0, (endDate.getTime() - endFirstDate.getTime()) / minuteMs + 1) / minuteSize
        const offsetLeftSize = (indexMaps[startStr] || 0) + subtract
        return {
          offsetLeftSize,
          offsetWidthSize: (indexMaps[endStr] || 0) - offsetLeftSize + addSize + 1
        }
      }
    }
    case 'second': {
      const gapTime = getStandardGapTime(minScale.type)
      return (startValue: any, endValue: any) => {
        const startDate = parseStringDate($xeGanttView, startValue)
        const endDate = parseStringDate($xeGanttView, endValue)
        let offsetLeftSize = 0
        let offsetWidthSize = 0
        if (minViewDate) {
          offsetLeftSize = (startDate.getTime() - minViewDate.getTime()) / gapTime
          offsetWidthSize = ((endDate.getTime() - startDate.getTime()) / gapTime) + 1
        }
        return {
          offsetLeftSize,
          offsetWidthSize
        }
      }
    }
  }
  return () => {
    return {
      offsetLeftSize: 0,
      offsetWidthSize: 0
    }
  }
}

function handleParseColumn ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const $xeGantt = $xeGanttView.$xeGantt
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const ganttProps = $xeGantt
  const { treeConfig } = ganttProps
  const { minViewDate, maxViewDate } = reactData
  const { fullCols, groupCols } = handleColumnHeader($xeGanttView)
  if (minViewDate && maxViewDate) {
    const $xeTable = internalData.xeTable
    if ($xeTable) {
      const startField = $xeGantt.computeStartField
      const endField = $xeGantt.computeEndField
      const tableReactData = $xeTable as unknown as TableReactData
      const { isRowGroupStatus } = tableReactData
      const tableInternalData = $xeTable as unknown as TableInternalData
      const { afterFullData, afterTreeFullData, afterGroupFullData } = tableInternalData
      const aggregateOpts = $xeTable.computeAggregateOpts
      const treeOpts = $xeTable.computeTreeOpts
      const { transform } = treeOpts
      const childrenField = treeOpts.children || treeOpts.childrenField

      const ctMaps: Record<string, VxeGanttDefines.RowCacheItem> = {}
      const renderFn = createChartRender($xeGanttView, fullCols)
      const handleParseRender = (row: any) => {
        const rowid = $xeTable.getRowid(row)
        const startValue = XEUtils.get(row, startField)
        const endValue = XEUtils.get(row, endField)
        if (startValue && endValue) {
          const { offsetLeftSize, offsetWidthSize } = renderFn(startValue, endValue)
          ctMaps[rowid] = {
            row,
            rowid,
            oLeftSize: offsetLeftSize,
            oWidthSize: offsetWidthSize
          }
        }
      }

      if (isRowGroupStatus) {
        // 行分组
        const mapChildrenField = aggregateOpts.mapChildrenField
        if (mapChildrenField) {
          XEUtils.eachTree(afterGroupFullData, handleParseRender, { children: mapChildrenField })
        }
      } else if (treeConfig) {
        // 树结构
        XEUtils.eachTree(afterTreeFullData, handleParseRender, { children: transform ? treeOpts.mapChildrenField : childrenField })
      } else {
        afterFullData.forEach(handleParseRender)
      }
      internalData.chartMaps = ctMaps
    }
  }
  internalData.visibleColumn = fullCols
  reactData.headerGroups = groupCols
  updateTodayData($xeGanttView)
  updateScrollXStatus($xeGanttView)
  handleTableColumn($xeGanttView)
}

function handleUpdateData ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const $xeGantt = $xeGanttView.$xeGantt
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const ganttProps = $xeGantt
  const { treeConfig } = ganttProps
  const { scrollXStore } = internalData
  const $xeTable = internalData.xeTable
  const sdMaps: Record<string, any> = {}
  const edMaps: Record<string, any> = {}
  let minDate: Date | null = null
  let maxDate: Date | null = null
  if ($xeTable) {
    const startField = $xeGantt.computeStartField
    const endField = $xeGantt.computeEndField
    const tableReactData = $xeTable as unknown as TableReactData
    const { isRowGroupStatus } = tableReactData
    const tableInternalData = $xeTable as unknown as TableInternalData
    const { afterFullData, afterTreeFullData, afterGroupFullData } = tableInternalData
    const aggregateOpts = $xeTable.computeAggregateOpts
    const treeOpts = $xeTable.computeTreeOpts
    const { transform } = treeOpts
    const childrenField = treeOpts.children || treeOpts.childrenField

    const handleMinMaxData = (row: any) => {
      const startValue = XEUtils.get(row, startField)
      const endValue = XEUtils.get(row, endField)
      if (startValue && endValue) {
        const startDate = parseStringDate($xeGanttView, startValue)
        if (!minDate || minDate.getTime() > startDate.getTime()) {
          minDate = startDate
        }
        const endDate = parseStringDate($xeGanttView, endValue)
        if (!maxDate || maxDate.getTime() < endDate.getTime()) {
          maxDate = endDate
        }
      }
    }

    if (isRowGroupStatus) {
      // 行分组
      const mapChildrenField = aggregateOpts.mapChildrenField
      if (mapChildrenField) {
        XEUtils.eachTree(afterGroupFullData, handleMinMaxData, { children: mapChildrenField })
      }
    } else if (treeConfig) {
      // 树结构
      XEUtils.eachTree(afterTreeFullData, handleMinMaxData, { children: transform ? treeOpts.mapChildrenField : childrenField })
    } else {
      afterFullData.forEach(handleMinMaxData)
    }
  }
  scrollXStore.startIndex = 0
  scrollXStore.endIndex = Math.max(1, scrollXStore.visibleSize)
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

function updateTaskChart ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const $xeGantt = $xeGanttView.$xeGantt
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData
  const ganttInternalData = $xeGantt.internalData
  const $xeTable = internalData.xeTable

  const { dragBarRow } = ganttInternalData
  const { viewCellWidth } = reactData
  const { elemStore, chartMaps } = internalData
  const chartWrapper = getRefElem(elemStore['main-chart-task-wrapper'])
  if (chartWrapper && $xeTable) {
    XEUtils.arrayEach(chartWrapper.children, (rowEl) => {
      const barEl = rowEl.children[0] as HTMLDivElement
      if (!barEl) {
        return
      }
      const rowid = rowEl.getAttribute('rowid')
      if (dragBarRow && $xeTable.getRowid(dragBarRow) === rowid) {
        return
      }
      const chartRest = rowid ? chartMaps[rowid] : null
      barEl.style.left = `${getTaskBarLeft(chartRest, viewCellWidth)}px`
      barEl.style.width = `${getTaskBarWidth(chartRest, viewCellWidth)}px`
    })
  }
  return $xeGanttView.$nextTick()
}

function updateStyle ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const $xeGantt = $xeGanttView.$xeGantt as VxeGanttConstructor & VxeGanttPrivateMethods
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const { scrollbarWidth, scrollbarHeight, headerGroups, tableColumn } = reactData
  const { elemStore, visibleColumn } = internalData
  const $xeTable = internalData.xeTable

  const el = $xeGanttView.$refs.refElem as HTMLDivElement
  if (!el) {
    return
  }
  if (!$xeGantt) {
    return
  }

  const scrollbarOpts = $xeGantt.computeScrollbarOpts
  const scrollbarXToTop = $xeGantt.computeScrollbarXToTop
  const scrollbarYToLeft = $xeGantt.computeScrollbarYToLeft

  const xLeftCornerEl = $xeGanttView.$refs.refScrollXLeftCornerElem as HTMLDivElement
  const xRightCornerEl = $xeGanttView.$refs.refScrollXRightCornerElem as HTMLDivElement
  const scrollXVirtualEl = $xeGanttView.$refs.refScrollXVirtualElem as HTMLDivElement

  let osbWidth = scrollbarWidth
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

  let yScrollbarVisible = 'visible'
  if (scrollbarYToLeft || (scrollbarOpts.y && scrollbarOpts.y.visible === false)) {
    osbWidth = 0
    yScrollbarVisible = 'hidden'
  }

  const headerScrollElem = getRefElem(elemStore['main-header-scroll'])
  if (headerScrollElem) {
    headerScrollElem.style.height = `${tHeaderHeight}px`
    headerScrollElem.style.setProperty('--vxe-ui-gantt-view-cell-height', `${tHeaderHeight / headerGroups.length}px`)
  }
  const bodyScrollElem = getRefElem(elemStore['main-body-scroll'])
  if (bodyScrollElem) {
    bodyScrollElem.style.height = `${tbHeight}px`
  }
  const footerScrollElem = getRefElem(elemStore['main-footer-scroll'])
  if (footerScrollElem) {
    footerScrollElem.style.height = `${tFooterHeight}px`
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
    scrollYVirtualEl.style.visibility = yScrollbarVisible
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
  let viewCellWidth = 40
  if (colInfoElem) {
    viewCellWidth = colInfoElem.clientWidth || 40
  }
  let viewTableWidth = viewCellWidth * visibleColumn.length
  if (bodyScrollElem) {
    const viewWidth = bodyScrollElem.clientWidth
    const remainWidth = viewWidth - viewTableWidth
    if (remainWidth > 0) {
      viewCellWidth += remainWidth / visibleColumn.length
      viewTableWidth = viewWidth
    }
  }
  reactData.viewCellWidth = viewCellWidth
  const headerTableElem = getRefElem(elemStore['main-header-table'])
  const bodyTableElem = getRefElem(elemStore['main-body-table'])
  const vmTableWidth = viewCellWidth * tableColumn.length
  if (headerTableElem) {
    headerTableElem.style.width = `${viewTableWidth}px`
  }
  if (bodyTableElem) {
    bodyTableElem.style.width = `${vmTableWidth}px`
  }

  reactData.scrollXWidth = viewTableWidth

  return Promise.all([
    updateTaskChart($xeGanttView),
    $xeGantt.handleUpdateTaskLink ? $xeGantt.handleUpdateTaskLink($xeGanttView) : null
  ])
}

function handleRecalculateStyle ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const internalData = $xeGanttView.internalData
  const $xeGantt = $xeGanttView.$xeGantt

  const el = $xeGanttView.$refs.refElem as HTMLDivElement
  internalData.rceRunTime = Date.now()
  if (!el || !el.clientWidth) {
    return $xeGanttView.$nextTick()
  }
  if (!$xeGantt) {
    return $xeGanttView.$nextTick()
  }
  calcScrollbar($xeGanttView)
  updateStyle($xeGanttView)
  return computeScrollLoad($xeGanttView)
}

function handleLazyRecalculate ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const internalData = $xeGanttView.internalData

  return new Promise<void>(resolve => {
    const { rceTimeout, rceRunTime } = internalData
    const $xeTable = internalData.xeTable
    let refreshDelay = 30
    if ($xeTable) {
      const resizeOpts = $xeTable.computeResizeOpts
      refreshDelay = resizeOpts.refreshDelay || refreshDelay
    }
    if (rceTimeout) {
      clearTimeout(rceTimeout)
      if (rceRunTime && rceRunTime + (refreshDelay - 5) < Date.now()) {
        resolve(
          handleRecalculateStyle($xeGanttView)
        )
      } else {
        $xeGanttView.$nextTick(() => {
          resolve()
        })
      }
    } else {
      resolve(
        handleRecalculateStyle($xeGanttView)
      )
    }
    internalData.rceTimeout = setTimeout(() => {
      internalData.rceTimeout = undefined
      handleRecalculateStyle($xeGanttView)
    }, refreshDelay)
  })
}

function computeScrollLoad ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  return $xeGanttView.$nextTick().then(() => {
    const { scrollXLoad } = reactData
    const { scrollXStore } = internalData
    // 计算 X 逻辑
    if (scrollXLoad) {
      const { toVisibleIndex: toXVisibleIndex, visibleSize: visibleXSize } = handleVirtualXVisible($xeGanttView)
      const offsetXSize = 2
      scrollXStore.preloadSize = 1
      scrollXStore.offsetSize = offsetXSize
      scrollXStore.visibleSize = visibleXSize
      scrollXStore.endIndex = Math.max(scrollXStore.startIndex + scrollXStore.visibleSize + offsetXSize, scrollXStore.endIndex)
      scrollXStore.visibleStartIndex = Math.max(scrollXStore.startIndex, toXVisibleIndex)
      scrollXStore.visibleEndIndex = Math.min(scrollXStore.endIndex, toXVisibleIndex + visibleXSize)
      updateScrollXData($xeGanttView).then(() => {
        loadScrollXData($xeGanttView)
      })
    } else {
      updateScrollXSpace($xeGanttView)
    }
  })
}

function handleVirtualXVisible ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const { viewCellWidth } = reactData
  const { elemStore } = internalData
  const bodyScrollElem = getRefElem(elemStore['main-body-scroll'])
  if (bodyScrollElem) {
    const clientWidth = bodyScrollElem.clientWidth
    const scrollLeft = bodyScrollElem.scrollLeft
    const toVisibleIndex = Math.floor(scrollLeft / viewCellWidth) - 1
    const visibleSize = Math.ceil(clientWidth / viewCellWidth) + 1
    return { toVisibleIndex: Math.max(0, toVisibleIndex), visibleSize: Math.max(1, visibleSize) }
  }
  return { toVisibleIndex: 0, visibleSize: 6 }
}

function loadScrollXData ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const { isScrollXBig } = reactData
  const { scrollXStore } = internalData
  const { preloadSize, startIndex, endIndex, offsetSize } = scrollXStore
  const { toVisibleIndex, visibleSize } = handleVirtualXVisible($xeGanttView)
  const offsetItem = {
    startIndex: Math.max(0, isScrollXBig ? toVisibleIndex - 1 : toVisibleIndex - 1 - offsetSize - preloadSize),
    endIndex: isScrollXBig ? toVisibleIndex + visibleSize : toVisibleIndex + visibleSize + offsetSize + preloadSize
  }
  scrollXStore.visibleStartIndex = toVisibleIndex - 1
  scrollXStore.visibleEndIndex = toVisibleIndex + visibleSize + 1
  const { startIndex: offsetStartIndex, endIndex: offsetEndIndex } = offsetItem
  if (toVisibleIndex <= startIndex || toVisibleIndex >= endIndex - visibleSize - 1) {
    if (startIndex !== offsetStartIndex || endIndex !== offsetEndIndex) {
      scrollXStore.startIndex = offsetStartIndex
      scrollXStore.endIndex = offsetEndIndex
      updateScrollXData($xeGanttView)
    }
  }
}

function updateScrollXData ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  handleTableColumn($xeGanttView)
  updateScrollXSpace($xeGanttView)
  return $xeGanttView.$nextTick()
}

function updateScrollXStatus ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const reactData = $xeGanttView.reactData

  const scrollXLoad = true
  reactData.scrollXLoad = scrollXLoad
  return scrollXLoad
}

function handleTableColumn ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const { scrollXLoad } = reactData
  const { visibleColumn, scrollXStore } = internalData
  const tableColumn = scrollXLoad ? visibleColumn.slice(scrollXStore.startIndex, scrollXStore.endIndex) : visibleColumn.slice(0)
  reactData.tableColumn = tableColumn
}

function updateScrollXSpace ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  const { scrollXLoad, scrollXWidth, viewCellWidth } = reactData
  const { elemStore, scrollXStore } = internalData
  const bodyTableElem = getRefElem(elemStore['main-body-table'])
  // const headerTableElem = getRefElem(elemStore['main-header-table'])
  // const footerTableElem = getRefElem(elemStore['main-footer-table'])

  const { startIndex } = scrollXStore
  let xSpaceLeft = 0
  if (scrollXLoad) {
    xSpaceLeft = Math.max(0, startIndex * viewCellWidth)
  }

  // if (headerTableElem) {
  //   headerTableElem.style.transform = `translate(${xSpaceLeft}px, 0px)`
  // }
  if (bodyTableElem) {
    bodyTableElem.style.transform = `translate(${xSpaceLeft}px, ${reactData.scrollYTop || 0}px)`
  }
  // if (footerTableElem) {
  //   footerTableElem.style.transform = `translate(${xSpaceLeft}px, 0px)`
  // }

  const layoutList = ['header', 'body', 'footer']
  layoutList.forEach(layout => {
    const xSpaceElem = getRefElem(elemStore[`main-${layout}-xSpace`])
    if (xSpaceElem) {
      xSpaceElem.style.width = scrollXLoad ? `${scrollXWidth}px` : ''
    }
  })

  const scrollXSpaceEl = $xeGanttView.$refs.refScrollXSpaceElem as HTMLDivElement
  if (scrollXSpaceEl) {
    scrollXSpaceEl.style.width = `${scrollXWidth}px`
  }

  const lineWrapper = getRefElem(elemStore['main-chart-line-wrapper'])
  const svgElem = lineWrapper ? lineWrapper.firstElementChild as HTMLDivElement : null
  if (svgElem) {
    svgElem.style.width = `${scrollXWidth}px`
  }

  calcScrollbar($xeGanttView)
  return $xeGanttView.$nextTick()
}

function triggerScrollXEvent ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods) {
  loadScrollXData($xeGanttView)
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

  const bodyChartWrapperElem = getRefElem(elemStore['main-chart-task-wrapper'])
  if (bodyTableElem) {
    bodyTableElem.style.transform = `translate(${reactData.scrollXLeft || 0}px, ${scrollYTop}px)`
  }
  if (bodyChartWrapperElem) {
    bodyChartWrapperElem.style.transform = `translate(${reactData.scrollXLeft || 0}px, ${scrollYTop}px)`
  }

  const bodyYSpaceElem = getRefElem(elemStore['main-body-ySpace'])
  if (bodyYSpaceElem) {
    bodyYSpaceElem.style.height = ySpaceHeight ? `${ySpaceHeight}px` : ''
  }

  const scrollYSpaceEl = $xeGanttView.$refs.refScrollYSpaceElem as HTMLDivElement
  if (scrollYSpaceEl) {
    scrollYSpaceEl.style.height = ySpaceHeight ? `${ySpaceHeight}px` : ''
  }

  const lineWrapper = getRefElem(elemStore['main-chart-line-wrapper'])
  const svgElem = lineWrapper ? lineWrapper.firstElementChild as HTMLDivElement : null
  if (svgElem) {
    svgElem.style.height = ySpaceHeight ? `${ySpaceHeight}px` : ''
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

function handleScrollData ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods, isRollY: boolean, isRollX: boolean, scrollTop: number, scrollLeft: number) {
  const reactData = $xeGanttView.reactData
  const internalData = $xeGanttView.internalData

  if (isRollX) {
    internalData.lastScrollLeft = scrollLeft
  }
  if (isRollY) {
    internalData.lastScrollTop = scrollTop
  }
  reactData.lastScrollTime = Date.now()
  checkLastSyncScroll($xeGanttView, isRollX, isRollY)
}

function handleScrollEvent ($xeGanttView: VxeGanttViewConstructor & VxeGanttViewPrivateMethods, evnt: Event, isRollY: boolean, isRollX: boolean, scrollTop: number, scrollLeft: number) {
  const $xeGantt = $xeGanttView.$xeGantt
  const internalData = $xeGanttView.internalData
  const $xeTable = internalData.xeTable

  const { lastScrollLeft, lastScrollTop } = internalData
  const xHandleEl = $xeGanttView.$refs.refScrollXHandleElem as HTMLDivElement
  const yHandleEl = $xeGanttView.$refs.refScrollYHandleElem as HTMLDivElement
  if (!xHandleEl || !yHandleEl) {
    return
  }
  if (!$xeTable) {
    return
  }
  const bodyHeight = yHandleEl.clientHeight
  const bodyWidth = xHandleEl.clientWidth
  const scrollHeight = yHandleEl.scrollHeight
  const scrollWidth = xHandleEl.scrollWidth
  let isTop = false
  let isBottom = false
  let isLeft = false
  let isRight = false
  let direction = ''
  let isTopBoundary = false
  let isBottomBoundary = false
  let isLeftBoundary = false
  let isRightBoundary = false
  if (isRollX) {
    const xThreshold = $xeTable.computeScrollXThreshold
    isLeft = scrollLeft <= 0
    if (!isLeft) {
      isRight = scrollLeft + bodyWidth >= scrollWidth - 1
    }
    if (scrollLeft > lastScrollLeft) {
      direction = 'right'
      if (scrollLeft + bodyWidth >= scrollWidth - xThreshold) {
        isRightBoundary = true
      }
    } else {
      direction = 'left'
      if (scrollLeft <= xThreshold) {
        isLeftBoundary = true
      }
    }
  }
  if (isRollY) {
    const yThreshold = $xeTable.computeScrollYThreshold
    isTop = scrollTop <= 0
    if (!isTop) {
      isBottom = scrollTop + bodyHeight >= scrollHeight - 1
    }
    if (scrollTop > lastScrollTop) {
      direction = 'bottom'
      if (scrollTop + bodyHeight >= scrollHeight - yThreshold) {
        isBottomBoundary = true
      }
    } else {
      direction = 'top'
      if (scrollTop <= yThreshold) {
        isTopBoundary = true
      }
    }
  }
  handleScrollData($xeGanttView, isRollY, isRollX, scrollTop, scrollLeft)
  const evntParams = {
    source: sourceType,
    scrollTop,
    scrollLeft,
    bodyHeight,
    bodyWidth,
    scrollHeight,
    scrollWidth,
    isX: isRollX,
    isY: isRollY,
    isTop,
    isBottom,
    isLeft,
    isRight,
    direction
  }
  if (isBottomBoundary || isTopBoundary || isRightBoundary || isLeftBoundary) {
    $xeGantt.dispatchEvent('scroll-boundary', evntParams, evnt)
  }
  $xeGantt.dispatchEvent('scroll', evntParams, evnt)
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
      overflowY: true,
      // 是否存在横向滚动条
      overflowX: true,
      // 纵向滚动条的宽度
      scrollbarWidth: 0,
      // 横向滚动条的高度
      scrollbarHeight: 0,

      // 最后滚动时间戳
      lastScrollTime: 0,
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

      viewCellWidth: 40
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
    }),
    computeScaleDateList () {
      const $xeGanttView = this
      const $xeGantt = $xeGanttView.$xeGantt
      const reactData = $xeGanttView.reactData

      const { minViewDate, maxViewDate } = reactData
      const taskViewOpts = $xeGantt.computeTaskViewOpts
      const minScale = $xeGantt.computeMinScale
      const { gridding } = taskViewOpts
      const dateList: Date[] = []
      if (!minViewDate || !maxViewDate) {
        return dateList
      }

      const leftSize = -XEUtils.toNumber(gridding ? gridding.leftSpacing || 0 : 0)
      const rightSize = XEUtils.toNumber(gridding ? gridding.rightSpacing || 0 : 0)
      switch (minScale.type) {
        case 'year': {
          let currDate = XEUtils.getWhatYear(minViewDate, leftSize, 'first')
          const endDate = XEUtils.getWhatYear(maxViewDate, rightSize, 'first')
          while (currDate <= endDate) {
            const itemDate = currDate
            dateList.push(itemDate)
            currDate = XEUtils.getWhatYear(currDate, 1)
          }
          break
        }
        case 'quarter': {
          let currDate = XEUtils.getWhatQuarter(minViewDate, leftSize, 'first')
          const endDate = XEUtils.getWhatQuarter(maxViewDate, rightSize, 'first')
          while (currDate <= endDate) {
            const itemDate = currDate
            dateList.push(itemDate)
            currDate = XEUtils.getWhatQuarter(currDate, 1)
          }
          break
        }
        case 'month': {
          let currDate = XEUtils.getWhatMonth(minViewDate, leftSize, 'first')
          const endDate = XEUtils.getWhatMonth(maxViewDate, rightSize, 'first')
          while (currDate <= endDate) {
            const itemDate = currDate
            dateList.push(itemDate)
            currDate = XEUtils.getWhatMonth(currDate, 1)
          }
          break
        }
        case 'week': {
          let currDate = XEUtils.getWhatWeek(minViewDate, leftSize, minScale.startDay, minScale.startDay)
          const endDate = XEUtils.getWhatWeek(maxViewDate, rightSize, minScale.startDay, minScale.startDay)
          while (currDate <= endDate) {
            const itemDate = currDate
            dateList.push(itemDate)
            currDate = XEUtils.getWhatWeek(currDate, 1)
          }
          break
        }
        case 'day':
        case 'date': {
          let currDate = XEUtils.getWhatDay(minViewDate, leftSize, 'first')
          const endDate = XEUtils.getWhatDay(maxViewDate, rightSize, 'first')
          while (currDate <= endDate) {
            const itemDate = currDate
            dateList.push(itemDate)
            currDate = XEUtils.getWhatDay(currDate, 1)
          }
          break
        }
        case 'hour':
        case 'minute':
        case 'second': {
          const gapTime = getStandardGapTime(minScale.type)
          let currTime = minViewDate.getTime() + (leftSize * gapTime)
          const endTime = maxViewDate.getTime() + (rightSize * gapTime)
          while (currTime <= endTime) {
            const itemDate = new Date(currTime)
            dateList.push(itemDate)
            currTime += gapTime
          }
          break
        }
      }
      return dateList
    }
  },
  methods: {
    //
    // Method
    //
    refreshData (): Promise<void> {
      const $xeGanttView = this
      const internalData = $xeGanttView.internalData

      handleUpdateData($xeGanttView)
      handleRecalculateStyle($xeGanttView)
      return $xeGanttView.$nextTick().then(() => {
        const $xeTable = internalData.xeTable
        handleRecalculateStyle($xeGanttView)
        if ($xeTable) {
          return $xeTable.recalculate()
        }
      })
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
    handleUpdateCurrentRow (row: any) {
      const $xeGanttView = this
      const internalData = $xeGanttView.internalData

      const $xeTable = internalData.xeTable
      const el = $xeGanttView.$refs.refElem as HTMLDivElement
      if ($xeTable && el) {
        if (row) {
          const tableProps = $xeTable
          const rowOpts = $xeTable.computeRowOpts
          if (rowOpts.isCurrent || tableProps.highlightCurrentRow) {
            XEUtils.arrayEach(el.querySelectorAll(`[rowid="${$xeTable.getRowid(row)}"]`), elem => addClass(elem, 'row--current'))
          }
        } else {
          XEUtils.arrayEach(el.querySelectorAll('.row--current'), elem => removeClass(elem, 'row--current'))
        }
      }
    },
    handleUpdateHoverRow (row: any) {
      const $xeGanttView = this
      const internalData = $xeGanttView.internalData

      const $xeTable = internalData.xeTable
      const el = $xeGanttView.$refs.refElem as HTMLDivElement
      if ($xeTable && el) {
        if (row) {
          XEUtils.arrayEach(el.querySelectorAll(`.vxe-body--row[rowid="${$xeTable.getRowid(row)}"]`), elem => addClass(elem, 'row--hover'))
        } else {
          XEUtils.arrayEach(el.querySelectorAll('.vxe-body--row.row--hover'), elem => removeClass(elem, 'row--hover'))
        }
      }
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
      const reactData = $xeGanttView.reactData
      const internalData = $xeGanttView.internalData

      const { scrollXLoad } = reactData
      const { elemStore, inVirtualScroll, inHeaderScroll, inFooterScroll, lastScrollLeft, lastScrollTop } = internalData
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
      const scrollLeft = wrapperEl.scrollLeft
      const scrollTop = wrapperEl.scrollTop
      const isRollX = scrollLeft !== lastScrollLeft
      const isRollY = scrollTop !== lastScrollTop
      internalData.inBodyScroll = true
      internalData.scrollRenderType = ''
      if (isRollY) {
        setScrollTop(yHandleEl, scrollTop)
        syncTableScrollTop($xeGanttView, scrollTop)
      }
      if (isRollX) {
        internalData.inBodyScroll = true
        setScrollLeft(xHandleEl, scrollLeft)
        setScrollLeft(headerScrollElem, scrollLeft)
        if (scrollXLoad) {
          triggerScrollXEvent($xeGanttView)
        }
      }
      handleScrollEvent($xeGanttView, evnt, isRollY, isRollX, wrapperEl.scrollTop, scrollLeft)
    },
    // triggerFooterScrollEvent (evnt: Event) {
    //   const $xeGanttView = this
    //   const internalData = $xeGanttView.internalData

    //   const { inVirtualScroll, inHeaderScroll, inBodyScroll } = internalData
    //   if (inVirtualScroll) {
    //     return
    //   }
    //   if (inHeaderScroll || inBodyScroll) {
    //     return
    //   }
    //   const wrapperEl = evnt.currentTarget as HTMLDivElement
    //   if (wrapperEl) {
    //     const isRollX = true
    //     const isRollY = false
    //     const currLeftNum = wrapperEl.scrollLeft
    //     handleScrollEvent($xeGanttView, evnt, isRollY, isRollX, wrapperEl.scrollTop, currLeftNum)
    //   }
    // },
    triggerVirtualScrollXEvent (evnt: Event) {
      const $xeGanttView = this
      const reactData = $xeGanttView.reactData
      const internalData = $xeGanttView.internalData

      const { scrollXLoad } = reactData
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
        if (scrollXLoad) {
          triggerScrollXEvent($xeGanttView)
        }
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
    handleUpdateSXSpace () {
      const $xeGanttView = this

      return updateScrollXSpace($xeGanttView)
    },
    handleUpdateSYSpace () {
      const $xeGanttView = this

      return updateScrollYSpace($xeGanttView)
    },
    handleUpdateSYStatus (sYLoad: boolean) {
      const $xeGanttView = this
      const reactData = $xeGanttView.reactData

      reactData.scrollYLoad = sYLoad
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
          ]),
          h('div', {
            class: 'vxe-gantt-view--scroll-x-handle-appearance'
          })
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
          ]),
          h('div', {
            class: 'vxe-gantt-view--scroll-y-handle-appearance'
          })
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
        h(GanttViewBodyComponent),
        h(GanttViewFooterComponent)
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
      const scrollbarXToTop = $xeGantt.computeScrollbarXToTop
      return h('div', {
        ref: 'refElem',
        class: ['vxe-gantt-view', {
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
