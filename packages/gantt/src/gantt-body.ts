import { h, inject, VNode, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { getCellRestHeight } from './util'
import GanttViewChartComponent from './gantt-chart'

import type { VxeTablePropTypes } from 'vxe-table'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

export default defineVxeComponent({
  name: 'VxeGanttViewBody',
  setup () {
    const $xeGantt = inject('$xeGantt', {} as (VxeGanttConstructor & VxeGanttPrivateMethods))
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { reactData, internalData } = $xeGanttView
    const { refTable } = $xeGantt.getRefMaps()

    const refElem = ref() as Ref<HTMLDivElement>
    const refBodyScroll = ref() as Ref<HTMLDivElement>
    const refBodyTable = ref() as Ref<HTMLTableElement>
    const refBodyXSpace = ref() as Ref<HTMLDivElement>
    const refBodyYSpace = ref() as Ref<HTMLDivElement>

    const renderRows = () => {
      const $xeTable = refTable.value

      const fullAllDataRowIdData = $xeTable ? $xeTable.internalData.fullAllDataRowIdData : {}
      let cellOpts: VxeTablePropTypes.CellConfig = {}
      let rowOpts : VxeTablePropTypes.RowConfig = {}
      let defaultRowHeight = 0
      if ($xeTable) {
        const { computeCellOpts, computeRowOpts, computeDefaultRowHeight } = $xeTable.getComputeMaps()
        cellOpts = computeCellOpts.value
        rowOpts = computeRowOpts.value
        defaultRowHeight = computeDefaultRowHeight.value
      }

      const { tableData, tableColumn } = reactData

      const trVNs:VNode[] = []
      tableData.forEach((row, rIndex) => {
        const rowid = $xeTable ? $xeTable.getRowid(row) : ''
        const rowRest = fullAllDataRowIdData[rowid] || {}
        const cellHeight = getCellRestHeight(rowRest, cellOpts, rowOpts, defaultRowHeight)
        trVNs.push(
          h('tr', {
            key: rIndex
          }, tableColumn.map((column, cIndex) => {
            return h('td', {
              key: cIndex,
              class: 'vxe-gantt-view--body-column',
              style: {
                height: `${cellHeight}px`
              },
              onClick (evnt) {
                $xeGantt.handleTaskCellClickEvent(evnt, { row })
              },
              onDblclick (evnt) {
                $xeGantt.handleTaskCellDblclickEvent(evnt, { row })
              }
            })
          }))
        )
      })
      return trVNs
    }

    const renderVN = () => {
      const { tableColumn, viewCellWidth } = reactData
      return h('div', {
        ref: refElem,
        class: 'vxe-gantt-view--body-wrapper'
      }, [
        h('div', {
          ref: refBodyScroll,
          class: 'vxe-gantt-view--body-inner-wrapper',
          onScroll: $xeGanttView.triggerBodyScrollEvent
        }, [
          h('div', {
            ref: refBodyXSpace,
            class: 'vxe-body--x-space'
          }),
          h('div', {
            ref: refBodyYSpace,
            class: 'vxe-body--y-space'
          }),
          h('table', {
            ref: refBodyTable,
            class: 'vxe-gantt-view--body-table'
          }, [
            h('colgroup', {}, tableColumn.map((column, cIndex) => {
              return h('col', {
                key: cIndex,
                style: {
                  width: `${viewCellWidth}px`
                }
              })
            })),
            h('tbody', {}, renderRows())
          ]),
          h(GanttViewChartComponent)
        ])
      ])
    }

    onMounted(() => {
      const { elemStore } = internalData
      const prefix = 'main-body-'
      elemStore[`${prefix}wrapper`] = refElem
      elemStore[`${prefix}scroll`] = refBodyScroll
      elemStore[`${prefix}table`] = refBodyTable
      elemStore[`${prefix}xSpace`] = refBodyXSpace
      elemStore[`${prefix}ySpace`] = refBodyYSpace
    })

    onUnmounted(() => {
      const { elemStore } = internalData
      const prefix = 'main-body-'
      elemStore[`${prefix}wrapper`] = null
      elemStore[`${prefix}scroll`] = null
      elemStore[`${prefix}table`] = null
      elemStore[`${prefix}xSpace`] = null
      elemStore[`${prefix}ySpace`] = null
    })

    return renderVN
  }
})
