# vxe-gantt

[简体中文](README.md) | 繁體中文 | [English](README.en.md) | [日本語](README.ja-JP.md)  

[![gitee star](https://gitee.com/x-extends/vxe-gantt/badge/star.svg)](https://gitee.com/x-extends/vxe-gantt/stargazers)
[![gitcode star](https://gitcode.com/x-extends/vxe-gantt/star/badge.svg)](https://gitcode.com/x-extends/vxe-gantt/stargazers)
[![npm version](https://img.shields.io/npm/v/vxe-gantt.svg?style=flat-square)](https://www.npmjs.com/package/vxe-gantt)
[![NodeJS with Webpack](https://github.com/x-extends/vxe-gantt/actions/workflows/webpack.yml/badge.svg)](https://github.com/x-extends/vxe-gantt/actions/workflows/webpack.yml)
[![npm downloads](https://img.shields.io/npm/dt/vxe-gantt.svg?style=flat-square)](https://npm-stat.com/charts.html?package=vxe-gantt)
[![issues](https://img.shields.io/github/issues/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/issues)
[![issues closed](https://img.shields.io/github/issues-closed/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/issues?q=is%3Aissue+is%3Aclosed)
[![pull requests](https://img.shields.io/github/issues-pr/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/pulls)
[![pull requests closed](https://img.shields.io/github/issues-pr-closed/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/pulls?q=is%3Apr+is%3Aclosed)
[![npm license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)

一个基于 [Vxe UI](https://github.com/x-extends/vxe-pc-ui) 的基于 PC 端甘特图组件  

## 浏览器支持

![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png)
--- | --- | --- | --- | --- |
80+ ✔ | 80+ ✔ | 90+ ✔ | 75+ ✔ | 10+ ✔ |


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

## 運行項目

安裝依賴

```shell
npm install
```

啓動本地調試

```shell
npm run serve
```

編譯打包，生成編譯後的目錄：es,lib

```shell
npm run lib
```

## 許可證

[MIT](LICENSE) © 2025-present, Xu Liangzhan
