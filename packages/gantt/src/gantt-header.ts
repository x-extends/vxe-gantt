import { h, inject, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { getCellHeight } from './util'

import type { VxeTablePropTypes } from 'vxe-table'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods } from '../../../types'

export default defineVxeComponent({
  name: 'VxeGanttView',
  setup () {
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { reactData, internalData } = $xeGanttView

    const refElem = ref() as Ref<HTMLDivElement>
    const refHeaderScroll = ref() as Ref<HTMLDivElement>
    const refHeaderTable = ref() as Ref<HTMLTableElement>
    const refHeaderXSpace = ref() as Ref<HTMLDivElement>

    const renderVN = () => {
      const $xeTable = $xeGanttView.internalData.xeTable

      const { tableColumn, headerGroups, viewCellWidth } = reactData

      let defaultRowHeight: number = 0
      let headerCellOpts : VxeTablePropTypes.HeaderCellConfig = {}
      let currCellHeight = 0
      if ($xeTable) {
        const { computeDefaultRowHeight, computeHeaderCellOpts } = $xeTable.getComputeMaps()
        defaultRowHeight = computeDefaultRowHeight.value
        headerCellOpts = computeHeaderCellOpts.value
        currCellHeight = getCellHeight(headerCellOpts.height) || defaultRowHeight
      }

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
            class: 'vxe-gantt-view--header-table',
            style: {
              height: `${currCellHeight}px`
            }
          }, [
            h('colgroup', {}, tableColumn.map((column, cIndex) => {
              return h('col', {
                key: cIndex,
                style: {
                  width: `${viewCellWidth}px`
                }
              })
            })),
            h('thead', {}, headerGroups.map((cols, rIndex) => {
              return h('tr', {
                key: rIndex
              }, cols.map((column, cIndex) => {
                return h('th', {
                  key: cIndex,
                  class: 'vxe-gantt-view--header-column',
                  colspan: column.children ? column.children.length : null,
                  title: `${column.field}`
                }, column.title)
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
