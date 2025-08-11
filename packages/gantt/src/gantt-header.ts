import { h, inject, computed, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'

import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods } from '../../../types'

export default defineVxeComponent({
  name: 'VxeGanttView',
  setup () {
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { reactData, internalData } = $xeGanttView

    const refElem = ref() as Ref<HTMLDivElement>
    const refHeaderScroll = ref() as Ref<HTMLDivElement>
    const refHeaderTable = ref() as Ref<HTMLTableElement>
    const refHeaderXSpace = ref() as Ref<HTMLDivElement>

    const computeHeaderHeight = computed(() => {
      const $xeTable = internalData.xeTable
      const { tableData } = reactData
      if (tableData.length && $xeTable) {
        const tableReactData = $xeTable.reactData
        const { tHeaderHeight } = tableReactData
        return tHeaderHeight
      }
      return ''
    })

    const renderVN = () => {
      const { tableColumn, headerGroups } = reactData
      const headerHeight = computeHeaderHeight.value
      return h('div', {
        ref: refElem,
        class: 'vxe-gantt-view--header-wrapper'
      }, [
        h('div', {
          ref: refHeaderScroll,
          class: 'vxe-gantt-view--header-inner-wrapper',
          style: {
            height: `${headerHeight}px`
          },
          onScroll: $xeGanttView.triggerHeaderScrollEvent
        }, [
          h('div', {
            ref: refHeaderXSpace,
            class: 'vxe-body--x-space'
          }),
          h('table', {
            ref: refHeaderTable,
            class: 'vxe-gantt-view--header-table',
            style: {
              width: `calc(var(--vxe-ui-gantt-view-column-width) * ${tableColumn.length})`
            }
          }, [
            h('colgroup', {}, tableColumn.map((column, cIndex) => {
              return h('col', {
                key: cIndex
              })
            })),
            h('thead', {}, headerGroups.map((cols, rIndex) => {
              return h('tr', {
                key: rIndex
              }, cols.map((column, cIndex) => {
                return h('th', {
                  key: cIndex,
                  class: 'vxe-gantt-view--header-column',
                  colspan: column.children ? column.children.length : null,
                  title: `${column.field}`
                }, column.title)
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
