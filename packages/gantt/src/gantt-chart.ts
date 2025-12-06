import { h, inject, VNode, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import XEUtils from 'xe-utils'
import { getCellRestHeight } from './util'
import { getStringValue } from '../../ui/src/utils'

import type { VxeComponentStyleType } from 'vxe-pc-ui'
import type { VxeTableConstructor, VxeTableMethods, VxeTablePrivateMethods } from 'vxe-table'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

const { renderEmptyElement } = VxeUI

const sourceType = 'gantt'
const viewType = 'chart'

export default defineVxeComponent({
  name: 'VxeGanttViewChart',
  setup () {
    const $xeGantt = inject('$xeGantt', {} as (VxeGanttConstructor & VxeGanttPrivateMethods))
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { reactData, internalData } = $xeGanttView
    const { computeProgressField, computeTitleField, computeTaskBarOpts } = $xeGantt.getComputeMaps()

    const refElem = ref() as Ref<HTMLDivElement>

    const renderTaskBar = ($xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, row: any, rowid: string, rowIndex: number, $rowIndex: number, _rowIndex: number) => {
      const tableProps = $xeTable.props
      const { treeConfig } = tableProps
      const tableReactData = $xeTable.reactData
      const { resizeHeightFlag } = tableReactData
      const tableInternalData = $xeTable.internalData
      const { fullAllDataRowIdData } = tableInternalData
      const { computeCellOpts, computeRowOpts, computeDefaultRowHeight } = $xeTable.getComputeMaps()
      const cellOpts = computeCellOpts.value
      const rowOpts = computeRowOpts.value
      const defaultRowHeight = computeDefaultRowHeight.value

      const ganttSlots = $xeGantt.context.slots
      const taskBarSlot = ganttSlots.taskBar || ganttSlots['task-bar']

      const titleField = computeTitleField.value
      const progressField = computeProgressField.value
      const taskBarOpts = computeTaskBarOpts.value
      const barParams = { $gantt: $xeGantt, row }
      const { showProgress, showContent, contentMethod, barStyle, drag, showTooltip } = taskBarOpts
      const isBarRowStyle = XEUtils.isFunction(barStyle)
      const barStyObj = (barStyle ? (isBarRowStyle ? barStyle(barParams) : barStyle) : {}) || {}
      const { round } = barStyObj

      const rowRest = fullAllDataRowIdData[rowid] || {}
      const resizeHeight = resizeHeightFlag ? rowRest.resizeHeight : 0
      const isRsHeight = resizeHeight > 0
      const cellHeight = getCellRestHeight(rowRest, cellOpts, rowOpts, defaultRowHeight)

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
        title = getStringValue(contentMethod({ row, title }))
      }

      const ctParams = { source: sourceType, type: viewType, row, $rowIndex, rowIndex, _rowIndex, $gantt: $xeGantt }
      const ons: {
        onClick: any
        onDblclick: any
        onMousedown: any
        onMouseover?: any
        onMouseleave?: any
      } = {
        onClick (evnt: MouseEvent) {
          $xeGantt.handleTaskBarClickEvent(evnt, barParams)
        },
        onDblclick (evnt: MouseEvent) {
          $xeGantt.handleTaskBarDblclickEvent(evnt, barParams)
        },
        onMousedown (evnt: MouseEvent) {
          if ($xeGantt.handleTaskBarMousedownEvent) {
            $xeGantt.handleTaskBarMousedownEvent(evnt, barParams)
          }
        }
      }
      if (showTooltip) {
        ons.onMouseover = (evnt: MouseEvent) => {
          const ttParams = Object.assign({ $event: evnt }, ctParams)
          $xeGantt.triggerTaskBarTooltipEvent(evnt, ttParams)
          $xeGantt.dispatchEvent('task-bar-mouseenter', ttParams, evnt)
        }
        ons.onMouseleave = (evnt: MouseEvent) => {
          const ttParams = Object.assign({ $event: evnt }, ctParams)
          $xeGantt.handleTaskBarTooltipLeaveEvent(evnt, ttParams)
          $xeGantt.dispatchEvent('task-bar-mouseleave', ttParams, evnt)
        }
      }
      return h('div', {
        key: treeConfig ? rowid : $rowIndex,
        rowid,
        class: ['vxe-gantt-view--chart-row', {
          'is--round': round,
          'is--drag': drag,
          'col--rs-height': isRsHeight
        }],
        style: {
          height: `${cellHeight}px`
        },
        onContextmenu (evnt) {
          $xeGantt.handleTaskBarContextmenuEvent(evnt, ctParams)
        }
      }, [
        h('div', {
          class: taskBarSlot ? 'vxe-gantt-view--chart-custom-bar' : 'vxe-gantt-view--chart-bar',
          style: vbStyle,
          rowid,
          ...ons
        }, taskBarSlot
          ? $xeGantt.callSlot(taskBarSlot, barParams)
          : [
              showProgress
                ? h('div', {
                  class: 'vxe-gantt-view--chart-progress',
                  style: vpStyle
                })
                : renderEmptyElement($xeGantt),
              showContent
                ? h('div', {
                  class: 'vxe-gantt-view--chart-content'
                }, title)
                : renderEmptyElement($xeGantt)
            ])
      ])
    }

    const renderRows = ($xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, tableData: any[]) => {
      const tableProps = $xeTable.props
      const { treeConfig } = tableProps
      const tableReactData = $xeTable.reactData
      const { treeExpandedFlag } = tableReactData
      const tableInternalData = $xeTable.internalData
      const { fullAllDataRowIdData, treeExpandedMaps } = tableInternalData
      const { computeTreeOpts } = $xeTable.getComputeMaps()
      const treeOpts = computeTreeOpts.value
      const { transform } = treeOpts
      const childrenField = treeOpts.children || treeOpts.childrenField

      const { scrollYLoad } = reactData

      const trVNs: VNode[] = []
      tableData.forEach((row, $rowIndex) => {
        const rowid = $xeTable ? $xeTable.getRowid(row) : ''
        const rowRest = fullAllDataRowIdData[rowid] || {}
        let rowIndex = $rowIndex
        let _rowIndex = -1
        if (rowRest) {
          rowIndex = rowRest.index
          _rowIndex = rowRest._index
        }
        trVNs.push(renderTaskBar($xeTable, row, rowid, rowIndex, $rowIndex, _rowIndex))
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

      const { tableData } = reactData

      return h('div', {
        ref: refElem,
        class: 'vxe-gantt-view--chart-wrapper'
      }, $xeTable ? renderRows($xeTable, tableData) : [])
    }

    onMounted(() => {
      const { elemStore } = internalData
      const prefix = 'main-chart-'
      elemStore[`${prefix}wrapper`] = refElem
    })

    onUnmounted(() => {
      const { elemStore } = internalData
      const prefix = 'main-chart-'
      elemStore[`${prefix}wrapper`] = null
    })

    return renderVN
  }
})
