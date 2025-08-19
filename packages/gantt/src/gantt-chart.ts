import { VNode, CreateElement } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import XEUtils from 'xe-utils'
import { getCellRestHeight } from './util'
import { getStringValue } from '../../ui/src/utils'

import type { TableInternalData, TableReactData, VxeTableConstructor, VxeTableMethods, VxeTablePrivateMethods } from 'vxe-table'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

const { renderEmptyElement } = VxeUI

export default defineVxeComponent({
  name: 'VxeGanttViewChart',
  inject: {
    $xeGantt: {
      default: null
    },
    $xeGanttView: {
      default: null
    }
  },
  props: {},
  data () {
    return {}
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
    renderTaskBar (h: CreateElement, $xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, row: any, rowid: string, $rowIndex: number) {
      const _vm = this
      const $xeGantt = _vm.$xeGantt

      const tableProps = $xeTable
      const { treeConfig } = tableProps
      const tableReactData = $xeTable as unknown as TableReactData
      const { resizeHeightFlag } = tableReactData
      const tableInternalData = $xeTable as unknown as TableInternalData
      const { fullAllDataRowIdData } = tableInternalData
      const cellOpts = $xeTable.computeCellOpts
      const rowOpts = $xeTable.computeRowOpts
      const defaultRowHeight = $xeTable.computeDefaultRowHeight

      const ganttSlots = $xeGantt.$scopedSlots
      const taskBarSlot = ganttSlots.taskBar || ganttSlots['task-bar']

      const titleField = $xeGantt.computeTitleField
      const progressField = $xeGantt.computeProgressField
      const taskBarOpts = $xeGantt.computeTaskBarOpts
      const { showProgress, showContent, contentMethod, barStyle } = taskBarOpts
      const { round } = barStyle || {}

      const rowRest = fullAllDataRowIdData[rowid] || {}
      const resizeHeight = resizeHeightFlag ? rowRest.resizeHeight : 0
      const isRsHeight = resizeHeight > 0
      const cellHeight = getCellRestHeight(rowRest, cellOpts, rowOpts, defaultRowHeight)

      let title = getStringValue(XEUtils.get(row, titleField))
      const progressValue = showProgress ? Math.min(100, Math.max(0, XEUtils.toNumber(XEUtils.get(row, progressField)))) : 0

      if (contentMethod) {
        title = getStringValue(contentMethod({ row, title }))
      }
      return h('div', {
        key: treeConfig ? rowid : $rowIndex,
        attrs: {
          rowid
        },
        class: ['vxe-gantt-view--chart-row', {
          'is--round': round,
          'col--rs-height': isRsHeight
        }],
        style: {
          height: `${cellHeight}px`
        }
      }, [
        h('div', {
          class: taskBarSlot ? 'vxe-gantt-view--chart-custom-bar' : 'vxe-gantt-view--chart-bar',
          attrs: {
            rowid
          },
          on: {
            click (evnt: MouseEvent) {
              $xeGantt.handleTaskBarClickEvent(evnt, { row })
            },
            dblclick (evnt: MouseEvent) {
              $xeGantt.handleTaskBarDblclickEvent(evnt, { row })
            }
          }
        }, taskBarSlot
          ? $xeGantt.callSlot(taskBarSlot, { row }, h)
          : [
              showProgress
                ? h('div', {
                  class: 'vxe-gantt-view--chart-progress',
                  style: {
                    width: `${progressValue}%`
                  }
                })
                : renderEmptyElement($xeGantt),
              showContent
                ? h('div', {
                  class: 'vxe-gantt-view--chart-content'
                }, title)
                : renderEmptyElement($xeGantt)
            ])
      ])
    },
    renderRows (h: CreateElement, $xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, tableData: any[]) {
      const _vm = this
      const $xeGanttView = _vm.$xeGanttView
      const { reactData } = $xeGanttView

      const tableProps = $xeTable
      const { treeConfig } = tableProps
      const tableReactData = $xeTable as unknown as TableReactData
      const { treeExpandedFlag } = tableReactData
      const tableInternalData = $xeTable as unknown as TableInternalData
      const { treeExpandedMaps } = tableInternalData
      const treeOpts = $xeTable.computeTreeOpts
      const { transform } = treeOpts
      const childrenField = treeOpts.children || treeOpts.childrenField

      const { scrollYLoad } = reactData

      const trVNs: VNode[] = []
      tableData.forEach((row, $rowIndex) => {
        const rowid = $xeTable ? $xeTable.getRowid(row) : ''
        trVNs.push(_vm.renderTaskBar(h, $xeTable, row, rowid, $rowIndex))
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
    renderVN (h: CreateElement): VNode {
      const _vm = this
      const $xeGanttView = _vm.$xeGanttView
      const { reactData } = $xeGanttView

      const $xeTable = $xeGanttView.internalData.xeTable

      const { tableData } = reactData

      return h('div', {
        ref: 'refElem',
        class: 'vxe-gantt-view--chart-wrapper'
      }, $xeTable ? _vm.renderRows(h, $xeTable, tableData) : [])
    }
  },
  mounted () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const { internalData } = $xeGanttView

    const { elemStore } = internalData
    const prefix = 'main-chart-'
    elemStore[`${prefix}wrapper`] = _vm.$refs.refElem as HTMLDivElement
  },
  destroyed () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const { internalData } = $xeGanttView

    const { elemStore } = internalData
    const prefix = 'main-chart-'
    elemStore[`${prefix}wrapper`] = null
  },
  render (this: any, h) {
    return this.renderVN(h)
  }
})
