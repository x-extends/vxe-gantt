<template>
  <div>
    <vxe-gantt
      ref="ganttRef"
      v-bind="ganttOptions"
    />
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const ganttOptions = reactive({
  border: true,
  rowConfig: {
    keyField: 'id'
  },
  columns: [
    { field: 'title', title: '任务名称' },
    { field: 'start', title: '开始时间' },
    { field: 'end', title: '结束时间' }
  ],
  taskViewConfig: {
    scales: ['hour', 'minute'],
    style: {
      color: '#000000'
    }
  },
  taskConfig: {
    dateFormat: 'yyyy-MM-dd HH:mm:ss'
  },
  data: [
    { id: '1', title: 'test001', start: '2026-01-01 00:00:00', end: '2026-01-01 01:00:00' },
    { id: '2', title: 'test001', start: '2026-01-01 02:00:10', end: '2026-01-01 02:30:20' }
  ]
})
</script>
<style scoped>

:deep(.vxe-gantt-view--header-table) {
  color: black !important;
}
</style>
