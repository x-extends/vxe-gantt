import type { VxeGanttDefines } from '../../../types'
import type { VxeTableDefines, VxeTablePropTypes } from 'vxe-table'

export function getRefElem (refEl: any) {
  if (refEl) {
    return (refEl.$el || refEl) as HTMLElement
  }
  return null
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
