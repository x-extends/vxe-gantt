import { h, inject, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'
import { VxeUI } from '@vxe-ui/core'

import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttDefines } from '../../../types'

const { getI18n } = VxeUI

export default defineVxeComponent({
  name: 'VxeGanttViewHeader',
  setup () {
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { reactData, internalData } = $xeGanttView

    const refElem = ref() as Ref<HTMLDivElement>
    const refHeaderScroll = ref() as Ref<HTMLDivElement>
    const refHeaderTable = ref() as Ref<HTMLTableElement>
    const refHeaderXSpace = ref() as Ref<HTMLDivElement>

    const renderVN = () => {
      const { tableColumn, headerGroups, viewCellWidth } = reactData
      return h('div', {
        ref: refElem,
        class: 'vxe-gantt-view--header-wrapper'
      }, [
        h('div', {
          ref: refHeaderScroll,
          class: 'vxe-gantt-view--header-inner-wrapper',
          onScroll: $xeGanttView.triggerHeaderScrollEvent
        }, [
          h('div', {
            ref: refHeaderXSpace,
            class: 'vxe-body--x-space'
          }),
          h('table', {
            ref: refHeaderTable,
            class: 'vxe-gantt-view--header-table'
          }, [
            h('colgroup', {}, tableColumn.map((column, cIndex) => {
              return h('col', {
                key: cIndex,
                style: {
                  width: `${viewCellWidth}px`
                }
              })
            })),
            h('thead', {}, headerGroups.map(({ scaleItem, columns }, $rowIndex) => {
              const { type, titleMethod } = scaleItem
              return h('tr', {
                key: $rowIndex
              }, columns.map((column, cIndex) => {
                const dateObj: VxeGanttDefines.ScaleDateObj = column.params
                let label = `${column.title}`
                if ($rowIndex < headerGroups.length - 1) {
                  if (scaleItem.type === 'day') {
                    label = getI18n(`vxe.gantt.dayss.w${dateObj.e}`)
                  } else {
                    label = getI18n(`vxe.gantt.${!$rowIndex && headerGroups.length > 1 ? 'tFullFormat' : 'tSimpleFormat'}.${type}`, dateObj)
                  }
                }
                if (titleMethod) {
                  label = `${titleMethod({ scaleObj: scaleItem, title: label, dateObj: dateObj, $rowIndex })}`
                }
                return h('th', {
                  key: cIndex,
                  class: 'vxe-gantt-view--header-column',
                  colspan: column.childCount || null,
                  title: label
                }, label)
              }))
            }))
          ])
        ])
      ])
    }

    onMounted(() => {
      const { elemStore } = internalData
      const prefix = 'main-header-'
      elemStore[`${prefix}wrapper`] = refElem
      elemStore[`${prefix}scroll`] = refHeaderScroll
      elemStore[`${prefix}table`] = refHeaderTable
      elemStore[`${prefix}xSpace`] = refHeaderXSpace
    })

    onUnmounted(() => {
      const { elemStore } = internalData
      const prefix = 'main-header-'
      elemStore[`${prefix}wrapper`] = null
      elemStore[`${prefix}scroll`] = null
      elemStore[`${prefix}table`] = null
      elemStore[`${prefix}xSpace`] = null
    })

    return renderVN
  }
})
