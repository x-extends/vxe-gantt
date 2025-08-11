import { h, ref, reactive, nextTick, inject, watch, provide } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { setScrollTop, setScrollLeft } from '../../ui/src/dom'
import { getRefElem } from './util'
import XEUtils from 'xe-utils'
import VxeGanttViewHeaderComponent from './gantt-header'
import VxeGanttViewBodyComponent from './gantt-body'

import type { VxeGanttViewConstructor, GanttViewReactData, GanttViewPrivateRef, VxeGanttPropTypes, VxeGanttDefines, VxeGanttViewPrivateMethods, GanttViewInternalData, VxeGanttViewMethods, GanttViewPrivateComputed, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

function createInternalData (): GanttViewInternalData {
  return {
    xeTable: null,
    startMaps: {},
    endMaps: {},
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
const supportMaxRow = 5e6
const maxYHeight = 5e6
const maxXWidth = 5e6

export default defineVxeComponent({
  name: 'VxeGanttView',
  setup (props, context) {
    const xID = XEUtils.uniqueId()

    const $xeGantt = inject('$xeGantt', {} as (VxeGanttConstructor & VxeGanttPrivateMethods))

    const { computeTaskViewOpts, computeStartField, computeEndField, computeScrollbarOpts, computeScrollbarXToTop, computeScrollbarYToLeft } = $xeGantt.getComputeMaps()

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

    const reactData = reactive<GanttViewReactData>({
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

      rowHeightStore: {
        large: 52,
        default: 48,
        medium: 44,
        small: 40,
        mini: 36
      }
    })

    const internalData = createInternalData()

    const refMaps: GanttViewPrivateRef = {
      refElem
    }

    const computeMaps: GanttViewPrivateComputed = {
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

    const handleParseColumn = () => {
      const { minViewDate, maxViewDate } = reactData
      const taskViewOpts = computeTaskViewOpts.value
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
            const countDayNum = Math.max(20, Math.ceil(diffDayNum / 86400000))
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
          }
          break
        }
      }
      reactData.tableColumn = fullCols
      reactData.headerGroups = groupCols
    }

    const handleUpdateData = () => {
      const $xeTable = internalData.xeTable
      const sdMaps: Record<string, any> = {}
      const edMaps: Record<string, any> = {}
      let minDate: Date | null = null
      let maxDate: Date | null = null
      if ($xeTable) {
        const startField = computeStartField.value
        const endField = computeEndField.value
        const tableInternalData = $xeTable.internalData
        const { afterFullData } = tableInternalData
        afterFullData.forEach(row => {
          const startValue = XEUtils.get(row, startField)
          const endValue = XEUtils.get(row, endField)
          if (startValue) {
            const startDate = XEUtils.toStringDate(startValue)
            if (!minDate || minDate.getTime() > startDate.getTime()) {
              minDate = startDate
            }
            sdMaps[startValue] = row
          }
          if (endValue) {
            const endDate = XEUtils.toStringDate(endValue)
            if (!maxDate || maxDate.getTime() < endDate.getTime()) {
              maxDate = endDate
            }
            edMaps[endValue] = row
          }
        })
      }
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

    const updateStyle = () => {
      const { overflowX, overflowY, scrollbarWidth, scrollbarHeight } = reactData
      const $xeTable = internalData.xeTable
      const el = refElem.value
      if (!el || !el.clientHeight) {
        return
      }

      const scrollbarXToTop = computeScrollbarXToTop.value

      const xLeftCornerEl = refScrollXLeftCornerElem.value
      const xRightCornerEl = refScrollXRightCornerElem.value
      const scrollXVirtualEl = refScrollXVirtualElem.value

      const osbWidth = overflowY ? scrollbarWidth : 0
      const osbHeight = overflowX ? scrollbarHeight : 0

      let tbHeight = 0
      let tHeaderHeight = 0
      let tFooterHeight = 0
      if ($xeTable) {
        const tableReactData = $xeTable.reactData
        tbHeight = tableReactData.tBodyHeight
        tHeaderHeight = tableReactData.tHeaderHeight
        tFooterHeight = tableReactData.tFooterHeight
      }

      if (scrollXVirtualEl) {
        scrollXVirtualEl.style.height = `${osbHeight}px`
        scrollXVirtualEl.style.visibility = overflowX ? 'visible' : 'hidden'
      }
      const xWrapperEl = refScrollXWrapperElem.value
      if (xWrapperEl) {
        xWrapperEl.style.left = scrollbarXToTop ? `${osbWidth}px` : ''
        xWrapperEl.style.width = `${el.clientWidth - osbWidth}px`
      }
      if (xLeftCornerEl) {
        xLeftCornerEl.style.width = scrollbarXToTop ? `${osbWidth}px` : ''
        xLeftCornerEl.style.display = scrollbarXToTop ? (overflowX && osbHeight ? 'block' : '') : ''
      }
      if (xRightCornerEl) {
        xRightCornerEl.style.width = scrollbarXToTop ? '' : `${osbWidth}px`
        xRightCornerEl.style.display = scrollbarXToTop ? '' : (overflowX && osbHeight ? 'block' : '')
      }

      const scrollYVirtualEl = refScrollYVirtualElem.value
      if (scrollYVirtualEl) {
        scrollYVirtualEl.style.width = `${osbWidth}px`
        scrollYVirtualEl.style.height = `${tbHeight + tHeaderHeight + tFooterHeight}px`
        scrollYVirtualEl.style.visibility = overflowY ? 'visible' : 'hidden'
      }
      const yTopCornerEl = refScrollYTopCornerElem.value
      if (yTopCornerEl) {
        yTopCornerEl.style.height = `${tHeaderHeight}px`
        yTopCornerEl.style.display = overflowY && tHeaderHeight ? 'block' : ''
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
        yBottomCornerEl.style.display = overflowY && tFooterHeight ? 'block' : ''
      }
      return nextTick()
    }

    const handleLazyRecalculate = () => {
      calcScrollbar()
      return nextTick()
    }

    const updateScrollXSpace = () => {
      const { scrollXLoad, tableColumn } = reactData
      const { elemStore } = internalData
      const bodyScrollElem = getRefElem(elemStore['main-body-scroll'])
      const bodyTableElem = getRefElem(elemStore['main-body-table'])
      const scrollXWidth = tableColumn.length * 40

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

      const scrollXSpaceEl = refScrollXSpaceElem.value
      if (scrollXSpaceEl) {
        scrollXSpaceEl.style.width = `${ySpaceWidth}px`
      }

      calcScrollbar()
      return nextTick().then(() => {
        updateStyle()
      })
    }

    const updateScrollYSpace = () => {
      const { scrollYLoad, overflowY } = reactData
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
      debugger
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

      const scrollYSpaceEl = refScrollYSpaceElem.value
      if (scrollYSpaceEl) {
        scrollYSpaceEl.style.height = ySpaceHeight ? `${ySpaceHeight}px` : ''
      }
      reactData.scrollYTop = scrollYTop
      reactData.scrollYHeight = scrollYHeight
      reactData.isScrollYBig = isScrollYBig

      calcScrollbar()
      return nextTick().then(() => {
        updateStyle()
      })
    }

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

    const handleScrollEvent = (evnt: Event, isRollY: boolean, isRollX: boolean, scrollTop: number, scrollLeft: number) => {
      checkLastSyncScroll(isRollX, isRollY)
    }

    const ganttViewMethods: VxeGanttViewMethods = {
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
        const { elemStore, inVirtualScroll, inHeaderScroll, inFooterScroll } = internalData
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
        if (headerScrollElem && wrapperEl) {
          const isRollX = true
          const isRollY = true
          const currLeftNum = wrapperEl.scrollLeft
          const currTopNum = wrapperEl.scrollTop
          internalData.inBodyScroll = true
          setScrollLeft(xHandleEl, currLeftNum)
          setScrollLeft(headerScrollElem, currLeftNum)
          setScrollTop(yHandleEl, currTopNum)
          syncTableScrollTop(currTopNum)
          handleScrollEvent(evnt, isRollY, isRollX, wrapperEl.scrollTop, currLeftNum)
        }
      },
      triggerFooterScrollEvent (evnt) {
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
          handleScrollEvent(evnt, isRollY, isRollX, wrapperEl.scrollTop, currLeftNum)
        }
      },
      triggerVirtualScrollXEvent (evnt) {
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
          handleScrollEvent(evnt, isRollY, isRollX, currTopNum, wrapperEl.scrollLeft)
        }
      },
      updateScrollXSpace,
      updateScrollYSpace
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
          ])
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
          ])
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
        h(VxeGanttViewHeaderComponent),
        h(VxeGanttViewBodyComponent)
      ])
    }

    const renderBody = () => {
      const scrollbarYToLeft = computeScrollbarYToLeft.value
      return h('div', {
        class: 'vxe-gantt-view--layout-erapper'
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
      const taskViewOpts = computeTaskViewOpts.value
      const scrollbarXToTop = computeScrollbarXToTop.value
      return h('div', {
        ref: refElem,
        class: ['vxe-gantt-view', `mode--${taskViewOpts.mode || 'day'}`, {
          'is--scroll-y': overflowY,
          'is--scroll-x': overflowX,
          'is--virtual-x': scrollXLoad,
          'is--virtual-y': scrollYLoad
        }]
      }, [
        h('div', {
          class: 'vxe-gantt-view--render-erapper'
        }, scrollbarXToTop
          ? [
              renderScrollX(),
              renderBody()
            ]
          : [
              renderBody(),
              renderScrollX()
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

    $xeGanttView.renderVN = renderVN

    provide('$xeGanttView', $xeGanttView)

    return $xeGanttView
  },
  render () {
    return this.renderVN()
  }
})
