import { PropType } from 'vue'
import { gridProps } from './grid-props'

import type { VxeGanttPropTypes } from '../../../types'

export const ganttProps = {
  ...gridProps,

  taskConfig: Object as PropType<VxeGanttPropTypes.TaskConfig>,
  taskViewConfig: Object as PropType<VxeGanttPropTypes.TaskViewConfig>,
  taskBarConfig: Object as PropType<VxeGanttPropTypes.TaskBarConfig>
}
