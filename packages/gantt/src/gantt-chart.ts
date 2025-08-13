import { VNode, CreateElement } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import XEUtils from 'xe-utils'
import { getCellRestHeight } from './util'
import { getStringValue } from '../../ui/src/utils'

import type { VxeTablePropTypes, TableInternalData } from 'vxe-table'
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
    renderVN (h: CreateElement) {
      const _vm = this
      const $xeGantt = _vm.$xeGantt
      const $xeGanttView = _vm.$xeGanttView
      const $xeTable = $xeGanttView.internalData.xeTable

      const tableInternalData = ($xeTable ? $xeTable as unknown : {}) as TableInternalData
      const fullAllDataRowIdData = tableInternalData.fullAllDataRowIdData || {}
      let cellOpts: VxeTablePropTypes.CellConfig = {}
      let rowOpts : VxeTablePropTypes.RowConfig = {}
      let defaultRowHeight = 0
      if ($xeTable) {
        cellOpts = $xeTable.computeCellOpts
        rowOpts = $xeTable.computeRowOpts
        defaultRowHeight = $xeTable.computeDefaultRowHeight
      }

      const { reactData } = $xeGanttView
      const { tableData } = reactData
      const titleField = $xeGantt.computeTitleField
      const progressField = $xeGantt.computeProgressField
      const taskBarOpts = $xeGantt.computeTaskBarOpts
      const { showProgress, showContent, contentMethod, barStyle } = taskBarOpts
      const { round } = barStyle || {}

      const trVNs: VNode[] = []
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
            attrs: {
              rowid
            },
            class: ['vxe-gantt-view--chart-row', {
              'is--round': round
            }],
            style: {
              height: `${cellHeight}px`
            }
          }, [
            h('div', {
              class: 'vxe-gantt-view--chart-bar',
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
        ref: 'refElem',
        class: 'vxe-gantt-view--chart-wrapper'
      }, trVNs)
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
