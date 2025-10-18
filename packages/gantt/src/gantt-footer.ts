import { CreateElement } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'

import type { VxeGanttViewConstructor, VxeGanttViewPrivateMethods, VxeGanttConstructor, VxeGanttPrivateMethods } from '../../../types'

const sourceType = 'gantt'
const viewType = 'footer'

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
  props: {},
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

      return h('div', {
        ref: 'refElem',
        class: 'vxe-gantt-view--footer-wrapper'
      }, [
        h('div', {
          ref: 'refHeaderScroll',
          class: 'vxe-gantt-view--footer-inner-wrapper',
          on: {
            contextmenu (evnt: Event) {
              $xeGantt.handleTaskFooterContextmenuEvent(evnt, { source: sourceType, type: viewType, $rowIndex: -1 })
            }
          }
        }, [])
      ])
    }
  },
  mounted () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const { internalData } = $xeGanttView

    const { elemStore } = internalData
    const prefix = 'main-footer-'
    elemStore[`${prefix}wrapper`] = _vm.$refs.refElem as HTMLDivElement
    elemStore[`${prefix}scroll`] = _vm.$refs.refHeaderScroll as HTMLDivElement
  },
  destroyed () {
    const _vm = this
    const $xeGanttView = _vm.$xeGanttView
    const { internalData } = $xeGanttView

    const { elemStore } = internalData
    const prefix = 'main-headefooterr-'
    elemStore[`${prefix}wrapper`] = null
    elemStore[`${prefix}scroll`] = null
  },
  render (this: any, h) {
    return this.renderVN(h)
  }
})
