import { CreateElement } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import XEUtils from 'xe-utils'

import type { VxeComponentSlotType } from 'vxe-pc-ui'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

const { getI18n } = VxeUI

const sourceType = 'gantt'
const viewType = 'header'

export default defineVxeComponent({
  name: 'VxeGanttViewHeader',
  inject: {
    $xeGantt: {
      default: null
    },
    $xeGanttView: {
      default: null
    }
  },
  computed: {
    ...({} as {
        $xeGantt(): (VxeGanttConstructor & VxeGanttPrivateMethods)
        $xeGanttView(): (VxeGanttViewConstructor & VxeGanttViewPrivateMethods)
      })
  },
  methods: {
    //
    // Render
    //
    renderVN (h: CreateElement) {
      const _vm = this
      const $xeGantt = _vm.$xeGantt
      const $xeGanttView = _vm.$xeGanttView
      const reactData = $xeGanttView.reactData
      const internalData = $xeGanttView.internalData

      const { headerGroups, viewCellWidth } = reactData
      const { todayDateMaps, visibleColumn } = internalData
      const taskViewOpts = $xeGantt.computeTaskViewOpts
      const { showNowLine } = taskViewOpts
      return h('div', {
        ref: 'refElem',
        class: 'vxe-gantt-view--header-wrapper'
      }, [
        h('div', {
          ref: 'refHeaderScroll',
          class: 'vxe-gantt-view--header-inner-wrapper',
          on: {
            scroll: $xeGanttView.triggerHeaderScrollEvent
          }
        }, [
          h('div', {
            ref: 'refHeaderXSpace',
            class: 'vxe-body--x-space'
          }),
          h('table', {
            ref: 'refHeaderTable',
            class: 'vxe-gantt-view--header-table'
          }, [
            h('colgroup', {}, visibleColumn.map((column, cIndex) => {
              return h('col', {
                key: cIndex,
                style: {
                  width: `${viewCellWidth}px`
                }
              })
            })),
            h('thead', {}, headerGroups.map(({ scaleItem, columns }, $rowIndex) => {
              const { type, titleFormat, titleMethod, headerCellStyle, slots } = scaleItem
              const titleSlot = slots ? slots.title : null
              const isLast = $rowIndex === headerGroups.length - 1
              const todayValue = isLast && showNowLine ? todayDateMaps[type] : null
              return h('tr', {
                key: $rowIndex
              }, columns.map((column, cIndex) => {
                const { field, childCount, dateObj } = column
                let label = `${column.title}`
                if (scaleItem.type === 'day') {
                  label = getI18n(`vxe.gantt.dayss.w${dateObj.e}`)
                } else {
                  if ($rowIndex) {
                    label = getI18n(`vxe.gantt.tSimpleFormat.${type}`, dateObj)
                  } else {
                    if (isLast && scaleItem.type === 'week') {
                      label = getI18n(`vxe.gantt.tSimpleFormat.${type}`, dateObj)
                    } else {
                      label = getI18n(`vxe.gantt.tFullFormat.${type}`, dateObj)
                    }
                  }
                }
                let cellVNs: string | VxeComponentSlotType[] = label
                const ctParams = { source: sourceType, type: viewType, column, scaleObj: scaleItem, title: label, dateObj: dateObj, $rowIndex }
                if (titleSlot) {
                  cellVNs = $xeGantt.callSlot(titleSlot, ctParams, h)
                } else if (titleMethod) {
                  cellVNs = `${titleMethod(ctParams)}`
                } else if (titleFormat) {
                  cellVNs = XEUtils.toDateString(dateObj.date, titleFormat)
                }
                let cellStys: Partial<CSSStyleDeclaration> | null = {}
                if (headerCellStyle) {
                  if (XEUtils.isFunction(headerCellStyle)) {
                    cellStys = headerCellStyle(ctParams) || null
                  } else {
                    cellStys = headerCellStyle
                  }
                }
                return h('th', {
                  key: cIndex,
                  class: ['vxe-gantt-view--header-column', {
                    'is--now': showNowLine && todayValue && todayValue === field
                  }],
                  attrs: {
                    colspan: childCount || null,
                    title: titleSlot ? null : label
                  },
                  style: cellStys || undefined,
                  on: {
                    contextmenu (evnt: Event) {
                      $xeGantt.handleTaskHeaderContextmenuEvent(evnt, ctParams)
                    }
                  }
                }, cellVNs)
              }))
            }))
          ])
        ])
      ])
    }
  },
  mounted () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const { internalData } = $xeGanttView

    const { elemStore } = internalData
    const prefix = 'main-header-'
    elemStore[`${prefix}wrapper`] = _vm.$refs.refElem as HTMLDivElement
    elemStore[`${prefix}scroll`] = _vm.$refs.refHeaderScroll as HTMLDivElement
    elemStore[`${prefix}table`] = _vm.$refs.refHeaderTable as HTMLDivElement
    elemStore[`${prefix}xSpace`] = _vm.$refs.refHeaderXSpace as HTMLDivElement
  },
  destroyed () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const { internalData } = $xeGanttView

    const { elemStore } = internalData
    const prefix = 'main-header-'
    elemStore[`${prefix}wrapper`] = null
    elemStore[`${prefix}scroll`] = null
    elemStore[`${prefix}table`] = null
    elemStore[`${prefix}xSpace`] = null
  },
  render (this: any, h) {
    return this.renderVN(h)
  }
})
