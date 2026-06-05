# vxe-gantt

简体中文 | [繁體中文](README.zh-TW.md) | [English](README.en.md) | [日本語](README.ja-JP.md) 

[![github star](https://img.shields.io/github/stars/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/stargazers)
[![gitee star](https://gitee.com/x-extends/vxe-gantt/badge/star.svg)](https://gitee.com/x-extends/vxe-gantt/stargazers)
[![gitcode star](https://gitcode.com/x-extends/vxe-gantt/star/badge.svg)](https://gitcode.com/x-extends/vxe-gantt/stargazers)
[![npm version](https://img.shields.io/npm/v/vxe-gantt.svg?style=flat-square)](https://www.npmjs.com/package/vxe-gantt)
[![NodeJS with Webpack](https://github.com/x-extends/vxe-gantt/actions/workflows/webpack.yml/badge.svg)](https://github.com/x-extends/vxe-gantt/actions/workflows/webpack.yml)
[![gzip size: JS](http://img.badgesize.io/https://unpkg.com/vxe-gantt/lib/index.umd.min.js?compression=gzip&label=gzip%20size:%20JS)](https://unpkg.com/vxe-gantt/lib/index.umd.min.js)
[![npm downloads](https://img.shields.io/npm/dt/vxe-gantt.svg?style=flat-square)](https://npm-stat.com/charts.html?package=vxe-gantt)
[![issues](https://img.shields.io/github/issues/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/issues)
[![issues closed](https://img.shields.io/github/issues-closed/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/issues?q=is%3Aissue+is%3Aclosed)
[![pull requests](https://img.shields.io/github/issues-pr/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/pulls)
[![pull requests closed](https://img.shields.io/github/issues-pr-closed/x-extends/vxe-gantt.svg)](https://github.com/x-extends/vxe-gantt/pulls?q=is%3Apr+is%3Aclosed)
[![npm license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)

一个基于 [Vxe UI](https://github.com/x-extends/vxe-pc-ui) 的企业级甘特图组件  

* 设计理念
  * 面向现代浏览器，高效的简洁 API 设计

* 版本说明
  * **V4**
    * [x] v4.2 基于 适配 vxe-table 4.18+，大幅提升渲染性能
    * [x] v4.0 基于 vue3.2+，适配 vxe-table 4.16+，只支持现代浏览器，不支持 IE
  * **V3**
    * [x] v3.2 适配 vxe-table 3.20+，大幅提升渲染性能
    * [x] v3.0 基于 vue2.6~2.7，适配 vxe-table 3.18+，只支持现代浏览器，不支持 IE
  * **V2**
    * [x] ~~v2.0 基于 vue2.6+，停止维护~~
  * **V1**
    * [x] ~~v1.0 基于 vue2.6+，停止维护~~

## 浏览器支持

![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png)
--- | --- | --- | --- | --- |
80+ ✔ | 80+ ✔ | 90+ ✔ | 75+ ✔ | 10+ ✔ |

## 在线文档

👉 [基础库](https://vxeui.com)  
👉 [表格库](https://vxetable.cn)  
👉 [甘特图](https://gantt.vxeui.com)  
👉 [可视化](https://design.vxeui.com)  

## QQ 交流群

该群供大家交流問題，如果群人数已满，将会不定期剔除不活跃的。  

![qq](https://vxeui.com/resource/donation/qq1.png)
![qq](https://vxeui.com/resource/donation/qq2.png)

## 功能点

[👀 Vxe Gantt](https://gantt.vxeui.com/)  

* [x] 左侧渲染表格
* [x] 右侧渲染视图
* [x] 任务视图
  * [x] 年视图
  * [x] 季度视图
  * [x] 月视图
  * [x] 周视图
  * [x] 星期视图
  * [x] 日视图
  * [x] 小数视图
  * [x] 分钟视图
  * [x] 秒视图
* [x] 单元格样式
* [x] 子任务
* [x] 多级表头
* [x] 列拖拽排序
* [x] 任务拖拽排序
* [x] 固定列
* [x] 排序
* [x] 日期轴
* [x] 里程碑
* [x] 自定义插槽 - 模板
* [x] 行内渲染子任务
* [x] 增删改查
* [x] 右键菜单
* [x] 数据校验
* [x] 键盘导航
* [x] 虚拟滚动
* [x] CSS 变量主题
* [x] ([企业版](https://store.vxeui.com)) 依赖线连接线
* [x] ([企业版](https://store.vxeui.com)) 任务条可拖拽
* [x] ([企业版](https://store.vxeui.com)) 可视化创建依赖线

## 安装

版本：[vue](https://www.npmjs.com/package/vue) 3.x

```shell
npm install vxe-pc-ui vxe-table vxe-gantt
```

Get on [unpkg](https://unpkg.com/vxe-gantt/) and [cdnjs](https://cdn.jsdelivr.net/npm/vxe-gantt/)

### NPM

```javascript
// ...
import VxeUIBase from 'vxe-pc-ui'
import 'vxe-pc-ui/lib/style.css'

import VxeUITable from 'vxe-table'
import 'vxe-table/lib/style.css'

import VxeUIGantt from 'vxe-gantt'
import 'vxe-gantt/lib/style.css'
// ...

createApp(App).use(VxeUIBase).use(VxeUITable).use(VxeUIGantt).mount('#app')
```

## 示例

```html
<template>
  <div>
    <vxe-gantt v-bind="ganttOptions"></vxe-gantt>
  </div>
</template>

<script>
export default {
  data() {
    const ganttOptions = {
      border: true,
      taskBarConfig: {
        showProgress: true
      },
      columns: [
        { field: 'title', title: '任务名称' },
        { field: 'start', title: '开始时间', width: 100 },
        { field: 'end', title: '结束时间', width: 100 }
      ],
      data: [
        { id: 10001, title: 'A项目', start: '2024-03-01', end: '2024-03-04', progress: 3 },
        { id: 10002, title: '城市道路修理进度', start: '2024-03-03', end: '2024-03-08', progress: 10 },
        { id: 10003, title: 'B大工程', start: '2024-03-03', end: '2024-03-11', progress: 90 },
        { id: 10004, title: '超级大工程', start: '2024-03-05', end: '2024-03-11', progress: 15 },
        { id: 10005, title: '地球净化项目', start: '2024-03-08', end: '2024-03-15', progress: 100 },
        { id: 10006, title: '一个小目标项目', start: '2024-03-10', end: '2024-03-21', progress: 5 },
        { id: 10007, title: '某某计划', start: '2024-03-15', end: '2024-03-24', progress: 70 },
        { id: 10008, title: '某某科技项目', start: '2024-03-20', end: '2024-03-29', progress: 50 },
        { id: 10009, title: '地铁建设工程', start: '2024-03-19', end: '2024-03-20', progress: 5 },
        { id: 10010, title: '铁路修建计划', start: '2024-03-12', end: '2024-03-20', progress: 10 }
      ]
    }
    return {
      ganttOptions
    }
  }
}
</script>
```

## License

[MIT](LICENSE) © 2025-present, Xu Liangzhan
