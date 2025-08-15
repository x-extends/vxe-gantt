import XEUtils from 'xe-utils'
import { VxeComponentSlotType } from '@vxe-ui/core'

export function getSlotVNs (vns: VxeComponentSlotType | VxeComponentSlotType[] | undefined) {
  if (XEUtils.isArray(vns)) {
    return vns
  }
  return vns ? [vns] : []
}
