import { h, inject, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import XEUtils from 'xe-utils'

import type { VxeComponentSlotType } from 'vxe-pc-ui'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

const { getI18n } = VxeUI

export default defineVxeComponent({
  name: 'VxeGanttViewHeader',
  setup () {
    const $xeGantt = inject('$xeGantt', {} as (VxeGanttConstructor & VxeGanttPrivateMethods))
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { computeTaskViewOpts } = $xeGantt.getComputeMaps()
    const { reactData, internalData } = $xeGanttView

    const refElem = ref() as Ref<HTMLDivElement>
    const refHeaderScroll = ref() as Ref<HTMLDivElement>
    const refHeaderTable = ref() as Ref<HTMLTableElement>
    const refHeaderXSpace = ref() as Ref<HTMLDivElement>

    const renderVN = () => {
      const { headerGroups, viewCellWidth } = reactData
      const { todayDateMaps, visibleColumn } = internalData
      const taskViewOpts = computeTaskViewOpts.value
      const { showNowLine } = taskViewOpts
      return h('div', {
        ref: refElem,
        class: 'vxe-gantt-view--header-wrapper'
      }, [
        h('div', {
          ref: refHeaderScroll,
          class: 'vxe-gantt-view--header-inner-wrapper',
          onScroll: $xeGanttView.triggerHeaderScrollEvent
        }, [
          h('div', {
            ref: refHeaderXSpace,
            class: 'vxe-body--x-space'
          }),
          h('table', {
            ref: refHeaderTable,
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
              const { type, titleMethod, headerCellStyle, slots } = scaleItem
              const titleSlot = slots ? slots.title : null
              const todayValue = showNowLine && $rowIndex === headerGroups.length - 1 ? todayDateMaps[type] : null
              return h('tr', {
                key: $rowIndex
              }, columns.map((column, cIndex) => {
                const { field, childCount, dateObj } = column
                let label = `${column.title}`
                if ($rowIndex < headerGroups.length - 1) {
                  if (scaleItem.type === 'day') {
                    label = getI18n(`vxe.gantt.dayss.w${dateObj.e}`)
                  } else {
                    label = getI18n(`vxe.gantt.${!$rowIndex && headerGroups.length > 1 ? 'tFullFormat' : 'tSimpleFormat'}.${type}`, dateObj)
                  }
                }
                let cellVNs: string | VxeComponentSlotType[] = label
                const ctParams = { scaleObj: scaleItem, title: label, dateObj: dateObj, $rowIndex }
                if (titleSlot) {
                  cellVNs = $xeGantt.callSlot(titleSlot, ctParams)
                } else if (titleMethod) {
                  cellVNs = `${titleMethod(ctParams)}`
                }
                let cellStys = {}
                if (headerCellStyle) {
                  if (XEUtils.isFunction(headerCellStyle)) {
                    cellStys = headerCellStyle(ctParams)
                  } else {
                    cellStys = headerCellStyle
                  }
                }
                return h('th', {
                  key: cIndex,
                  class: ['vxe-gantt-view--header-column', {
                    'is--now': showNowLine && todayValue && todayValue === field
                  }],
                  colspan: childCount || null,
                  title: titleSlot ? null : label,
                  style: cellStys
                }, cellVNs)
              }))
            }))
          ])
        ])
      ])
    }

    onMounted(() => {
      const { elemStore } = internalData
      const prefix = 'main-header-'
      elemStore[`${prefix}wrapper`] = refElem
      elemStore[`${prefix}scroll`] = refHeaderScroll
      elemStore[`${prefix}table`] = refHeaderTable
      elemStore[`${prefix}xSpace`] = refHeaderXSpace
    })

    onUnmounted(() => {
      const { elemStore } = internalData
      const prefix = 'main-header-'
      elemStore[`${prefix}wrapper`] = null
      elemStore[`${prefix}scroll`] = null
      elemStore[`${prefix}table`] = null
      elemStore[`${prefix}xSpace`] = null
    })

    return renderVN
  }
})
