import { VNode, CreateElement } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { getCellRestHeight } from './util'
import GanttViewChartComponent from './gantt-chart'

import type { TableInternalData, TableReactData, VxeTableConstructor, VxeTableMethods, VxeTablePrivateMethods, VxeTableDefines } from 'vxe-table'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods, VxeGanttPropTypes } from '../../../types'

export default defineVxeComponent({
  name: 'VxeGanttViewBody',
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
    renderColumn (h: CreateElement, $xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, row: any, rowid: string, rowIndex: number, $rowIndex: number, _rowIndex: number, column: VxeGanttPropTypes.Column, $columnIndex: number) {
      const _vm = this
      const $xeGantt = _vm.$xeGantt

      const tableReactData = $xeTable as unknown as TableReactData
      const { resizeHeightFlag } = tableReactData
      const tableInternalData = $xeTable as unknown as TableInternalData
      const { fullAllDataRowIdData, visibleColumn } = tableInternalData
      const cellOpts = $xeTable.computeCellOpts
      const rowOpts = $xeTable.computeRowOpts
      const defaultRowHeight = $xeTable.computeDefaultRowHeight
      const resizableOpts = $xeTable.computeResizableOpts
      const { isAllRowDrag } = resizableOpts

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
          type: '',
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
            on: {
              mousedown: (evnt: MouseEvent) => $xeTable.handleRowResizeMousedownEvent(evnt, cellParams),
              dblclick: (evnt: MouseEvent) => $xeTable.handleRowResizeDblclickEvent(evnt, cellParams)
            }
          })
        )
      }
      return h('td', {
        key: $columnIndex,
        class: ['vxe-gantt-view--body-column', {
          'col--rs-height': isRsHeight
        }],
        style: {
          height: `${cellHeight}px`
        },
        on: {
          click (evnt: MouseEvent) {
            $xeGantt.handleTaskCellClickEvent(evnt, { row, column })
          },
          dblclick (evnt: MouseEvent) {
            $xeGantt.handleTaskCellDblclickEvent(evnt, { row, column })
          }
        }
      }, tdVNs)
    },
    renderRows (h: CreateElement, $xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, tableData: any[]) {
      const _vm = this
      const $xeGanttView = _vm.$xeGanttView
      const { reactData } = $xeGanttView

      const tableProps = $xeTable
      const { treeConfig, stripe, highlightHoverRow, editConfig } = tableProps
      const tableReactData = $xeTable as unknown as TableReactData
      const { treeExpandedFlag, selectRadioRow, pendingRowFlag, isRowGroupStatus } = tableReactData
      const tableInternalData = $xeTable as unknown as TableInternalData
      const { fullAllDataRowIdData, treeExpandedMaps, pendingRowMaps } = tableInternalData
      const radioOpts = $xeTable.computeRadioOpts
      const checkboxOpts = $xeTable.computeCheckboxOpts
      const rowOpts = $xeTable.computeRowOpts
      const treeOpts = $xeTable.computeTreeOpts
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
        // 是否新增行
        let isNewRow = false
        if (editConfig) {
          isNewRow = $xeTable.isInsertByRow(row)
        }
        // 当前行事件
        if (rowOpts.isHover || highlightHoverRow) {
          trOns.mouseenter = (evnt: MouseEvent) => {
            $xeTable.triggerHoverEvent(evnt, { row, rowIndex })
          }
          trOns.mouseleave = () => {
            $xeTable.clearHoverRow()
          }
        }
        // 拖拽行事件
        if (rowOpts.drag && !isRowGroupStatus && (!treeConfig || transform)) {
          trOns.dragstart = $xeTable.handleRowDragDragstartEvent
          trOns.dragend = $xeTable.handleRowDragDragendEvent
          trOns.dragover = $xeTable.handleRowDragDragoverEvent
        }
        trVNs.push(
          h('tr', {
            key: treeConfig ? rowid : $rowIndex,
            class: ['vxe-gantt-view--body-row', {
              'row--stripe': stripe && (_rowIndex + 1) % 2 === 0,
              'is--new': isNewRow,
              'row--radio': radioOpts.highlight && $xeTable.eqRow(selectRadioRow, row),
              'row--checked': checkboxOpts.highlight && $xeTable.isCheckedByCheckboxRow(row),
              'row--pending': !!pendingRowFlag && !!pendingRowMaps[rowid]
            }],
            attrs: {
              rowid
            },
            on: trOns
          }, tableColumn.map((column, $columnIndex) => _vm.renderColumn(h, $xeTable, row, rowid, rowIndex, $rowIndex, _rowIndex, column, $columnIndex)))
        )
        let isExpandTree = false
        let rowChildren: any[] = []

        if (treeConfig && !scrollYLoad && !transform) {
          rowChildren = row[childrenField]
          isExpandTree = !!treeExpandedFlag && rowChildren && rowChildren.length > 0 && !!treeExpandedMaps[rowid]
        }
        // 如果是树形表格
        if (isExpandTree) {
          trVNs.push(..._vm.renderRows(h, $xeTable, rowChildren))
        }
      })
      return trVNs
    },
    renderVN (h: CreateElement) {
      const _vm = this
      const $xeGanttView = _vm.$xeGanttView
      const { reactData } = $xeGanttView

      const $xeTable = $xeGanttView.internalData.xeTable

      const { tableData, tableColumn, viewCellWidth } = reactData
      return h('div', {
        ref: 'refElem',
        class: 'vxe-gantt-view--body-wrapper'
      }, [
        h('div', {
          ref: 'refBodyScroll',
          class: 'vxe-gantt-view--body-inner-wrapper',
          on: {
            scroll: $xeGanttView.triggerBodyScrollEvent
          }
        }, [
          h('div', {
            ref: 'refBodyXSpace',
            class: 'vxe-body--x-space'
          }),
          h('div', {
            ref: 'refBodyYSpace',
            class: 'vxe-body--y-space'
          }),
          h('table', {
            ref: 'refBodyTable',
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
            h('tbody', {}, $xeTable ? _vm.renderRows(h, $xeTable, tableData) : [])
          ]),
          h(GanttViewChartComponent)
        ])
      ])
    }
  },
  mounted () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const { internalData } = $xeGanttView

    const { elemStore } = internalData
    const prefix = 'main-body-'
    elemStore[`${prefix}wrapper`] = _vm.$refs.refElem as HTMLDivElement
    elemStore[`${prefix}scroll`] = _vm.$refs.refBodyScroll as HTMLDivElement
    elemStore[`${prefix}table`] = _vm.$refs.refBodyTable as HTMLDivElement
    elemStore[`${prefix}xSpace`] = _vm.$refs.refBodyXSpace as HTMLDivElement
    elemStore[`${prefix}ySpace`] = _vm.$refs.refBodyYSpace as HTMLDivElement
  },
  destroyed () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const { internalData } = $xeGanttView

    const { elemStore } = internalData
    const prefix = 'main-body-'
    elemStore[`${prefix}wrapper`] = null
    elemStore[`${prefix}scroll`] = null
    elemStore[`${prefix}table`] = null
    elemStore[`${prefix}xSpace`] = null
    elemStore[`${prefix}ySpace`] = null
  },
  render (this: any, h) {
    return this.renderVN(h)
  }
})
