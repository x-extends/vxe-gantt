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

export function getCellHeight (height: number | 'unset' | undefined | null) {
  if (height === 'unset') {
    return 0
  }
  return height || 0
}

export function getCellRestHeight (rowRest: VxeTableDefines.RowCacheItem, cellOpts: VxeTablePropTypes.CellConfig, rowOpts: VxeTablePropTypes.RowConfig, defaultRowHeight: number) {
  return rowRest.resizeHeight || cellOpts.height || rowOpts.height || rowRest.height || defaultRowHeight
}
