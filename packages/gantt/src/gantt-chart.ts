import { VNode, CreateElement } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import XEUtils from 'xe-utils'
import { getCellRestHeight, hasMilestoneTask, gettaskType } from './util'
import { getStringValue, isEnableConf } from '../../ui/src/utils'

import type { VxeComponentStyleType } from 'vxe-pc-ui'
import type { TableInternalData, TableReactData, VxeTableConstructor, VxeTableMethods, VxeTablePrivateMethods } from 'vxe-table'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

const { getIcon, renderEmptyElement } = VxeUI

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

      const tableReactData = $xeTable as unknown as TableReactData
      const { resizeHeightFlag, pendingRowFlag } = tableReactData
      const tableInternalData = $xeTable as unknown as TableInternalData
      const { fullAllDataRowIdData, pendingRowMaps } = tableInternalData
      const cellOpts = $xeTable.computeCellOpts
      const rowOpts = $xeTable.computeRowOpts
      const defaultRowHeight = $xeTable.computeDefaultRowHeight

      const ganttProps = $xeGantt
      const ganttReactData = $xeGantt.reactData
      const ganttInternalData = $xeGantt.internalData
      const ganttSlots = $xeGantt.$scopedSlots
      const taskBarSlot = ganttSlots.taskBar || ganttSlots['task-bar']

      const { taskBarMilestoneConfig } = ganttProps
      const { activeLink, activeBarRowid } = ganttReactData
      const titleField = $xeGantt.computeTitleField
      const progressField = $xeGantt.computeProgressField
      const typeField = $xeGantt.computeTypeField
      const taskBarOpts = $xeGantt.computeTaskBarOpts
      const taskBarMilestoneOpts = $xeGantt.computeTaskBarMilestoneOpts
      const scaleUnit = $xeGantt.computeScaleUnit
      const barParams = { $gantt: $xeGantt, row, scaleType: scaleUnit }
      const { showProgress, showContent, contentMethod, barStyle, moveable, showTooltip } = taskBarOpts
      const isBarRowStyle = XEUtils.isFunction(barStyle)
      const barStyObj = (barStyle ? (isBarRowStyle ? barStyle(barParams) : barStyle) : {}) || {}
      const { round } = barStyObj

      const rowRest = fullAllDataRowIdData[rowid] || {}
      const cellHeight = resizeHeightFlag ? getCellRestHeight(rowRest, cellOpts, rowOpts, defaultRowHeight) : 0

      let title = getStringValue(XEUtils.get(row, titleField))
      const progressValue = showProgress ? Math.min(100, Math.max(0, XEUtils.toNumber(XEUtils.get(row, progressField)))) : 0
      const typeValue = gettaskType(XEUtils.get(row, typeField))
      const isMilestone = !!(taskBarMilestoneConfig && hasMilestoneTask(typeValue))

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
      const ctOns: {
        mouseover?: any
        mouseleave?: any
      } = {}
      if (showTooltip) {
        ctOns.mouseover = (evnt: MouseEvent) => {
          const { dragBarRow } = ganttInternalData
          const ttParams = Object.assign({ $event: evnt }, ctParams)
          if (!dragBarRow) {
            $xeGantt.triggerTaskBarTooltipEvent(evnt, ttParams)
          }
          $xeGantt.dispatchEvent('task-bar-mouseenter', ttParams, evnt)
        }
        ctOns.mouseleave = (evnt: MouseEvent) => {
          const { dragBarRow } = ganttInternalData
          const ttParams = Object.assign({ $event: evnt }, ctParams)
          if (!dragBarRow) {
            $xeGantt.handleTaskBarTooltipLeaveEvent(evnt, ttParams)
          }
          $xeGantt.dispatchEvent('task-bar-mouseleave', ttParams, evnt)
        }
      }

      let cbVNs: VNode[] = []
      if ($xeGantt.renderGanttTaskBarContent) {
        cbVNs = $xeGantt.renderGanttTaskBarContent(h, ctParams, {
          isMilestone,
          title,
          vbStyle,
          vpStyle,
          rowid,
          ctOns
        })
      } else if (taskBarSlot) {
        cbVNs.push(
          h('div', {
            key: 'cbc',
            class: 'vxe-gantt-view--chart-custom-bar-content-wrapper',
            on: ctOns
          }, $xeGantt.callSlot(taskBarSlot, barParams, h))
        )
      } else {
        if (isMilestone) {
          const { icon, iconStatus, iconStyle } = taskBarMilestoneOpts
          const tbmParams = { $gantt: $xeGantt, row }
          cbVNs.push(
            h('div', {
              key: 'vcm',
              class: 'vxe-gantt-view--chart-milestone-wrapper',
              on: ctOns
            }, [
              h('div', {
                class: ['vxe-gantt-view--chart-milestone-icon', iconStatus ? `theme--${XEUtils.isFunction(iconStatus) ? iconStatus(tbmParams) : iconStatus}` : ''],
                style: iconStyle ? Object.assign({}, XEUtils.isFunction(iconStyle) ? iconStyle(tbmParams) : iconStyle) : undefined
              }, [
                h('i', {
                  class: (icon ? (XEUtils.isFunction(icon) ? icon(tbmParams) : icon) : '') || getIcon().GANTT_VIEW_TASK_MILESTONE
                })
              ]),
              showContent
                ? h('div', {
                  class: 'vxe-gantt-view--chart-milestone-content'
                }, title)
                : renderEmptyElement($xeGantt)
            ])
          )
        } else {
          cbVNs.push(
            h('div', {
              key: 'vbc',
              class: 'vxe-gantt-view--chart-bar-content-wrapper',
              on: ctOns
            }, [
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
            ])
          )
        }
      }

      return h('div', {
        key: rowid,
        attrs: {
          rowid
        },
        class: ['vxe-gantt-view--chart-row', `is--${gettaskType(typeValue)}`, {
          'row--pending': !!pendingRowFlag && !!pendingRowMaps[rowid],
          'is--round': round,
          'is--move': moveable
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
          class: [taskBarSlot ? 'vxe-gantt-view--chart-custom-bar' : 'vxe-gantt-view--chart-bar', `is--${gettaskType(typeValue)}`, {
            'is--active': activeBarRowid === rowid,
            'active--link': activeLink && (rowid === `${activeLink.from}` || rowid === `${activeLink.to}`)
          }],
          style: vbStyle,
          attrs: {
            rowid
          },
          on: {
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
        }, cbVNs)
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
      const ganttReactData = $xeGantt.reactData
      const ganttViewInternalData = $xeGanttView.internalData
      const ganttViewReactData = $xeGanttView.reactData

      const $xeTable = ganttViewInternalData.xeTable

      const { dragLinkFromStore } = ganttReactData
      const { tableData } = ganttViewReactData
      const taskLinkOpts = $xeGantt.computeTaskLinkOpts
      const taskBarOpts = $xeGantt.computeTaskBarOpts
      const { isCurrent, isHover } = taskLinkOpts
      const { linkCreatable } = taskBarOpts

      return h('div', {
        ref: 'refElem',
        class: ['vxe-gantt-view--chart-wrapper', {
          'is--cl-drag': dragLinkFromStore.rowid
        }]
      }, [
        $xeGantt.renderGanttTaskChartBefores
          ? h('div', {
            ref: 'refChartBeforeWrapperElem',
            class: ['vxe-gantt-view--chart-before-wrapper', {
              'link--current': isCurrent,
              'link--hover': isHover
            }]
          }, $xeTable && isEnableConf(taskLinkOpts) ? $xeGantt.renderGanttTaskChartBefores(h) : [])
          : renderEmptyElement($xeGantt),
        h('div', {
          ref: 'refTaskWrapperElem',
          class: ['vxe-gantt-view--chart-task-wrapper', {
            'link--current': isCurrent,
            'link--create': linkCreatable
          }]
        }, $xeTable ? _vm.renderTaskRows(h, $xeTable, tableData) : []),
        $xeGantt.renderGanttTaskChartAfters
          ? h('div', {
            ref: 'refChartAfterWrapperElem',
            class: 'vxe-gantt-view--chart-after-wrapper'
          }, $xeTable && isEnableConf(taskLinkOpts) ? $xeGantt.renderGanttTaskChartAfters(h) : [])
          : renderEmptyElement($xeGantt)
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
    elemStore[`${prefix}before-wrapper`] = _vm.$refs.refChartBeforeWrapperElem as HTMLDivElement
    elemStore[`${prefix}after-wrapper`] = _vm.$refs.refChartAfterWrapperElem as HTMLDivElement
  },
  destroyed () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const ganttViewInternalData = $xeGanttView.internalData

    const { elemStore } = ganttViewInternalData
    const prefix = 'main-chart-'
    elemStore[`${prefix}task-wrapper`] = null
    elemStore[`${prefix}before-wrapper`] = null
    elemStore[`${prefix}after-wrapper`] = null
  },
  render (this: any, h) {
    return this.renderVN(h)
  }
})
