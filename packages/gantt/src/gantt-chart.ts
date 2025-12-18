import { VNode, CreateElement } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import XEUtils from 'xe-utils'
import { getCellRestHeight } from './util'
import { getStringValue, isEnableConf } from '../../ui/src/utils'

import type { VxeComponentStyleType } from 'vxe-pc-ui'
import type { TableInternalData, TableReactData, VxeTableConstructor, VxeTableMethods, VxeTablePrivateMethods } from 'vxe-table'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

const { renderEmptyElement } = VxeUI

const sourceType = 'gantt'
const viewType = 'chart'

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
    renderTaskBar (h: CreateElement, $xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, row: any, rowid: string, rowIndex: number, $rowIndex: number, _rowIndex: number) {
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
      const scaleUnit = $xeGantt.computeScaleUnit
      const barParams = { $gantt: $xeGantt, row, scaleType: scaleUnit }
      const { showProgress, showContent, contentMethod, barStyle, move, showTooltip } = taskBarOpts
      const isBarRowStyle = XEUtils.isFunction(barStyle)
      const barStyObj = (barStyle ? (isBarRowStyle ? barStyle(barParams) : barStyle) : {}) || {}
      const { round } = barStyObj

      const rowRest = fullAllDataRowIdData[rowid] || {}
      const cellHeight = resizeHeightFlag ? getCellRestHeight(rowRest, cellOpts, rowOpts, defaultRowHeight) : 0

      let title = getStringValue(XEUtils.get(row, titleField))
      const progressValue = showProgress ? Math.min(100, Math.max(0, XEUtils.toNumber(XEUtils.get(row, progressField)))) : 0

      const vbStyle: VxeComponentStyleType = {}
      const vpStyle: VxeComponentStyleType = {
        width: `${progressValue || 0}%`
      }
      if (isBarRowStyle) {
        const { bgColor, completedBgColor } = barStyObj
        if (bgColor) {
          vbStyle.backgroundColor = bgColor
        }
        if (completedBgColor) {
          vpStyle.backgroundColor = completedBgColor
        }
      }

      if (contentMethod) {
        title = getStringValue(contentMethod({ row, title, scaleType: scaleUnit }))
      }

      const ctParams = {
        $gantt: $xeGantt,
        source: sourceType,
        type: viewType,
        scaleType: scaleUnit,
        row,
        $rowIndex,
        rowIndex,
        _rowIndex
      }
      const ons: {
        click: any
        dblclick: any
        mousedown: any
        mouseover?: any
        mouseleave?: any
      } = {
        click (evnt: MouseEvent) {
          $xeGantt.handleTaskBarClickEvent(evnt, barParams)
        },
        dblclick (evnt: MouseEvent) {
          $xeGantt.handleTaskBarDblclickEvent(evnt, barParams)
        },
        mousedown (evnt: MouseEvent) {
          if ($xeGantt.handleTaskBarMousedownEvent) {
            $xeGantt.handleTaskBarMousedownEvent(evnt, barParams)
          }
        }
      }
      if (showTooltip) {
        ons.mouseover = (evnt: MouseEvent) => {
          $xeGantt.triggerTaskBarTooltipEvent(evnt, Object.assign({ $event: evnt }, ctParams))
        }
        ons.mouseleave = (evnt: MouseEvent) => {
          $xeGantt.handleTaskBarTooltipLeaveEvent(evnt, Object.assign({ $event: evnt }, ctParams))
        }
      }
      return h('div', {
        key: treeConfig ? rowid : $rowIndex,
        attrs: {
          rowid
        },
        class: ['vxe-gantt-view--chart-row', {
          'is--round': round,
          'is--move': move
        }],
        style: {
          height: `${cellHeight}px`
        },
        on: {
          contextmenu (evnt: Event) {
            $xeGantt.handleTaskBarContextmenuEvent(evnt, ctParams)
          }
        }
      }, [
        h('div', {
          class: taskBarSlot ? 'vxe-gantt-view--chart-custom-bar' : 'vxe-gantt-view--chart-bar',
          style: vbStyle,
          attrs: {
            rowid
          },
          on: ons
        }, $xeGantt.renderGanttTaskBarContent
          ? $xeGantt.renderGanttTaskBarContent(h, ctParams, {
            title,
            vbStyle,
            vpStyle
          })
          : (taskBarSlot
              ? [
                  h('div', {
                    key: 'cbc',
                    class: 'vxe-gantt-view--chart-custom-bar-content'
                  }, $xeGantt.callSlot(taskBarSlot, barParams, h))
                ]
              : [
                  showProgress
                    ? h('div', {
                      key: 'vcp',
                      class: 'vxe-gantt-view--chart-progress',
                      style: vpStyle
                    })
                    : renderEmptyElement($xeGantt),
                  showContent
                    ? h('div', {
                      key: 'vcc',
                      class: 'vxe-gantt-view--chart-content'
                    }, title)
                    : renderEmptyElement($xeGantt)
                ]))
      ])
    },
    renderTaskRows (h: CreateElement, $xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, tableData: any[]) {
      const _vm = this
      const $xeGanttView = _vm.$xeGanttView
      const ganttViewReactData = $xeGanttView.reactData

      const tableProps = $xeTable
      const { treeConfig } = tableProps
      const tableReactData = $xeTable as unknown as TableReactData
      const { treeExpandedFlag } = tableReactData
      const tableInternalData = $xeTable as unknown as TableInternalData
      const { fullAllDataRowIdData, treeExpandedMaps } = tableInternalData
      const treeOpts = $xeTable.computeTreeOpts
      const { transform } = treeOpts
      const childrenField = treeOpts.children || treeOpts.childrenField

      const { scrollYLoad } = ganttViewReactData

      const trVNs: VNode[] = []
      tableData.forEach((row, $rowIndex) => {
        const rowid = $xeTable.getRowid(row)
        const rowRest = fullAllDataRowIdData[rowid] || {}
        let rowIndex = $rowIndex
        let _rowIndex = -1
        if (rowRest) {
          rowIndex = rowRest.index
          _rowIndex = rowRest._index
        }
        trVNs.push(_vm.renderTaskBar(h, $xeTable, row, rowid, rowIndex, $rowIndex, _rowIndex))
        let isExpandTree = false
        let rowChildren: any[] = []

        if (treeConfig && !scrollYLoad && !transform) {
          rowChildren = row[childrenField]
          isExpandTree = !!treeExpandedFlag && rowChildren && rowChildren.length > 0 && !!treeExpandedMaps[rowid]
        }
        // 如果是树形表格
        if (isExpandTree) {
          trVNs.push(..._vm.renderTaskRows(h, $xeTable, rowChildren))
        }
      })
      return trVNs
    },
    renderVN (h: CreateElement): VNode {
      const _vm = this
      const $xeGantt = _vm.$xeGantt
      const $xeGanttView = _vm.$xeGanttView
      const ganttViewInternalData = $xeGanttView.internalData
      const ganttViewReactData = $xeGanttView.reactData

      const $xeTable = ganttViewInternalData.xeTable

      const { tableData } = ganttViewReactData
      const taskLinkOpts = $xeGantt.computeTaskLinkOpts
      const { showArrow } = taskLinkOpts

      return h('div', {
        ref: 'refElem',
        class: 'vxe-gantt-view--chart-wrapper'
      }, [
        $xeGantt.renderGanttTaskLines
          ? h('div', {
            ref: 'reflineWrapperElem',
            class: ['vxe-gantt-view--chart-line-wrapper', {
              'show-arrow': showArrow
            }]
          }, $xeTable && isEnableConf(taskLinkOpts) ? $xeGantt.renderGanttTaskLines(h) : [])
          : renderEmptyElement($xeGantt),
        h('div', {
          ref: 'refTaskWrapperElem',
          class: 'vxe-gantt-view--chart-task-wrapper'
        }, $xeTable ? _vm.renderTaskRows(h, $xeTable, tableData) : [])
      ])
    }
  },
  mounted () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const ganttViewInternalData = $xeGanttView.internalData

    const { elemStore } = ganttViewInternalData
    const prefix = 'main-chart-'
    elemStore[`${prefix}task-wrapper`] = _vm.$refs.refTaskWrapperElem as HTMLDivElement
    elemStore[`${prefix}line-wrapper`] = _vm.$refs.reflineWrapperElem as HTMLDivElement
  },
  destroyed () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const ganttViewInternalData = $xeGanttView.internalData

    const { elemStore } = ganttViewInternalData
    const prefix = 'main-chart-'
    elemStore[`${prefix}task-wrapper`] = null
    elemStore[`${prefix}line-wrapper`] = null
  },
  render (this: any, h) {
    return this.renderVN(h)
  }
})
