import { h, inject, ref, Ref, onMounted, onUnmounted } from 'vue'
import { defineVxeComponent } from '../../ui/src/comp'

import type { VxeGanttConstructor, VxeGanttPrivateMethods, VxeGanttViewConstructor, VxeGanttViewPrivateMethods } from '../../../types'

const sourceType = 'gantt'
const viewType = 'footer'

export default defineVxeComponent({
  name: 'VxeGanttViewFooter',
  setup () {
    const $xeGantt = inject('$xeGantt', {} as (VxeGanttConstructor & VxeGanttPrivateMethods))
    const $xeGanttView = inject('$xeGanttView', {} as VxeGanttViewConstructor & VxeGanttViewPrivateMethods)

    const { internalData } = $xeGanttView

    const refElem = ref() as Ref<HTMLDivElement>
    const refHeaderScroll = ref() as Ref<HTMLDivElement>

    const renderVN = () => {
      return h('div', {
        ref: refElem,
        class: 'vxe-gantt-view--footer-wrapper',
        onContextmenu (evnt) {
          $xeGantt.handleTaskFooterContextmenuEvent(evnt, { source: sourceType, type: viewType, $rowIndex: -1 })
        }
      }, [
        h('div', {
          ref: refHeaderScroll,
          class: 'vxe-gantt-view--footer-inner-wrapper'
        })
      ])
    }

    onMounted(() => {
      const { elemStore } = internalData
      const prefix = 'main-footer-'
      elemStore[`${prefix}wrapper`] = refElem
      elemStore[`${prefix}scroll`] = refHeaderScroll
    })

    onUnmounted(() => {
      const { elemStore } = internalData
      const prefix = 'main-footer-'
      elemStore[`${prefix}wrapper`] = null
      elemStore[`${prefix}scroll`] = null
    })

    return renderVN
  }
})
