import { h, inject, VNode, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { getCellRestHeight } from './util'
import { getClass } from '../../ui/src/utils'
import XEUtils from 'xe-utils'
import GanttViewChartComponent from './gantt-chart'

import type { VxeTableConstructor, VxeTableMethods, VxeTablePrivateMethods, VxeTableDefines } from 'vxe-table'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods, VxeGanttDefines } from '../../../types'

const sourceType = 'gantt'
const viewType = 'body'

export default defineVxeComponent({
  name: 'VxeGanttViewBody',
  setup () {
    const $xeGantt = inject('$xeGantt', {} as (VxeGanttConstructor & VxeGanttPrivateMethods))
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { computeTaskViewOpts, computeScaleUnit } = $xeGantt.getComputeMaps()
    const { reactData, internalData } = $xeGanttView

    const refElem = ref() as Ref<HTMLDivElement>
    const refBodyScroll = ref() as Ref<HTMLDivElement>
    const refBodyTable = ref() as Ref<HTMLTableElement>
    const refBodyXSpace = ref() as Ref<HTMLDivElement>
    const refBodyYSpace = ref() as Ref<HTMLDivElement>

    const renderColumn = ($xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, row: any, rowid: string, rowIndex: number, $rowIndex: number, _rowIndex: number, column: VxeGanttDefines.ViewColumn, $columnIndex: number) => {
      const tableReactData = $xeTable.reactData
      const { resizeHeightFlag } = tableReactData
      const tableInternalData = $xeTable.internalData
      const { fullAllDataRowIdData, visibleColumn } = tableInternalData
      const { computeCellOpts, computeRowOpts, computeDefaultRowHeight, computeResizableOpts } = $xeTable.getComputeMaps()
      const cellOpts = computeCellOpts.value
      const rowOpts = computeRowOpts.value
      const defaultRowHeight = computeDefaultRowHeight.value
      const resizableOpts = computeResizableOpts.value
      const { isAllRowDrag } = resizableOpts

      const { headerGroups } = reactData
      const { todayDateMaps } = internalData
      const taskViewOpts = computeTaskViewOpts.value
      const { showNowLine, viewStyle } = taskViewOpts
      const scaleUnit = computeScaleUnit.value
      const { scaleItem } = headerGroups[headerGroups.length - 1] || {}
      const { field, dateObj } = column
      const { cellClassName, cellStyle } = viewStyle || {}
      const todayValue = showNowLine && scaleItem ? todayDateMaps[scaleItem.type] : null

      const rowRest = fullAllDataRowIdData[rowid] || {}
      const resizeHeight = resizeHeightFlag ? rowRest.resizeHeight : 0
      const isRsHeight = resizeHeight > 0
      const cellHeight = getCellRestHeight(rowRest, cellOpts, rowOpts, defaultRowHeight)

      const tdVNs: VNode[] = []
      if (isAllRowDrag && rowOpts.resizable) {
        const cellParams: VxeTableDefines.CellRenderBodyParams = {
          $table: $xeTable,
          $grid: null,
          $gantt: $xeGantt,
          seq: -1,
          rowid,
          row,
          rowIndex,
          $rowIndex,
          _rowIndex,
          column: visibleColumn[0],
          columnIndex: 0,
          $columnIndex: 0,
          _columnIndex: 0,
          fixed: '',
          source: sourceType,
          type: viewType,
          isHidden: false,
          isEdit: false,
          level: -1,

          // 已废弃属性
          visibleData: [],
          data: [],
          items: []
        }
        tdVNs.push(
          h('div', {
            class: 'vxe-gantt-view-cell--row-resizable',
            onMousedown: (evnt: MouseEvent) => $xeTable.handleRowResizeMousedownEvent(evnt, cellParams),
            onDblclick: (evnt: MouseEvent) => $xeTable.handleRowResizeDblclickEvent(evnt, cellParams)
          })
        )
      }
      const ctParams = {
        $gantt: $xeGantt,
        source: sourceType,
        type: viewType,
        scaleType: scaleUnit,
        dateObj,
        row,
        column,
        $rowIndex,
        rowIndex,
        _rowIndex
      }
      return h('td', {
        key: $columnIndex,
        class: [
          'vxe-gantt-view--body-column',
          {
            'is--now': showNowLine && todayValue === field,
            'col--rs-height': isRsHeight
          },
          getClass(cellClassName, ctParams)
        ],
        style: cellStyle
          ? Object.assign({}, XEUtils.isFunction(cellStyle) ? cellStyle(ctParams) : cellStyle, {
            height: `${cellHeight}px`
          })
          : {
              height: `${cellHeight}px`
            },
        onClick (evnt) {
          $xeGantt.handleTaskCellClickEvent(evnt, { row, column })
        },
        onDblclick (evnt) {
          $xeGantt.handleTaskCellDblclickEvent(evnt, { row, column })
        },
        onContextmenu (evnt) {
          $xeGantt.handleTaskBodyContextmenuEvent(evnt, ctParams)
        }
      }, tdVNs)
    }

    const renderRows = ($xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, tableData: any[]) => {
      const tableProps = $xeTable.props
      const { treeConfig, stripe, highlightHoverRow, editConfig } = tableProps
      const tableReactData = $xeTable.reactData
      const { treeExpandedFlag, selectRadioRow, pendingRowFlag, isRowGroupStatus } = tableReactData
      const tableInternalData = $xeTable.internalData
      const { fullAllDataRowIdData, treeExpandedMaps, pendingRowMaps } = tableInternalData
      const { computeRadioOpts, computeCheckboxOpts, computeTreeOpts, computeRowOpts } = $xeTable.getComputeMaps()
      const radioOpts = computeRadioOpts.value
      const checkboxOpts = computeCheckboxOpts.value
      const rowOpts = computeRowOpts.value
      const treeOpts = computeTreeOpts.value
      const { transform } = treeOpts
      const childrenField = treeOpts.children || treeOpts.childrenField

      const scaleUnit = computeScaleUnit.value
      const taskViewOpts = computeTaskViewOpts.value
      const { viewStyle } = taskViewOpts
      const { rowClassName, rowStyle } = viewStyle || {}

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
        // 是否新增行
        let isNewRow = false
        if (editConfig) {
          isNewRow = $xeTable.isInsertByRow(row)
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
        // 拖拽行事件
        if (rowOpts.drag && !isRowGroupStatus && (!treeConfig || transform)) {
          trOns.onDragstart = $xeTable.handleRowDragDragstartEvent
          trOns.onDragend = $xeTable.handleRowDragDragendEvent
          trOns.onDragover = $xeTable.handleRowDragDragoverEvent
        }
        const rowParams = {
          $gantt: $xeGantt,
          source: sourceType,
          type: viewType,
          scaleType: scaleUnit,
          row,
          rowIndex,
          $rowIndex,
          _rowIndex
        }
        trVNs.push(
          h('tr', {
            key: treeConfig ? rowid : $rowIndex,
            class: [
              'vxe-gantt-view--body-row',
              {
                'row--stripe': stripe && (_rowIndex + 1) % 2 === 0,
                'is--new': isNewRow,
                'row--radio': radioOpts.highlight && $xeTable.eqRow(selectRadioRow, row),
                'row--checked': checkboxOpts.highlight && $xeTable.isCheckedByCheckboxRow(row),
                'row--pending': !!pendingRowFlag && !!pendingRowMaps[rowid]
              },
              getClass(rowClassName, rowParams)
            ],
            rowid,
            style: rowStyle ? XEUtils.isFunction(rowStyle) ? rowStyle(rowParams) : rowStyle : undefined,
            ...trOns
          }, tableColumn.map((column, $columnIndex) => renderColumn($xeTable, row, rowid, rowIndex, $rowIndex, _rowIndex, column, $columnIndex)))
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
          onScroll: $xeGanttView.triggerBodyScrollEvent,
          onContextmenu (evnt) {
            $xeGantt.handleTaskBodyContextmenuEvent(evnt, { source: sourceType, type: viewType, rowIndex: -1, $rowIndex: -1, _rowIndex: -1 })
          }
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
