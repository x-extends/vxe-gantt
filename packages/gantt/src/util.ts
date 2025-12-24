import type { VxeGanttDefines } from '../../../types'
import type { VxeTableDefines, VxeTablePropTypes } from 'vxe-table'

export function getRefElem (refEl: any) {
  if (refEl) {
    const rest = refEl.value
    if (rest) {
      return (rest.$el || rest) as HTMLElement
    }
  }
  return null
}

export function getCalcHeight (height: number | 'unset' | undefined | null) {
  if (height === 'unset') {
    return 0
  }
  return height || 0
}

export function getCellRestHeight (rowRest: VxeTableDefines.RowCacheItem, cellOpts: VxeTablePropTypes.CellConfig, rowOpts: VxeTablePropTypes.RowConfig, defaultRowHeight: number) {
  return rowRest.resizeHeight || cellOpts.height || rowOpts.height || rowRest.height || defaultRowHeight
}

export function getStandardGapTime (type: VxeGanttDefines.ColumnScaleType) {
  switch (type) {
    case 'hour':
      return 1000 * 60 * 60
    case 'minute':
      return 1000 * 60
    case 'second':
      return 1000
  }
  return 1000 * 60 * 60 * 24
}

export function getTaskBarLeft (chartRest: VxeGanttDefines.RowCacheItem | null, viewCellWidth: number) {
  return chartRest ? viewCellWidth * chartRest.oLeftSize : 0
}

export function getTaskBarWidth (chartRest: VxeGanttDefines.RowCacheItem | null, viewCellWidth: number) {
  return Math.max(1, chartRest ? (Math.floor(viewCellWidth * chartRest.oWidthSize) - 1) : 0)
}

export function getTaskLinkKey (from: string | number, to: string | number) {
  return `${from}_${to}`
}

const taskTypeMaps: Record<string, boolean> = {
  milestone: true
}
export function hasMilestoneTask (type: string) {
  return taskTypeMaps[type]
}
export function gettaskType (type: string) {
  return taskTypeMaps[type] ? type : 'default'
}
