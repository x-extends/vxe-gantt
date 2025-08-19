import { h, inject, VNode, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import XEUtils from 'xe-utils'
import { getCellRestHeight } from './util'
import { getStringValue } from '../../ui/src/utils'

import type { VxeTableConstructor, VxeTableMethods, VxeTablePrivateMethods } from 'vxe-table'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

const { renderEmptyElement } = VxeUI

export default defineVxeComponent({
  name: 'VxeGanttViewChart',
  setup () {
    const $xeGantt = inject('$xeGantt', {} as (VxeGanttConstructor & VxeGanttPrivateMethods))
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { reactData, internalData } = $xeGanttView
    const { computeProgressField, computeTitleField, computeTaskBarOpts } = $xeGantt.getComputeMaps()

    const refElem = ref() as Ref<HTMLDivElement>

    const renderTaskBar = ($xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, row: any, rowid: string, $rowIndex: number) => {
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
        rowid,
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
          rowid,
          onClick (evnt) {
            $xeGantt.handleTaskBarClickEvent(evnt, { row })
          },
          onDblclick (evnt) {
            $xeGantt.handleTaskBarDblclickEvent(evnt, { row })
          }
        }, taskBarSlot
          ? $xeGantt.callSlot(taskBarSlot, { row })
          : [
              showProgress
                ? h('div', {
                  class: 'vxe-gantt-view--chart-progress',
                  style: {
                    width: `${progressValue || 0}%`
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
    }

    const renderRows = ($xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, tableData: any[]) => {
      const tableProps = $xeTable.props
      const { treeConfig } = tableProps
      const tableReactData = $xeTable.reactData
      const { treeExpandedFlag } = tableReactData
      const tableInternalData = $xeTable.internalData
      const { treeExpandedMaps } = tableInternalData
      const { computeTreeOpts } = $xeTable.getComputeMaps()
      const treeOpts = computeTreeOpts.value
      const { transform } = treeOpts
      const childrenField = treeOpts.children || treeOpts.childrenField

      const { scrollYLoad } = reactData

      const trVNs: VNode[] = []
      tableData.forEach((row, $rowIndex) => {
        const rowid = $xeTable ? $xeTable.getRowid(row) : ''
        trVNs.push(renderTaskBar($xeTable, row, rowid, $rowIndex))
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
