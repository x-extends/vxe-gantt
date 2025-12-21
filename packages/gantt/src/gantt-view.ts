import { h, ref, reactive, nextTick, inject, watch, provide, computed, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { setScrollTop, setScrollLeft, removeClass, addClass } from '../../ui/src/dom'
import { VxeUI } from '@vxe-ui/core'
import { getRefElem, getStandardGapTime, getTaskBarLeft, getTaskBarWidth } from './util'
import XEUtils from 'xe-utils'
import GanttViewHeaderComponent from './gantt-header'
import GanttViewBodyComponent from './gantt-body'
import GanttViewFooterComponent from './gantt-footer'

import type { VxeGanttViewConstructor, GanttViewReactData, GanttViewPrivateRef, VxeGanttDefines, VxeGanttViewPrivateMethods, GanttViewInternalData, VxeGanttViewMethods, GanttViewPrivateComputed, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

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

export default defineVxeComponent({
  name: 'VxeGanttView',
  setup (props, context) {
    const xID = XEUtils.uniqueId()

    const $xeGantt = inject('$xeGantt', {} as (VxeGanttConstructor & VxeGanttPrivateMethods))

    const { internalData: ganttInternalData } = $xeGantt
    const { computeTaskOpts, computeTaskViewOpts, computeStartField, computeEndField, computeScrollbarOpts, computeScrollbarXToTop, computeScrollbarYToLeft, computeScaleUnit, computeWeekScale, computeMinScale } = $xeGantt.getComputeMaps()

    const refElem = ref<HTMLDivElement>()

    const refScrollXVirtualElem = ref<HTMLDivElement>()
    const refScrollYVirtualElem = ref<HTMLDivElement>()
    const refScrollXHandleElem = ref<HTMLDivElement>()
    const refScrollXLeftCornerElem = ref<HTMLDivElement>()
    const refScrollXRightCornerElem = ref<HTMLDivElement>()
    const refScrollYHandleElem = ref<HTMLDivElement>()
    const refScrollYTopCornerElem = ref<HTMLDivElement>()
    const refScrollXWrapperElem = ref<HTMLDivElement>()
    const refScrollYWrapperElem = ref<HTMLDivElement>()
    const refScrollYBottomCornerElem = ref<HTMLDivElement>()
    const refScrollXSpaceElem = ref<HTMLDivElement>()
    const refScrollYSpaceElem = ref<HTMLDivElement>()

    const refColInfoElem = ref<HTMLDivElement>()

    const reactData = reactive<GanttViewReactData>({
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
    })

    const internalData = createInternalData()

    const refMaps: GanttViewPrivateRef = {
      refElem
    }

    const computeScaleDateList = computed(() => {
      const { minViewDate, maxViewDate } = reactData
      const taskViewOpts = computeTaskViewOpts.value
      const minScale = computeMinScale.value
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
    })

    const computeMaps: GanttViewPrivateComputed = {
      computeScaleDateList
    }

    const $xeGanttView = {
      xID,
      props,
      context,
      reactData,
      internalData,

      getRefMaps: () => refMaps,
      getComputeMaps: () => computeMaps
    } as unknown as VxeGanttViewConstructor & VxeGanttViewPrivateMethods

    const parseStringDate = (dateValue: any) => {
      const taskOpts = computeTaskOpts.value
      const { dateFormat } = taskOpts
      return XEUtils.toStringDate(dateValue, dateFormat || null)
    }

    const updateTodayData = () => {
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

    const handleColumnHeader = () => {
      const ganttReactData = $xeGantt.reactData
      const { taskScaleList } = ganttReactData
      const scaleUnit = computeScaleUnit.value
      const minScale = computeMinScale.value
      const weekScale = computeWeekScale.value
      const scaleDateList = computeScaleDateList.value
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

    const createChartRender = (fullCols: VxeGanttDefines.ViewColumn[]) => {
      const { minViewDate } = reactData
      const minScale = computeMinScale.value
      const scaleUnit = computeScaleUnit.value
      const weekScale = computeWeekScale.value
      switch (scaleUnit) {
        case 'year': {
          const indexMaps: Record<string, number> = {}
          fullCols.forEach(({ dateObj }, i) => {
            const yyyyMM = XEUtils.toDateString(dateObj.date, 'yyyy')
            indexMaps[yyyyMM] = i
          })
          return (startValue: any, endValue: any) => {
            const startDate = parseStringDate(startValue)
            const endDate = parseStringDate(endValue)
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
            const startDate = parseStringDate(startValue)
            const endDate = parseStringDate(endValue)
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
            const startDate = parseStringDate(startValue)
            const endDate = parseStringDate(endValue)
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
            const startDate = parseStringDate(startValue)
            const endDate = parseStringDate(endValue)
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
            const startDate = parseStringDate(startValue)
            const endDate = parseStringDate(endValue)
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
            const startDate = parseStringDate(startValue)
            const endDate = parseStringDate(endValue)
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
            const startDate = parseStringDate(startValue)
            const endDate = parseStringDate(endValue)
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
            const startDate = parseStringDate(startValue)
            const endDate = parseStringDate(endValue)
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

    const handleParseColumn = () => {
      const ganttProps = $xeGantt.props
      const { treeConfig } = ganttProps
      const { minViewDate, maxViewDate } = reactData
      const { fullCols, groupCols } = handleColumnHeader()
      if (minViewDate && maxViewDate && fullCols.length) {
        const $xeTable = internalData.xeTable
        if ($xeTable) {
          const startField = computeStartField.value
          const endField = computeEndField.value
          const { computeAggregateOpts, computeTreeOpts } = $xeTable.getComputeMaps()
          const tableReactData = $xeTable.reactData
          const { isRowGroupStatus } = tableReactData
          const tableInternalData = $xeTable.internalData
          const { afterFullData, afterTreeFullData, afterGroupFullData } = tableInternalData
          const aggregateOpts = computeAggregateOpts.value
          const treeOpts = computeTreeOpts.value
          const { transform } = treeOpts
          const childrenField = treeOpts.children || treeOpts.childrenField

          const ctMaps: Record<string, VxeGanttDefines.RowCacheItem> = {}
          const renderFn = createChartRender(fullCols)
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
      updateTodayData()
      updateScrollXStatus()
      handleTableColumn()
    }

    const handleUpdateData = () => {
      const ganttProps = $xeGantt.props
      const { treeConfig } = ganttProps
      const { scrollXStore } = internalData
      const $xeTable = internalData.xeTable
      const sdMaps: Record<string, any> = {}
      const edMaps: Record<string, any> = {}
      let minDate: Date | null = null
      let maxDate: Date | null = null
      if ($xeTable) {
        const startField = computeStartField.value
        const endField = computeEndField.value
        const { computeAggregateOpts, computeTreeOpts } = $xeTable.getComputeMaps()
        const tableReactData = $xeTable.reactData
        const { isRowGroupStatus } = tableReactData
        const tableInternalData = $xeTable.internalData
        const { afterFullData, afterTreeFullData, afterGroupFullData } = tableInternalData
        const aggregateOpts = computeAggregateOpts.value
        const treeOpts = computeTreeOpts.value
        const { transform } = treeOpts
        const childrenField = treeOpts.children || treeOpts.childrenField

        const handleMinMaxData = (row: any) => {
          const startValue = XEUtils.get(row, startField)
          const endValue = XEUtils.get(row, endField)
          if (startValue && endValue) {
            const startDate = parseStringDate(startValue)
            if (!minDate || minDate.getTime() > startDate.getTime()) {
              minDate = startDate
            }
            const endDate = parseStringDate(endValue)
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
      handleParseColumn()
    }

    const calcScrollbar = () => {
      const { scrollXWidth, scrollYHeight } = reactData
      const { elemStore } = internalData
      const scrollbarOpts = computeScrollbarOpts.value
      const bodyWrapperElem = getRefElem(elemStore['main-body-wrapper'])
      const xHandleEl = refScrollXHandleElem.value
      const yHandleEl = refScrollYHandleElem.value
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

    const updateTaskChart = () => {
      const { dragBarRow } = ganttInternalData
      const { viewCellWidth } = reactData
      const { elemStore, chartMaps } = internalData
      const $xeTable = internalData.xeTable
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
      return nextTick()
    }

    const updateStyle = () => {
      const { scrollbarWidth, scrollbarHeight, headerGroups, tableColumn } = reactData
      const { elemStore, visibleColumn } = internalData
      const $xeTable = internalData.xeTable

      const el = refElem.value
      if (!el) {
        return
      }
      if (!$xeGantt) {
        return
      }

      const scrollbarOpts = computeScrollbarOpts.value
      const scrollbarXToTop = computeScrollbarXToTop.value
      const scrollbarYToLeft = computeScrollbarYToLeft.value

      const xLeftCornerEl = refScrollXLeftCornerElem.value
      const xRightCornerEl = refScrollXRightCornerElem.value
      const scrollXVirtualEl = refScrollXVirtualElem.value

      let osbWidth = scrollbarWidth
      const osbHeight = scrollbarHeight

      let tbHeight = 0
      let tHeaderHeight = 0
      let tFooterHeight = 0
      if ($xeTable) {
        const tableInternalData = $xeTable.internalData
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
      const xWrapperEl = refScrollXWrapperElem.value
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

      const scrollYVirtualEl = refScrollYVirtualElem.value
      if (scrollYVirtualEl) {
        scrollYVirtualEl.style.width = `${osbWidth}px`
        scrollYVirtualEl.style.height = `${tbHeight + tHeaderHeight + tFooterHeight}px`
        scrollYVirtualEl.style.visibility = yScrollbarVisible
      }
      const yTopCornerEl = refScrollYTopCornerElem.value
      if (yTopCornerEl) {
        yTopCornerEl.style.height = `${tHeaderHeight}px`
        yTopCornerEl.style.display = tHeaderHeight ? 'block' : ''
      }
      const yWrapperEl = refScrollYWrapperElem.value
      if (yWrapperEl) {
        yWrapperEl.style.height = `${tbHeight}px`
        yWrapperEl.style.top = `${tHeaderHeight}px`
      }
      const yBottomCornerEl = refScrollYBottomCornerElem.value
      if (yBottomCornerEl) {
        yBottomCornerEl.style.height = `${tFooterHeight}px`
        yBottomCornerEl.style.top = `${tHeaderHeight + tbHeight}px`
        yBottomCornerEl.style.display = tFooterHeight ? 'block' : ''
      }

      const colInfoElem = refColInfoElem.value
      let viewCellWidth = 40
      if (colInfoElem) {
        viewCellWidth = colInfoElem.clientWidth || 40
      }
      let viewTableWidth = viewCellWidth
      if (visibleColumn.length) {
        viewTableWidth = Math.max(0, viewCellWidth * visibleColumn.length)
        if (bodyScrollElem) {
          const viewWidth = bodyScrollElem.clientWidth
          const remainWidth = viewWidth - viewTableWidth
          if (remainWidth > 0) {
            viewCellWidth += Math.max(0, remainWidth / visibleColumn.length)
            viewTableWidth = viewWidth
          }
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
        updateTaskChart(),
        $xeGantt.handleUpdateTaskLink ? $xeGantt.handleUpdateTaskLink($xeGanttView) : null
      ])
    }

    const handleRecalculateStyle = () => {
      const el = refElem.value
      internalData.rceRunTime = Date.now()
      if (!el || !el.clientWidth) {
        return nextTick()
      }
      if (!$xeGantt) {
        return nextTick()
      }
      calcScrollbar()
      updateStyle()
      return computeScrollLoad()
    }

    const handleLazyRecalculate = () => {
      return new Promise<void>(resolve => {
        const { rceTimeout, rceRunTime } = internalData
        const $xeTable = internalData.xeTable
        let refreshDelay = 30
        if ($xeTable) {
          const { computeResizeOpts } = $xeTable.getComputeMaps()
          const resizeOpts = computeResizeOpts.value
          refreshDelay = resizeOpts.refreshDelay || refreshDelay
        }
        if (rceTimeout) {
          clearTimeout(rceTimeout)
          if (rceRunTime && rceRunTime + (refreshDelay - 5) < Date.now()) {
            resolve(
              handleRecalculateStyle()
            )
          } else {
            nextTick(() => {
              resolve()
            })
          }
        } else {
          resolve(
            handleRecalculateStyle()
          )
        }
        internalData.rceTimeout = setTimeout(() => {
          internalData.rceTimeout = undefined
          handleRecalculateStyle()
        }, refreshDelay)
      })
    }

    const computeScrollLoad = () => {
      return nextTick().then(() => {
        const { scrollXLoad } = reactData
        const { scrollXStore } = internalData
        // 计算 X 逻辑
        if (scrollXLoad) {
          const { toVisibleIndex: toXVisibleIndex, visibleSize: visibleXSize } = handleVirtualXVisible()
          const offsetXSize = 2
          scrollXStore.preloadSize = 1
          scrollXStore.offsetSize = offsetXSize
          scrollXStore.visibleSize = visibleXSize
          scrollXStore.endIndex = Math.max(scrollXStore.startIndex + scrollXStore.visibleSize + offsetXSize, scrollXStore.endIndex)
          scrollXStore.visibleStartIndex = Math.max(scrollXStore.startIndex, toXVisibleIndex)
          scrollXStore.visibleEndIndex = Math.min(scrollXStore.endIndex, toXVisibleIndex + visibleXSize)
          updateScrollXData().then(() => {
            loadScrollXData()
          })
        } else {
          updateScrollXSpace()
        }
      })
    }

    const handleVirtualXVisible = () => {
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

    const loadScrollXData = () => {
      const { isScrollXBig } = reactData
      const { scrollXStore } = internalData
      const { preloadSize, startIndex, endIndex, offsetSize } = scrollXStore
      const { toVisibleIndex, visibleSize } = handleVirtualXVisible()
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
          updateScrollXData()
        }
      }
    }

    const updateScrollXData = () => {
      handleTableColumn()
      updateScrollXSpace()
      return nextTick()
    }

    const updateScrollXStatus = () => {
      const scrollXLoad = true
      reactData.scrollXLoad = scrollXLoad
      return scrollXLoad
    }

    const handleTableColumn = () => {
      const { scrollXLoad } = reactData
      const { visibleColumn, scrollXStore } = internalData
      const tableColumn = scrollXLoad ? visibleColumn.slice(scrollXStore.startIndex, scrollXStore.endIndex) : visibleColumn.slice(0)
      reactData.tableColumn = tableColumn
    }

    const updateScrollXSpace = () => {
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

      const scrollXSpaceEl = refScrollXSpaceElem.value
      if (scrollXSpaceEl) {
        scrollXSpaceEl.style.width = `${scrollXWidth}px`
      }

      const lineWrapper = getRefElem(elemStore['main-chart-line-wrapper'])
      const svgElem = lineWrapper ? lineWrapper.firstElementChild as HTMLDivElement : null
      if (svgElem) {
        svgElem.style.width = `${scrollXWidth}px`
      }

      calcScrollbar()
      return nextTick()
    }

    const triggerScrollXEvent = () => {
      loadScrollXData()
    }

    const updateScrollYSpace = () => {
      const { elemStore } = internalData
      const $xeTable = internalData.xeTable
      const bodyScrollElem = getRefElem(elemStore['main-body-scroll'])
      const bodyTableElem = getRefElem(elemStore['main-body-table'])

      let ySpaceTop = 0
      let scrollYHeight = 0
      let isScrollYBig = false
      if ($xeTable) {
        const tableReactData = $xeTable.reactData
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

      const scrollYSpaceEl = refScrollYSpaceElem.value
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

      calcScrollbar()
      return nextTick().then(() => {
        updateStyle()
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const checkLastSyncScroll = (isRollX: boolean, isRollY: boolean) => {
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

    const handleScrollData = (isRollY: boolean, isRollX: boolean, scrollTop: number, scrollLeft: number) => {
      if (isRollX) {
        internalData.lastScrollLeft = scrollLeft
      }
      if (isRollY) {
        internalData.lastScrollTop = scrollTop
      }
      reactData.lastScrollTime = Date.now()
      checkLastSyncScroll(isRollX, isRollY)
    }

    const handleScrollEvent = (evnt: Event, isRollY: boolean, isRollX: boolean, scrollTop: number, scrollLeft: number) => {
      const $xeTable = internalData.xeTable

      const { lastScrollLeft, lastScrollTop } = internalData
      const xHandleEl = refScrollXHandleElem.value
      const yHandleEl = refScrollYHandleElem.value
      if (!xHandleEl || !yHandleEl) {
        return
      }
      if (!$xeTable) {
        return
      }
      const { computeScrollXThreshold, computeScrollYThreshold } = $xeTable.getComputeMaps()
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
        const xThreshold = computeScrollXThreshold.value
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
        const yThreshold = computeScrollYThreshold.value
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
      handleScrollData(isRollY, isRollX, scrollTop, scrollLeft)
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

    const ganttViewMethods: VxeGanttViewMethods = {
      refreshData () {
        handleUpdateData()
        handleRecalculateStyle()
        return nextTick().then(() => {
          const $xeTable = internalData.xeTable
          handleRecalculateStyle()
          if ($xeTable) {
            return $xeTable.recalculate()
          }
        })
      },
      updateViewData () {
        const $xeTable = internalData.xeTable
        if ($xeTable) {
          const tableReactData = $xeTable.reactData
          const { tableData } = tableReactData
          reactData.tableData = tableData
        }
        return nextTick()
      },
      connectUpdate ({ $table }) {
        if ($table) {
          internalData.xeTable = $table
        }
        return nextTick()
      }
    }

    /**
     * 同步表格滚动
     */
    const syncTableScrollTop = (scrollTop: number) => {
      const $xeTable = internalData.xeTable
      if ($xeTable) {
        const tableInternalData = $xeTable.internalData
        const { elemStore: tableElemStore } = tableInternalData
        const tableBodyScrollElem = getRefElem(tableElemStore['main-body-scroll'])
        if (tableBodyScrollElem) {
          tableBodyScrollElem.scrollTop = scrollTop
        }
      }
    }

    const ganttViewPrivateMethods: VxeGanttViewPrivateMethods = {
      handleUpdateStyle: updateStyle,
      handleLazyRecalculate,
      handleUpdateCurrentRow (row) {
        const $xeTable = internalData.xeTable
        const el = refElem.value
        if ($xeTable && el) {
          if (row) {
            const tableProps = $xeTable.props
            const { computeRowOpts } = $xeTable.getComputeMaps()
            const rowOpts = computeRowOpts.value
            if (rowOpts.isCurrent || tableProps.highlightCurrentRow) {
              XEUtils.arrayEach(el.querySelectorAll(`.vxe-gantt-view--body-row[rowid="${$xeTable.getRowid(row)}"]`), elem => addClass(elem, 'row--current'))
            }
          } else {
            XEUtils.arrayEach(el.querySelectorAll('.vxe-gantt-view--body-row.row--current'), elem => removeClass(elem, 'row--current'))
          }
        }
      },
      handleUpdateHoverRow (row) {
        const $xeTable = internalData.xeTable
        const el = refElem.value
        if ($xeTable && el) {
          if (row) {
            XEUtils.arrayEach(el.querySelectorAll(`.vxe-gantt-view--body-row[rowid="${$xeTable.getRowid(row)}"]`), elem => addClass(elem, 'row--hover'))
          } else {
            XEUtils.arrayEach(el.querySelectorAll('.vxe-gantt-view--body-row.row--hover'), elem => removeClass(elem, 'row--hover'))
          }
        }
      },
      triggerHeaderScrollEvent (evnt) {
        const { elemStore, inVirtualScroll, inBodyScroll, inFooterScroll } = internalData
        if (inVirtualScroll) {
          return
        }
        if (inBodyScroll || inFooterScroll) {
          return
        }
        const wrapperEl = evnt.currentTarget as HTMLDivElement
        const bodyScrollElem = getRefElem(elemStore['main-body-scroll'])
        const xHandleEl = refScrollXHandleElem.value
        if (bodyScrollElem && wrapperEl) {
          const isRollX = true
          const isRollY = false
          const currLeftNum = wrapperEl.scrollLeft
          internalData.inHeaderScroll = true
          setScrollLeft(xHandleEl, currLeftNum)
          setScrollLeft(bodyScrollElem, currLeftNum)
          handleScrollEvent(evnt, isRollY, isRollX, wrapperEl.scrollTop, currLeftNum)
        }
      },
      triggerBodyScrollEvent (evnt) {
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
        const xHandleEl = refScrollXHandleElem.value
        const yHandleEl = refScrollYHandleElem.value
        const scrollLeft = wrapperEl.scrollLeft
        const scrollTop = wrapperEl.scrollTop
        const isRollX = scrollLeft !== lastScrollLeft
        const isRollY = scrollTop !== lastScrollTop
        internalData.inBodyScroll = true
        internalData.scrollRenderType = ''
        if (isRollY) {
          setScrollTop(yHandleEl, scrollTop)
          syncTableScrollTop(scrollTop)
        }
        if (isRollX) {
          internalData.inBodyScroll = true
          setScrollLeft(xHandleEl, scrollLeft)
          setScrollLeft(headerScrollElem, scrollLeft)
          if (scrollXLoad) {
            triggerScrollXEvent()
          }
        }
        if (isRollY) {
          handleScrollData(isRollY, isRollX, wrapperEl.scrollTop, scrollLeft)
        }
        if (isRollX) {
          handleScrollEvent(evnt, isRollY, isRollX, wrapperEl.scrollTop, scrollLeft)
        }
      },
      // triggerFooterScrollEvent (evnt) {
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
      //     handleScrollEvent(evnt, isRollY, isRollX, wrapperEl.scrollTop, currLeftNum)
      //   }
      // },
      triggerVirtualScrollXEvent (evnt) {
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
            triggerScrollXEvent()
          }
          handleScrollEvent(evnt, isRollY, isRollX, wrapperEl.scrollTop, currLeftNum)
        }
      },
      triggerVirtualScrollYEvent (evnt) {
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
          syncTableScrollTop(currTopNum)
          handleScrollData(isRollY, isRollX, currTopNum, wrapperEl.scrollLeft)
        }
      },
      handleUpdateSXSpace () {
        return updateScrollXSpace()
      },
      handleUpdateSYSpace () {
        return updateScrollYSpace()
      },
      handleUpdateSYStatus (sYLoad) {
        reactData.scrollYLoad = sYLoad
      }
    }

    const handleGlobalResizeEvent = () => {
      handleLazyRecalculate()
    }

    Object.assign($xeGanttView, ganttViewMethods, ganttViewPrivateMethods)

    const renderScrollX = () => {
      return h('div', {
        key: 'vsx',
        ref: refScrollXVirtualElem,
        class: 'vxe-gantt-view--scroll-x-virtual'
      }, [
        h('div', {
          ref: refScrollXLeftCornerElem,
          class: 'vxe-gantt-view--scroll-x-left-corner'
        }),
        h('div', {
          ref: refScrollXWrapperElem,
          class: 'vxe-gantt-view--scroll-x-wrapper'
        }, [
          h('div', {
            ref: refScrollXHandleElem,
            class: 'vxe-gantt-view--scroll-x-handle',
            onScroll: $xeGanttView.triggerVirtualScrollXEvent
          }, [
            h('div', {
              ref: refScrollXSpaceElem,
              class: 'vxe-gantt-view--scroll-x-space'
            })
          ]),
          h('div', {
            class: 'vxe-gantt-view--scroll-x-handle-appearance'
          })
        ]),
        h('div', {
          ref: refScrollXRightCornerElem,
          class: 'vxe-gantt-view--scroll-x-right-corner'
        })
      ])
    }

    const renderScrollY = () => {
      return h('div', {
        ref: refScrollYVirtualElem,
        class: 'vxe-gantt-view--scroll-y-virtual'
      }, [
        h('div', {
          ref: refScrollYTopCornerElem,
          class: 'vxe-gantt-view--scroll-y-top-corner'
        }),
        h('div', {
          ref: refScrollYWrapperElem,
          class: 'vxe-gantt-view--scroll-y-wrapper'
        }, [
          h('div', {
            ref: refScrollYHandleElem,
            class: 'vxe-gantt-view--scroll-y-handle',
            onScroll: $xeGanttView.triggerVirtualScrollYEvent
          }, [
            h('div', {
              ref: refScrollYSpaceElem,
              class: 'vxe-gantt-view--scroll-y-space'
            })
          ]),
          h('div', {
            class: 'vxe-gantt-view--scroll-y-handle-appearance'
          })
        ]),
        h('div', {
          ref: refScrollYBottomCornerElem,
          class: 'vxe-gantt-view--scroll-y-bottom-corner'
        })
      ])
    }

    const renderViewport = () => {
      return h('div', {
        class: 'vxe-gantt-view--viewport-wrapper'
      }, [
        h(GanttViewHeaderComponent),
        h(GanttViewBodyComponent),
        h(GanttViewFooterComponent)
      ])
    }

    const renderBody = () => {
      const scrollbarYToLeft = computeScrollbarYToLeft.value
      return h('div', {
        class: 'vxe-gantt-view--layout-wrapper'
      }, scrollbarYToLeft
        ? [
            renderScrollY(),
            renderViewport()
          ]
        : [
            renderViewport(),
            renderScrollY()
          ])
    }

    const renderVN = () => {
      const { overflowX, overflowY, scrollXLoad, scrollYLoad } = reactData
      const scrollbarXToTop = computeScrollbarXToTop.value
      return h('div', {
        ref: refElem,
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
              renderScrollX(),
              renderBody()
            ]
          : [
              renderBody(),
              renderScrollX()
            ]),
        h('div', {
          class: 'vxe-gantt-view--render-vars'
        }, [
          h('div', {
            ref: refColInfoElem,
            class: 'vxe-gantt-view--column-info'
          })
        ])
      ])
    }

    const tdFlag = ref(0)
    watch(() => reactData.tableData, () => {
      tdFlag.value++
    })
    watch(() => reactData.tableData.length, () => {
      tdFlag.value++
    })
    watch(tdFlag, () => {
      handleUpdateData()
    })

    onMounted(() => {
      globalEvents.on($xeGanttView, 'resize', handleGlobalResizeEvent)
    })

    onUnmounted(() => {
      globalEvents.off($xeGanttView, 'keydown')
      XEUtils.assign(internalData, createInternalData())
    })

    $xeGanttView.renderVN = renderVN

    provide('$xeGanttView', $xeGanttView)

    return $xeGanttView
  },
  render () {
    return this.renderVN()
  }
})
