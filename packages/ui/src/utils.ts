import XEUtils from 'xe-utils'
import { VxeUI } from '@vxe-ui/core'

const { getConfig, zIndex } = VxeUI

export function isEnableConf(conf: any): boolean {
  return conf && conf.enabled !== false
}

/**
 * 用于开关类型的配置项
 * 局部启用规则：conf={}
 * 局部禁用规则：conf={enabled:false}
 * 全局默认启用规则：conf.enabled=true
 */
export function hasEnableConf(conf: any, opts: any): boolean {
  return opts && (conf ? opts.enabled !== false : opts.enabled)
}

export function isEmptyValue(cellValue: any) {
  return cellValue === null || cellValue === undefined || cellValue === ''
}

export function nextZIndex() {
  return zIndex.next()
}

export function getLastZIndex() {
  return zIndex.getLast()
}

export function getGlobalDefaultConfig(value: any, globalValue: any) {
  if (XEUtils.eqNull(value)) {
    return globalValue
  }
  return value
}

export function getFuncText(content: string | number | boolean | null | undefined, args?: any) {
  if (content) {
    const translate = getConfig().translate
    return XEUtils.toValueString(translate ? translate('' + content, args) : content)
  }
  return ''
}

export function formatText(value: any, placeholder?: any) {
  return '' + (isEmptyValue(value) ? (placeholder ? VxeUI.getConfig().emptyCell : '') : value)
}

/**
 * 判断值为：'' | null | undefined 时都属于空值
 */
export function eqEmptyValue(cellValue: any) {
  return cellValue === null || cellValue === undefined || cellValue === ''
}

export function getStringValue(cellValue: any) {
  return eqEmptyValue(cellValue) ? '' : cellValue
}

export function getClass(property: any, params: any) {
  return property ? (XEUtils.isFunction(property) ? property(params) : property) : ''
}

export function getDefaultConfig<T = any, D = any>(val1: T, def1: D): T | D {
  return XEUtils.eqNull(val1) ? def1 : val1
}
