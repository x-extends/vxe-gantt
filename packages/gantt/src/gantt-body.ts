import { h, inject, VNode, computed, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'

import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods } from '../../../types'

export default defineVxeComponent({
  name: 'VxeGanttViewBody',
  setup () {
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { reactData, internalData } = $xeGanttView

    const refElem = ref() as Ref<HTMLDivElement>
    const refBodyScroll = ref() as Ref<HTMLDivElement>
    const refBodyTable = ref() as Ref<HTMLTableElement>
    const refBodyXSpace = ref() as Ref<HTMLDivElement>
    const refBodyYSpace = ref() as Ref<HTMLDivElement>

    const computeBodyHeight = computed(() => {
      const $xeTable = internalData.xeTable
      const { tableData } = reactData
      if (tableData.length && $xeTable) {
        const tableReactData = $xeTable.reactData
        const { tBodyHeight } = tableReactData
        return tBodyHeight
      }
      return ''
    })

    const renderRows = () => {
      const { tableData, tableColumn } = reactData

      const trVNs:VNode[] = []
      tableData.forEach((row, rIndex) => {
        trVNs.push(
          h('tr', {
            key: rIndex
          }, tableColumn.map((column, cIndex) => {
            return h('th', {
              key: cIndex,
              class: 'vxe-gantt-view--body-column'
            })
          }))
        )
      })
      return trVNs
    }

    const renderVN = () => {
      const { tableColumn } = reactData
      const bodyHeight = computeBodyHeight.value
      return h('div', {
        ref: refElem,
        class: 'vxe-gantt-view--body-wrapper'
      }, [
        h('div', {
          ref: refBodyScroll,
          class: 'vxe-gantt-view--body-inner-wrapper',
          style: {
            height: `${bodyHeight}px`
          },
          onScroll: $xeGanttView.triggerBodyScrollEvent
        }, [
          h('div', {
            ref: refBodyXSpace,
            class: 'vxe-body--x-space'
          }),
          h('div', {
            ref: refBodyYSpace,
            class: 'vxe-body--y-space'
          }),
          h('table', {
            ref: refBodyTable,
            class: 'vxe-gantt-view--body-table',
            style: {
              width: `calc(var(--vxe-ui-gantt-view-column-width) * ${tableColumn.length})`
            }
          }, [
            h('colgroup', {}, tableColumn.map((column, cIndex) => {
              return h('col', {
                key: cIndex
              })
            })),
            h('tbody', {}, renderRows())
          ])
        ])
      ])
    }

    onMounted(() => {
      const { elemStore } = internalData
      const prefix = 'main-body-'
      elemStore[`${prefix}wrapper`] = refElem
      elemStore[`${prefix}scroll`] = refBodyScroll
      elemStore[`${prefix}table`] = refBodyTable
      elemStore[`${prefix}xSpace`] = refBodyXSpace
      elemStore[`${prefix}ySpace`] = refBodyYSpace
    })

    onUnmounted(() => {
      const { elemStore } = internalData
      const prefix = 'main-body-'
      elemStore[`${prefix}wrapper`] = null
      elemStore[`${prefix}scroll`] = null
      elemStore[`${prefix}table`] = null
      elemStore[`${prefix}xSpace`] = null
      elemStore[`${prefix}ySpace`] = null
    })

    return renderVN
  }
})
