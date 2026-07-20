<template>
  <div>
    <vxe-gantt v-bind="ganttOptions"></vxe-gantt>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import type { VxeGanttProps } from '../../../types'

interface RowVO {
  id: number
  title: string
  start: string
  end: string
  progress: number
}

const ganttOptions = reactive<VxeGanttProps<RowVO>>({
  border: true,
  showOverflow: true,
  taskConfig: {
    dateFormat: 'yyyy-MM-dd HH:mm:ss'
  },
  taskBarConfig: {
    showProgress: true, // 是否显示进度条
    showContent: true, // 是否在任务条显示内容
    moveable: true, // 是否允许拖拽任务移动日期
    barStyle: {
      round: true, // 圆角
      bgColor: '#fca60b', // 任务条的背景颜色
      completedBgColor: '#65c16f' // 已完成部分任务条的背景颜色
    }
  },
  taskViewConfig: {
    scales: ['date'],
    tableStyle: {
      width: 480 // 表格宽度
    },
    viewStyle: {
      cellWidth: 120 // 单元格宽度
    }
  },
  columns: [
    { type: 'seq', field: 'seq', width: 70 },
    { field: 'title', title: '任务名称' },
    { field: 'start', title: '开始时间', width: 160 },
    { field: 'end', title: '结束时间', width: 160 }
  ],
  data: [
    { id: 10001, title: '任务1', start: '2024-03-01 08:30:00', end: '2024-03-04 12:30:00', progress: 3 },
    { id: 10002, title: '任务2', start: '2024-03-03 02:40:30', end: '2024-03-05 05:00:50', progress: 10 },
    { id: 10003, title: '任务3', start: '2024-03-03 12:00:00', end: '2024-03-04 19:00:00', progress: 90 },
    { id: 10004, title: '任务4', start: '2024-03-05 08:00:00', end: '2024-03-07 09:00:00', progress: 15 },
    { id: 10005, title: '任务5', start: '2024-03-08 16:30:00', end: '2024-03-11 20:30:00', progress: 100 },
    { id: 10006, title: '任务6', start: '2024-03-10 01:30:00', end: '2024-03-13 02:30:00', progress: 5 }
  ]
})
</script>
