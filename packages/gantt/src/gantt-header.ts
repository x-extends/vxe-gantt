import { CreateElement } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'

import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

export default defineVxeComponent({
  name: 'VxeGanttViewHeader',
  inject: {
    $xeGantt: {
      default: null
    },
    $xeGanttView: {
      default: null
    }
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
      const $xeGanttView = _vm.$xeGanttView
      const { reactData } = $xeGanttView

      const { tableColumn, headerGroups, viewCellWidth } = reactData
      return h('div', {
        ref: 'refElem',
        class: 'vxe-gantt-view--header-wrapper'
      }, [
        h('div', {
          ref: 'refHeaderScroll',
          class: 'vxe-gantt-view--header-inner-wrapper',
          on: {
            scroll: $xeGanttView.triggerHeaderScrollEvent
          }
        }, [
          h('div', {
            ref: 'refHeaderXSpace',
            class: 'vxe-body--x-space'
          }),
          h('table', {
            ref: 'refHeaderTable',
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
            h('thead', {}, headerGroups.map((cols, rIndex) => {
              return h('tr', {
                key: rIndex
              }, cols.map((column, cIndex) => {
                return h('th', {
                  key: cIndex,
                  class: 'vxe-gantt-view--header-column',
                  attrs: {
                    colspan: column.children ? column.children.length : null,
                    title: `${column.field}`
                  }
                }, column.title)
              }))
            }))
          ])
        ])
      ])
    }
  },
  mounted () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const { internalData } = $xeGanttView

    const { elemStore } = internalData
    const prefix = 'main-header-'
    elemStore[`${prefix}wrapper`] = _vm.$refs.refElem as HTMLDivElement
    elemStore[`${prefix}scroll`] = _vm.$refs.refHeaderScroll as HTMLDivElement
    elemStore[`${prefix}table`] = _vm.$refs.refHeaderTable as HTMLDivElement
    elemStore[`${prefix}xSpace`] = _vm.$refs.refHeaderXSpace as HTMLDivElement
  },
  destroyed () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const { internalData } = $xeGanttView

    const { elemStore } = internalData
    const prefix = 'main-header-'
    elemStore[`${prefix}wrapper`] = null
    elemStore[`${prefix}scroll`] = null
    elemStore[`${prefix}table`] = null
    elemStore[`${prefix}xSpace`] = null
  },
  render (this: any, h) {
    return this.renderVN(h)
  }
})
