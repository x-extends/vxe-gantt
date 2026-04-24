<template>
  <div>
    <vxe-switch v-model="taskViewConfig.showNowLine"></vxe-switch>

    <vxe-gantt v-bind="ganttOptions"></vxe-gantt>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import { VxeGanttProps, VxeGanttPropTypes } from '../../../types'
import XEUtils from 'xe-utils'

interface RowVO {
  id: number
  title: string
  start: Date
  end: Date
  progress: number
}

const taskViewConfig = reactive<VxeGanttPropTypes.TaskViewConfig>({
  showNowLine: true,
  tableStyle: {
    width: 480
  }
})

const ganttOptions = reactive<VxeGanttProps<RowVO>>({
  border: true,
  taskBarConfig: {
    showProgress: true,
    showContent: true
  },
  taskViewConfig,
  columns: [
    { type: 'seq', width: 70 },
    { field: 'title', title: '任务名称' },
    { field: 'start', title: '开始时间', width: 100 },
    { field: 'end', title: '结束时间', width: 100 }
  ],
  data: [
    { id: 10001, title: 'A项目', start: XEUtils.getWhatDay(new Date(), -6), end: XEUtils.getWhatDay(new Date(), -2), progress: 40 },
    { id: 10002, title: '城市道路修理进度', start: XEUtils.getWhatDay(new Date(), -3), end: XEUtils.getWhatDay(new Date(), 3), progress: 60 },
    { id: 10003, title: 'B大工程', start: XEUtils.getWhatDay(new Date(), 1), end: XEUtils.getWhatDay(new Date(), 9), progress: 90 },
    { id: 10003, title: 'B大工程', start: XEUtils.getWhatDay(new Date(), -15), end: XEUtils.getWhatDay(new Date(), -10), progress: 90 }
  ]
})
</script>
