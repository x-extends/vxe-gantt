import { gridEmits } from './grid-emits'

import type { VxeGanttEmits } from '../../../types'

export const ganttEmits: VxeGanttEmits = [
  ...gridEmits,

  'task-cell-click',
  'task-cell-dblclick',
  'task-bar-mouseenter',
  'task-bar-mouseleave',
  'task-bar-click',
  'task-bar-dblclick',
  'task-view-cell-click',
  'task-view-cell-dblclick',
  'task-move-start',
  'task-move-drag',
  'task-move-end',
  'task-resize-start',
  'task-resize-drag',
  'task-resize-end'
]
