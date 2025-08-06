# vxe-gantt

简体中文 | [繁體中文](README.zh-TW.md) | [English](README.en.md) | [日本語](README.ja-JP.md) 

[![star](https://gitee.com/x-extends/vxe-gantt/badge/star.svg?theme=gvp)](https://gitee.com/x-extends/vxe-gantt/stargazers)
[![npm version](https://img.shields.io/npm/v/vxe-gantt.svg?style=flat-square)](https://www.npmjs.com/package/vxe-gantt)
[![NodeJS with Webpack](https://github.com/x-extends/vxe-gantt/actions/workflows/webpack.yml/badge.svg)](https://github.com/x-extends/vxe-gantt/actions/workflows/webpack.yml)
[![npm downloads](https://img.shields.io/npm/dt/vxe-gantt.svg?style=flat-square)](https://npm-stat.com/charts.html?package=vxe-gantt)
[![issues](https://img.shields.io/github/issues/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/issues)
[![issues closed](https://img.shields.io/github/issues-closed/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/issues?q=is%3Aissue+is%3Aclosed)
[![pull requests](https://img.shields.io/github/issues-pr/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/pulls)
[![pull requests closed](https://img.shields.io/github/issues-pr-closed/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/pulls?q=is%3Apr+is%3Aclosed)
[![npm license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)

一个基于 [Vxe UI](https://github.com/x-extends/vxe-pc-ui) 的基于 PC 端甘特图组件  

* 设计理念
  * 面向现代浏览器，高效的简洁 API 设计

* 版本说明
  * **V4**
    * [x] v4.0 基于 vue3.2+，只支持现代浏览器，不支持 IE
  * **V3**
    * [x] v3.0 基于 vue2.6+，只支持现代浏览器，不支持 IE
  * **V2**
    * [x] ~~v2.0 基于 vue2.6+，停止维护~~
  * **V1**
    * [x] ~~v1.0 基于 vue2.6+，停止维护~~

## 安装

版本：[vue](https://www.npmjs.com/package/vue) 3.x

```shell
npm install vxe-gantt
```

Get on [unpkg](https://unpkg.com/vxe-gantt/) and [cdnjs](https://cdn.jsdelivr.net/npm/vxe-gantt/)

### NPM

```javascript
// ...
import VxeUIAll from 'vxe-pc-ui'
import 'vxe-pc-ui/lib/style.css'

import VxeUITable from 'vxe-table'
import 'vxe-table/lib/style.css'

import VxeUIGantt from 'vxe-gantt'
import 'vxe-gantt/lib/style.css'
// ...

createApp(App).use(VxeUIAll).use(VxeUITable).use(VxeUIGantt).mount('#app')
```

## License

[MIT](LICENSE) © 2025-present, Xu Liangzhan
