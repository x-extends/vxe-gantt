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
  cellConfig: {
    height: 80
  },
  taskConfig: {
    dateFormat: 'yyyy-MM-dd'
  },
  taskBarConfig: {
    showProgress: true,
    showContent: true,
    barStyle: {
      round: true,
      bgColor: '#f56565',
      completedBgColor: '#65c16f'
    }
  },
  taskViewConfig: {
    scales: ['month', 'week'],
    tableStyle: {
      width: 320
    },
    viewStyle: {
      cellWidth: 120
    }
  },
  columns: [
    { type: 'seq', field: 'seq', width: 70 },
    { field: 'title', title: '任务名称' },
    { field: 'start', title: '开始时间', width: 160 },
    { field: 'end', title: '结束时间', width: 160 }
  ],
  data: [
    { id: 10001, title: 'A项目', start: '2024-02-26', end: '2024-03-03', progress: 80 },
    { id: 10002, title: '城市道路修理进度', start: '2024-03-03', end: '2024-03-08', progress: 90 },
    { id: 10003, title: 'B大工程', start: '2024-03-06', end: '2024-03-11', progress: 90 },
    { id: 10004, title: '超级大工程', start: '2024-03-11', end: '2024-03-18', progress: 100 }
  ]
})
</script>
