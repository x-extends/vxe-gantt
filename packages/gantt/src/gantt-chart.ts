import { h, inject, VNode, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'
import XEUtils from 'xe-utils'
import { getCellRestHeight, hasMilestoneTask, gettaskType } from './util'
import { getStringValue, isEnableConf } from '../../ui/src/utils'

import type { VxeComponentStyleType } from 'vxe-pc-ui'
import type { VxeTableConstructor, VxeTableMethods, VxeTablePrivateMethods } from 'vxe-table'
import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

const { getIcon, renderEmptyElement } = VxeUI

const sourceType = 'gantt'
const viewType = 'chart'

export default defineVxeComponent({
  name: 'VxeGanttViewChart',
  setup () {
    const $xeGantt = inject('$xeGantt', {} as (VxeGanttConstructor & VxeGanttPrivateMethods))
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { props: ganttProps, reactData: ganttReactData, internalData: ganttInternalData } = $xeGantt
    const { reactData: ganttViewReactData, internalData: ganttViewInternalData } = $xeGanttView
    const { computeProgressField, computeTitleField, computeTypeField, computeTaskBarOpts, computeScaleUnit, computeTaskLinkOpts, computeTaskBarMilestoneOpts } = $xeGantt.getComputeMaps()

    const refElem = ref<HTMLDivElement>()
    const refTaskWrapperElem = ref() as Ref<HTMLDivElement>
    const refChartBeforeWrapperElem = ref() as Ref<HTMLDivElement>
    const refChartAfterWrapperElem = ref() as Ref<HTMLDivElement>

    const renderTaskBar = ($xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, row: any, rowid: string, rowIndex: number, $rowIndex: number, _rowIndex: number) => {
      const tableReactData = $xeTable.reactData
      const { resizeHeightFlag, pendingRowFlag } = tableReactData
      const tableInternalData = $xeTable.internalData
      const { fullAllDataRowIdData, pendingRowMaps } = tableInternalData
      const { computeCellOpts, computeRowOpts, computeDefaultRowHeight } = $xeTable.getComputeMaps()
      const cellOpts = computeCellOpts.value
      const rowOpts = computeRowOpts.value
      const defaultRowHeight = computeDefaultRowHeight.value

      const ganttSlots = $xeGantt.context.slots
      const taskBarSlot = ganttSlots.taskBar || ganttSlots['task-bar']

      const { taskBarMilestoneConfig } = ganttProps
      const { activeLink, activeBarRowid } = ganttReactData
      const titleField = computeTitleField.value
      const progressField = computeProgressField.value
      const typeField = computeTypeField.value
      const taskBarOpts = computeTaskBarOpts.value
      const taskBarMilestoneOpts = computeTaskBarMilestoneOpts.value
      const scaleUnit = computeScaleUnit.value
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
        onMouseover?: any
        onMouseleave?: any
      } = {}
      if (showTooltip) {
        ctOns.onMouseover = (evnt: MouseEvent) => {
          const { dragBarRow } = ganttInternalData
          const ttParams = Object.assign({ $event: evnt }, ctParams)
          if (!dragBarRow) {
            $xeGantt.triggerTaskBarTooltipEvent(evnt, ttParams)
          }
          $xeGantt.dispatchEvent('task-bar-mouseenter', ttParams, evnt)
        }
        ctOns.onMouseleave = (evnt: MouseEvent) => {
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
        cbVNs = $xeGantt.renderGanttTaskBarContent(ctParams, {
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
            ...ctOns
          }, $xeGantt.callSlot(taskBarSlot, barParams))
        )
      } else {
        if (isMilestone) {
          const { icon, iconStatus, iconStyle } = taskBarMilestoneOpts
          const tbmParams = { $gantt: $xeGantt, row }
          cbVNs.push(
            h('div', {
              key: 'vcm',
              class: 'vxe-gantt-view--chart-milestone-wrapper',
              ...ctOns
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
              ...ctOns
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
        rowid,
        class: ['vxe-gantt-view--chart-row', `is--${gettaskType(typeValue)}`, {
          'row--pending': !!pendingRowFlag && !!pendingRowMaps[rowid],
          'is--round': round,
          'is--move': moveable
        }],
        style: {
          height: `${cellHeight}px`
        },
        onContextmenu (evnt) {
          $xeGantt.handleTaskBarContextmenuEvent(evnt, ctParams)
        }
      }, [
        h('div', {
          class: [taskBarSlot ? 'vxe-gantt-view--chart-custom-bar' : 'vxe-gantt-view--chart-bar', `is--${gettaskType(typeValue)}`, {
            'is--active': activeBarRowid === rowid,
            'active--link': activeLink && (rowid === `${activeLink.from}` || rowid === `${activeLink.to}`)
          }],
          style: vbStyle,
          rowid,
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
        }, cbVNs)
      ])
    }

    const renderTaskRows = ($xeTable: VxeTableConstructor & VxeTableMethods & VxeTablePrivateMethods, tableData: any[]) => {
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
        trVNs.push(renderTaskBar($xeTable, row, rowid, rowIndex, $rowIndex, _rowIndex))
        let isExpandTree = false
        let rowChildren: any[] = []

        if (treeConfig && !scrollYLoad && !transform) {
          rowChildren = row[childrenField]
          isExpandTree = !!treeExpandedFlag && rowChildren && rowChildren.length > 0 && !!treeExpandedMaps[rowid]
        }
        // 如果是树形表格
        if (isExpandTree) {
          trVNs.push(...renderTaskRows($xeTable, rowChildren))
        }
      })
      return trVNs
    }

    const renderVN = () => {
      const $xeTable = ganttViewInternalData.xeTable

      const { dragLinkFromStore } = ganttReactData
      const { tableData } = ganttViewReactData
      const taskLinkOpts = computeTaskLinkOpts.value
      const taskBarOpts = computeTaskBarOpts.value
      const { isCurrent, isHover } = taskLinkOpts
      const { linkCreatable } = taskBarOpts

      return h('div', {
        ref: refElem,
        class: ['vxe-gantt-view--chart-wrapper', {
          'is--cl-drag': dragLinkFromStore.rowid
        }]
      }, [
        $xeGantt.renderGanttTaskChartBefores
          ? h('div', {
            ref: refChartBeforeWrapperElem,
            class: ['vxe-gantt-view--chart-before-wrapper', {
              'link--current': isCurrent,
              'link--hover': isHover
            }]
          }, $xeTable && isEnableConf(taskLinkOpts) ? $xeGantt.renderGanttTaskChartBefores() : [])
          : renderEmptyElement($xeGantt),
        h('div', {
          ref: refTaskWrapperElem,
          class: ['vxe-gantt-view--chart-task-wrapper', {
            'link--current': isCurrent,
            'link--create': linkCreatable
          }]
        }, $xeTable ? renderTaskRows($xeTable, tableData) : []),
        $xeGantt.renderGanttTaskChartAfters
          ? h('div', {
            ref: refChartAfterWrapperElem,
            class: 'vxe-gantt-view--chart-after-wrapper'
          }, $xeTable && isEnableConf(taskLinkOpts) ? $xeGantt.renderGanttTaskChartAfters() : [])
          : renderEmptyElement($xeGantt)
      ])
    }

    onMounted(() => {
      const { elemStore } = ganttViewInternalData
      const prefix = 'main-chart-'
      elemStore[`${prefix}task-wrapper`] = refTaskWrapperElem
      elemStore[`${prefix}before-wrapper`] = refChartBeforeWrapperElem
      elemStore[`${prefix}after-wrapper`] = refChartAfterWrapperElem
    })

    onUnmounted(() => {
      const { elemStore } = ganttViewInternalData
      const prefix = 'main-chart-'
      elemStore[`${prefix}task-wrapper`] = null
      elemStore[`${prefix}before-wrapper`] = null
      elemStore[`${prefix}after-wrapper`] = null
    })

    return renderVN
  }
})
