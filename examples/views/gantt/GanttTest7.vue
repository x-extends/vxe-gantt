<template>
  <div>
    <vxe-button status="success" @click="resultEvent">获取数据</vxe-button>
    <vxe-gantt ref="ganttRef" v-bind="ganttOptions"></vxe-gantt>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import type { VxeGanttProps, VxeGanttInstance } from '../../../types'

interface RowVO {
  id: number
  title: string
  start: string
  end: string
  progress: number
}

const ganttRef = ref<VxeGanttInstance<RowVO>>()

const ganttOptions = reactive<VxeGanttProps<RowVO>>({
  border: true,
  columnConfig: {
    drag: true
  },
  rowConfig: {
    drag: true
  },
  taskBarConfig: {
    showProgress: true,
    showContent: true,
    barStyle: {
      round: true,
      bgColor: '#fca60b',
      completedBgColor: '#65c16f'
    }
  },
  taskViewConfig: {
    scales: ['year', 'month', 'day', 'hour'],
    tableStyle: {
      width: 480
    }
  },
  columns: [
    { type: 'seq', width: 70 },
    { field: 'title', title: '任务名称', dragSort: true },
    { field: 'start', title: '开始时间', width: 160 },
    { field: 'end', title: '结束时间', width: 160 }
  ],
  data: [
    { id: 10001, title: 'A项目', start: '2024-03-01 08:00:00', end: '2024-03-01 08:30:00', progress: 3 },
    { id: 10002, title: '城市道路修理进度', start: '2024-03-01 08:20:00', end: '2024-03-01 09:50:00', progress: 10 },
    { id: 10003, title: 'B大工程', start: '2024-03-01 08:30:00', end: '2024-03-01 08:50:00', progress: 90 },
    { id: 10004, title: '超级大工程', start: '2024-03-01 07:30:00', end: '2024-03-01 09:00:00', progress: 15 },
    { id: 10005, title: '地球净化项目', start: '2024-03-01 07:20:00', end: '2024-03-01 10:00:00', progress: 100 },
    { id: 10006, title: '一个小目标项目', start: '2024-03-01 08:00:00', end: '2024-03-01 12:00:00', progress: 5 },
    { id: 10007, title: '某某计划', start: '2024-03-01 08:30:00', end: '2024-03-01 14:30:00', progress: 70 },
    { id: 10008, title: '某某科技项目', start: '2024-03-01 09:00:00', end: '2024-03-01 15:00:00', progress: 50 },
    { id: 10009, title: '地铁建设工程', start: '2024-03-01 11:00:00', end: '2024-03-01 16:30:00', progress: 5 },
    { id: 10010, title: '铁路修建计划', start: '2024-03-01 12:00:00', end: '2024-03-01 18:00:00', progress: 10 }
  ]
})

const resultEvent = () => {
  const $gantt = ganttRef.value
  if ($gantt) {
    const tableData = $gantt.getFullData()
    console.log(tableData)
  }
}
</script>
