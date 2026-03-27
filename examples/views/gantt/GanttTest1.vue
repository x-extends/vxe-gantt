<template>
  <div>
    <vxe-button @click="scrollEvent">定位</vxe-button>
    <vxe-gantt ref="ganttRef" v-bind="ganttOptions"></vxe-gantt>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { VxeGanttInstance, VxeGanttProps } from '../../../types'

interface RowVO {
  id: number
  title: string
  start: string
  end: string
  progress: number
}

const ganttRef = ref<VxeGanttInstance>()

const ganttOptions = reactive<VxeGanttProps<RowVO>>({
  border: true,
  height: 300,
  rowConfig: {
    isHover: true
  },
  radioConfig: {
    labelField: 'title',
    highlight: true
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
    tableStyle: {
      width: 480
    }
  },
  columns: [
    { type: 'radio', title: '任务名称' },
    { field: 'start', title: '开始时间', width: 100 },
    { field: 'end', title: '结束时间', width: 100 }
  ],
  data: [
    // { id: 10001, title: 'A项目', start: '2026-03-01', end: '2026-03-04', progress: 3 },
    { id: 10002, title: '城市道路修理进度', start: '2026-03-21', end: '2026-03-28', progress: 10 },
    { id: 10003, title: 'B大工程', start: '2026-03-25', end: '2026-04-02', progress: 90 }
  ]
})

const scrollEvent = () => {
  const $gantt = ganttRef.value
  if ($gantt && ganttOptions.data) {
    $gantt.scrollToTaskView(ganttOptions.data[0])
  }
}
</script>
