<template>
  <div>
    <vxe-gantt v-bind="gridOptions"></vxe-gantt>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import type { VxeGanttProps } from '../../../types'

interface RowVO {
  id: number
  name: string
  startDate: string
  endDate: string
  progress: number
}

const gridOptions = reactive<VxeGanttProps<RowVO>>({
  border: true,
  height: 400,
  columnConfig: {
    resizable: true
  },
  columns: [
    { type: 'seq', width: 70 },
    { field: 'name', title: 'Name' },
    { field: 'startDate', title: 'StartDate' },
    { field: 'endDate', title: 'EndDate' },
    { field: 'progress', title: 'Progress' }
  ],
  data: [
    { id: 10001, name: 'Test1', startDate: '2024-02-01', endDate: '2024-03-01', progress: 3 },
    { id: 10002, name: 'Test2', startDate: '2024-02-05', endDate: '2024-02-20', progress: 10 },
    { id: 10003, name: 'Test3', startDate: '2024-04-01', endDate: '2024-05-01', progress: 3 },
    { id: 10004, name: 'Test4', startDate: '2024-06-18', endDate: '2024-08-06', progress: 15 },
    { id: 10005, name: 'Test5', startDate: '2024-02-01', endDate: '2024-02-15', progress: 45 },
    { id: 10006, name: 'Test6', startDate: '2024-02-01', endDate: '2024-03-01', progress: 5 },
    { id: 10007, name: 'Test7', startDate: '2024-08-01', endDate: '2024-11-10', progress: 70 },
    { id: 10008, name: 'Test8', startDate: '2024-02-11', endDate: '2024-03-15', progress: 50 }
  ]
})
</script>
