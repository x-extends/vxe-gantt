<template>
  <div>
    <vxe-gantt v-bind="gridOptions"></vxe-gantt>
  </div>
</template>

<script >
import { VxeGanttDependencyType } from '../../../packages'

export default {
  data () {
    const gridOptions = {
      border: true,
      showFooter: true,
      height: 600,
      rowConfig: {
        keyField: 'id',
        isCurrent: true
      },
      columnConfig: {
        resizable: true
      },
      taskBarConfig: {
        showProgress: true,
        showContent: true
      },
      taskViewConfig: {
        scales: ['year', 'quarter', 'month', 'date'],
        tableStyle: {
          width: 480
        }
      },
      links: [
        { from: '10001', to: '10002', type: VxeGanttDependencyType.FinishToFinish },
        { from: '10002', to: '10003', type: VxeGanttDependencyType.FinishToFinish, lineTyle: 'dashed' },
        { from: '10003', to: '10004', type: VxeGanttDependencyType.FinishToFinish, lineTyle: 'flowDashed' },
        { from: '10006', to: '10005', type: VxeGanttDependencyType.FinishToFinish },
        { from: '10008', to: '10007', type: VxeGanttDependencyType.FinishToFinish },

        { from: '10009', to: '10010', type: VxeGanttDependencyType.StartToStart },
        { from: '10010', to: '10011', type: VxeGanttDependencyType.StartToStart },
        { from: '10013', to: '10012', type: VxeGanttDependencyType.StartToStart },
        { from: '10015', to: '10014', type: VxeGanttDependencyType.StartToStart }
      ],
      taskViewScaleConfig: {
        // scaleUnit: 'week'
      },
      columns: [
        { type: 'seq' },
        { field: 'title', title: '任务名称' },
        { field: 'start', title: '开始时间', width: 100 },
        { field: 'end', title: '结束时间', width: 100 }
      ],
      data: [
        { id: 10001, title: 'A项目', start: '2024-03-01', end: '2024-03-04', progress: 3 },
        { id: 10002, title: '城市道路修理进度', start: '2024-03-03', end: '2024-03-08', progress: 10 },
        { id: 10003, title: 'B大工程', start: '2024-03-03', end: '2024-03-11', progress: 90 },
        { id: 10004, title: '超级大工程', start: '2024-02-26 07:30:00', end: '2024-02-28 09:00:00', progress: 15 },
        { id: 10005, title: '地球净化项目', start: '2024-03-01', end: '2024-03-05', progress: 100 },
        { id: 10006, title: '一个小目标项目', start: '2024-03-04', end: '2024-03-08', progress: 5 },
        { id: 10007, title: '某某计划', start: '2024-03-05', end: '2024-03-09', progress: 70 },
        { id: 10008, title: '某某科技项目', start: '2024-03-01', end: '2024-03-03', progress: 50 },
        { id: 10009, title: '地铁建设工程', start: '2024-03-02', end: '2024-03-04', progress: 5 },
        { id: 10010, title: '铁路修建计划', start: '2024-03-01', end: '2024-03-03', progress: 10 },
        { id: 10011, title: '铁路修建计划', start: '2024-03-04', end: '2024-03-08', progress: 10 },
        { id: 10012, title: '铁路修建计划', start: '2024-03-02', end: '2024-03-04', progress: 10 },
        { id: 10013, title: '铁路修建计划', start: '2024-03-08', end: '2024-03-12', progress: 10 },
        { id: 10014, title: '铁路修建计划', start: '2024-03-05', end: '2024-03-09', progress: 10 },
        { id: 10015, title: '铁路修建计划', start: '2024-03-01', end: '2024-03-03', progress: 10 }
      ],
      footerData: [
        { title: '合计', start: 111, end: 222 }
      ]
    }

    return {
      gridOptions
    }
  }
}
</script>
