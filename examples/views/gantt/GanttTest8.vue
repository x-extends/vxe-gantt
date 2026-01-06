<template>
  <div>
    <div style="margin-bottom: 8px;">
      <vxe-radio-group v-model="viewMode" @change="changeViewEvent">
        <vxe-radio-button checked-value="1" content="年视图"></vxe-radio-button>
        <vxe-radio-button checked-value="2" content="季度视图"></vxe-radio-button>
        <vxe-radio-button checked-value="3" content="月视图"></vxe-radio-button>
        <vxe-radio-button checked-value="4" content="周视图"></vxe-radio-button>
        <vxe-radio-button checked-value="5" content="日视图"></vxe-radio-button>
      </vxe-radio-group>
    </div>

    <vxe-gantt v-bind="ganttOptions"></vxe-gantt>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { VxeGanttProps, VxeGanttPropTypes } from '../../../types'

interface RowVO {
  id: number
  title: string
  start: string
  end: string
  progress: number
}

const viewMode = ref('1')

const taskViewConfig = reactive<VxeGanttPropTypes.TaskViewConfig>({
  scales: ['year'], // 设置日期轴
  viewStyle: {
    // 自定义任务视图单元格样式
    cellStyle ({ scaleType, row, dateObj }) {
      if (row.progress >= 80) {
        return {
          backgroundColor: '#d9f5e3'
        }
      }
      if (scaleType === 'date') {
        // 周日高亮
        if (dateObj.e === 0) {
          return {
            backgroundColor: '#daf9f5'
          }
        }
      }
    }
  }
})

const ganttOptions = reactive<VxeGanttProps<RowVO>>({
  border: true,
  height: 800,
  // 自定义左侧表格行样式
  rowStyle ({ row }) {
    if (row.progress >= 80) {
      return {
        backgroundColor: '#d9f5e3'
      }
    }
  },
  taskBarConfig: {
    showProgress: true, // 是否显示进度
    showTooltip: true, // 是否显示任务提示,鼠标移动到任务上面显示
    moveable: true, // 是否允许拖拽任务移动日期
    barStyle: {
      round: true,
      bgColor: '#fca60b',
      completedBgColor: '#65c16f'
    }
  },
  taskViewConfig,
  taskBarTooltipConfig: {
    // 自定义任务提示内容,也可以使用插槽模板
    contentMethod ({ row }) {
      return `${row.title}\n开始时间：${row.start}\n结束：${row.end}\n进度：${row.progress}`
    }
  },
  columns: [
    { field: 'title', title: '任务名称' },
    { field: 'start', title: '开始时间', width: 100 },
    { field: 'end', title: '结束时间', width: 100 }
  ],
  data: [
    { id: 10001, title: '任务1', start: '2024-08-10', end: '2024-11-21', progress: 36 },
    { id: 10002, title: '任务2', start: '2024-01-03', end: '2024-03-08', progress: 49 },
    { id: 10003, title: '任务3', start: '2024-05-03', end: '2024-07-11', progress: 80 },
    { id: 10004, title: '任务4', start: '2024-04-05', end: '2024-06-11', progress: 68 },
    { id: 10005, title: '任务5', start: '2024-07-08', end: '2024-08-15', progress: 100 },
    { id: 10006, title: '任务6', start: '2023-08-01', end: '2023-11-15', progress: 48 },
    { id: 10007, title: '任务7', start: '2024-03-15', end: '2024-08-24', progress: 70 },
    { id: 10008, title: '任务8', start: '2024-03-20', end: '2024-04-05', progress: 50 },
    { id: 10009, title: '任务9', start: '2025-01-19', end: '2025-03-18', progress: 20 },
    { id: 10010, title: '任务10', start: '2024-12-12', end: '2025-02-10', progress: 72 },
    { id: 10011, title: '任务11', start: '2025-01-10', end: '2025-02-25', progress: 50 },
    { id: 10012, title: '任务12', start: '2025-10-05', end: '2025-12-20', progress: 20 },
    { id: 10013, title: '任务13', start: '2023-01-05', end: '2023-02-01', progress: 20 },
    { id: 10014, title: '任务14', start: '2023-02-12', end: '2023-02-27', progress: 20 }
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
      taskViewConfig.scales = ['month', 'week']
      break
    case '5':
      taskViewConfig.scales = ['month', 'day', 'date']
      break
  }
}
</script>
