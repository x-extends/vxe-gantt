import { gridEmits } from './grid-emits'

import type { VxeGanttEmits } from '../../../types'

export const ganttEmits: VxeGanttEmits = [
  ...gridEmits,

  'task-cell-click',
  'task-cell-dblclick',
  'task-bar-click',
  'task-bar-dblclick'
]
