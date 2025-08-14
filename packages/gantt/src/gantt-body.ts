import { h, inject, VNode, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { getCellRestHeight } from './util'
import GanttViewChartComponent from './gantt-chart'

import type { VxeTableConstructor, VxeTableMethods, VxeTablePrivateMethods } from 'vxe-table'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods, VxeGanttPropTypes } from '../../../types'

export default defineVxeComponent({
  name: 'VxeGanttViewBody',
  setup () {
    const $xeGantt = inject('$xeGantt', {} as (VxeGanttConstructor & VxeGanttPrivateMethods))
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { reactData, internalData } = $xeGanttView

    const refElem = ref() as Ref<HTMLDivElement>
    const refBodyScroll = ref() as Ref<HTMLDivElement>
    const refBodyTable = ref() as Ref<HTMLTableElement>
    const refBodyXSpace = ref() as Ref<HTMLDivElement>
    const refBodyYSpace = ref() as Ref<HTMLDivElement>

    const renderColumn = ($xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, row: any, rowid: string, $rowIndex: number, column: VxeGanttPropTypes.Column, $columnIndex: number) => {
      const tableInternalData = $xeTable.internalData
      const { fullAllDataRowIdData } = tableInternalData
      const { computeCellOpts, computeRowOpts, computeDefaultRowHeight } = $xeTable.getComputeMaps()
      const cellOpts = computeCellOpts.value
      const rowOpts = computeRowOpts.value
      const defaultRowHeight = computeDefaultRowHeight.value

      const rowRest = fullAllDataRowIdData[rowid] || {}
      const cellHeight = getCellRestHeight(rowRest, cellOpts, rowOpts, defaultRowHeight)

      return h('td', {
        key: $columnIndex,
        class: 'vxe-gantt-view--body-column',
        style: {
          height: `${cellHeight}px`
        },
        onClick (evnt) {
          $xeGantt.handleTaskCellClickEvent(evnt, { row, column })
        },
        onDblclick (evnt) {
          $xeGantt.handleTaskCellDblclickEvent(evnt, { row, column })
        }
      })
    }

    const renderRows = ($xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, tableData: any[]) => {
      const tableProps = $xeTable.props
      const { treeConfig, stripe, highlightHoverRow } = tableProps
      const tableReactData = $xeTable.reactData
      const { treeExpandedFlag } = tableReactData
      const tableInternalData = $xeTable.internalData
      const { fullAllDataRowIdData, treeExpandedMaps } = tableInternalData
      const { computeTreeOpts, computeRowOpts } = $xeTable.getComputeMaps()
      const rowOpts = computeRowOpts.value
      const treeOpts = computeTreeOpts.value
      const { transform } = treeOpts
      const childrenField = treeOpts.children || treeOpts.childrenField

      const { tableColumn, scrollYLoad } = reactData

      const trVNs:VNode[] = []
      tableData.forEach((row, $rowIndex) => {
        const rowid = $xeTable.getRowid(row)
        const rowRest = fullAllDataRowIdData[rowid] || {}
        const trOns: Record<string, any> = {}
        let rowIndex = $rowIndex
        let _rowIndex = -1
        if (rowRest) {
          rowIndex = rowRest.index
          _rowIndex = rowRest._index
        }
        // 当前行事件
        if (rowOpts.isHover || highlightHoverRow) {
          trOns.onMouseenter = (evnt: MouseEvent) => {
            $xeTable.triggerHoverEvent(evnt, { row, rowIndex })
          }
          trOns.onMouseleave = () => {
            $xeTable.clearHoverRow()
          }
        }
        trVNs.push(
          h('tr', {
            key: treeConfig ? rowid : $rowIndex,
            class: ['vxe-gantt-view--body-row', {
              'row--stripe': stripe && (_rowIndex + 1) % 2 === 0
            }],
            rowid,
            ...trOns
          }, tableColumn.map((column, $columnIndex) => renderColumn($xeTable, row, rowid, $rowIndex, column, $columnIndex)))
        )
        let isExpandTree = false
        let rowChildren: any[] = []

        if (treeConfig && !scrollYLoad && !transform) {
          rowChildren = row[childrenField]
          isExpandTree = !!treeExpandedFlag && rowChildren && rowChildren.length > 0 && !!treeExpandedMaps[rowid]
        }
        // 如果是树形表格
        if (isExpandTree) {
          trVNs.push(...renderRows($xeTable, rowChildren))
        }
      })
      return trVNs
    }

    const renderVN = () => {
      const $xeTable = $xeGanttView.internalData.xeTable
      const { tableData, tableColumn, viewCellWidth } = reactData
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
            h('tbody', {}, $xeTable ? renderRows($xeTable, tableData) : [])
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
