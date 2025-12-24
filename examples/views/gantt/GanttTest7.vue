<template>
  <div>
    <vxe-radio-group v-model="viewMode" @change="changeViewEvent">
      <vxe-radio-button checked-value="1" content="年视图"></vxe-radio-button>
      <vxe-radio-button checked-value="2" content="季度视图"></vxe-radio-button>
      <vxe-radio-button checked-value="3" content="月视图"></vxe-radio-button>
      <vxe-radio-button checked-value="4" content="周视图"></vxe-radio-button>
      <vxe-radio-button checked-value="5" content="日视图"></vxe-radio-button>
    </vxe-radio-group>

    <vxe-gantt v-bind="ganttOptions"></vxe-gantt>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { VxeGanttProps, VxeGanttPropTypes } from '../../../types'

interface RowVO {
  id: number
  name: string
  start: string
  end: string
  progress: number
}

const viewMode = ref('1')

const taskViewConfig = reactive<VxeGanttPropTypes.TaskViewConfig>({
  scales: ['year']
})

const ganttOptions = reactive<VxeGanttProps<RowVO>>({
  border: true,
  taskBarConfig: {
    showProgress: true,
    barStyle: {
      round: true,
      bgColor: '#fca60b',
      completedBgColor: '#65c16f'
    }
  },
  taskViewConfig,
  columns: [
    { field: 'name', title: '任务名称' },
    { field: 'start', title: '开始时间', width: 100 },
    { field: 'end', title: '结束时间', width: 100 }
  ],
  data: [
    { id: 10001, name: 'A项目', start: '2023-08-01', end: '2024-11-15', progress: 3 },
    { id: 10002, name: '城市道路修理进度', start: '2024-01-03', end: '2024-03-08', progress: 10 },
    { id: 10003, name: 'B大工程', start: '2024-05-03', end: '2024-07-11', progress: 90 },
    { id: 10004, name: '超级大工程', start: '2024-04-05', end: '2024-06-11', progress: 15 },
    { id: 10005, name: '地球净化项目', start: '2024-07-08', end: '2024-08-15', progress: 100 },
    { id: 10006, name: '一个小目标项目', start: '2024-08-10', end: '2024-11-21', progress: 5 },
    { id: 10007, name: '某某计划', start: '2024-03-15', end: '2024-08-24', progress: 70 },
    { id: 10008, name: '某某科技项目', start: '2024-03-20', end: '2024-03-29', progress: 50 },
    { id: 10009, name: '地铁建设工程', start: '2025-01-19', end: '2025-03-18', progress: 5 },
    { id: 10010, name: '铁路修建计划', start: '2024-12-12', end: '2025-02-10', progress: 10 }
  ]
})

const changeViewEvent = () => {
  switch (viewMode.value) {
    case '1':
      taskViewConfig.scales = ['year']
      break
    case '2':
      taskViewConfig.scales = ['year', 'quarter']
      break
    case '3':
      taskViewConfig.scales = ['year', 'month']
      break
    case '4':
      taskViewConfig.scales = ['year', 'week']
      break
    case '5':
      taskViewConfig.scales = ['month', 'day', 'date']
      break
  }
}
</script>
