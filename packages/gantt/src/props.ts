import { PropType } from 'vue'
import { gridProps } from './grid-props'

import type { VxeGanttPropTypes } from '../../../types'

export const ganttProps = {
  ...gridProps,

  layouts: Array as PropType<VxeGanttPropTypes.Layouts>,
  taskConfig: Object as PropType<VxeGanttPropTypes.TaskConfig>,
  taskViewConfig: Object as PropType<VxeGanttPropTypes.TaskViewConfig>,
  taskBarConfig: Object as PropType<VxeGanttPropTypes.TaskBarConfig>,
  taskSplitConfig: Object as PropType<VxeGanttPropTypes.TaskSplitConfig>
}
