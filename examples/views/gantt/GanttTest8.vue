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
    scales: [
      { type: 'month' },
      { type: 'hour', step: 3 }
    ],
    tableStyle: {
      width: 320
    }
  },
  columns: [
    { type: 'seq', field: 'seq', width: 70 },
    { field: 'title', title: '任务名称' },
    { field: 'start', title: '开始时间', width: 160 },
    { field: 'end', title: '结束时间', width: 160 }
  ],
  data: [
    { id: 10001, title: 'A项目', start: '2024-03-01 08:00:00', end: '2024-03-04 12:30:00', progress: 3 },
    { id: 10002, title: '城市道路修理进度', start: '2024-03-03 09:30:00', end: '2024-03-08 14:00:00', progress: 10 },
    { id: 10003, title: 'B大工程', start: '2024-03-03 06:30:20', end: '2024-03-11 09:30:40', progress: 90 },
    { id: 10004, title: '超级大工程', start: '2024-03-05 12:30:00', end: '2024-03-11 18:30:00', progress: 15 }
  ]
})
</script>
