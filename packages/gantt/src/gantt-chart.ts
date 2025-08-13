import { h, inject, VNode, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import XEUtils from 'xe-utils'
import { getCellRestHeight } from './util'
import { getStringValue } from '../../ui/src/utils'

import type { VxeTablePropTypes } from 'vxe-table'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

const { renderEmptyElement } = VxeUI

export default defineVxeComponent({
  name: 'VxeGanttViewChart',
  setup () {
    const $xeGantt = inject('$xeGantt', {} as (VxeGanttConstructor & VxeGanttPrivateMethods))
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { reactData, internalData } = $xeGanttView
    const { refTable } = $xeGantt.getRefMaps()
    const { computeProgressField, computeTitleField, computeTaskBarOpts } = $xeGantt.getComputeMaps()

    const refElem = ref() as Ref<HTMLDivElement>

    const renderVN = () => {
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

      const { tableData } = reactData
      const titleField = computeTitleField.value
      const progressField = computeProgressField.value
      const taskBarOpts = computeTaskBarOpts.value
      const { showProgress, showContent, contentMethod, barStyle } = taskBarOpts
      const { round } = barStyle || {}

      const trVNs:VNode[] = []
      tableData.forEach((row, rIndex) => {
        const rowid = $xeTable ? $xeTable.getRowid(row) : ''
        const rowRest = fullAllDataRowIdData[rowid] || {}
        const cellHeight = getCellRestHeight(rowRest, cellOpts, rowOpts, defaultRowHeight)
        let title = getStringValue(XEUtils.get(row, titleField))
        const progressValue = showProgress ? Math.min(100, Math.max(0, XEUtils.toNumber(XEUtils.get(row, progressField)))) : 0
        if (contentMethod) {
          title = getStringValue(contentMethod({ row, title }))
        }
        trVNs.push(
          h('div', {
            key: rIndex,
            rowid,
            class: ['vxe-gantt-view--chart-row', {
              'is--round': round
            }],
            style: {
              height: `${cellHeight}px`
            }
          }, [
            h('div', {
              class: 'vxe-gantt-view--chart-bar',
              rowid,
              onClick (evnt) {
                $xeGantt.handleTaskBarClickEvent(evnt, { row })
              },
              onDblclick (evnt) {
                $xeGantt.handleTaskBarDblclickEvent(evnt, { row })
              }
            }, [
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
        )
      })
      return h('div', {
        ref: refElem,
        class: 'vxe-gantt-view--chart-wrapper'
      }, trVNs)
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
