import { tableEmits } from './table-emits'

import type { VxeGridEmits } from 'vxe-table'

export const gridEmits: VxeGridEmits = [
  ...tableEmits,
  'page-change',
  'form-submit',
  'form-submit-invalid',
  'form-reset',
  'form-collapse',
  'form-toggle-collapse',
  'proxy-query',
  'proxy-delete',
  'proxy-save',
  'toolbar-button-click',
  'toolbar-tool-click',
  'zoom'
]
