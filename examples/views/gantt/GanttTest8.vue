<template>
  <div>
    <vxe-gantt ref="ganttRef" v-bind="ganttOptions" v-on="ganttEvents"></vxe-gantt>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { VxeUI } from 'vxe-pc-ui'
import type { VxeGanttInstance, VxeGanttProps, VxeGanttListeners } from '../../../types'

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
  showFooter: true,
  height: 400,
  rowConfig: {
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
  taskViewScaleConfig: {
    // scaleUnit: 'week'
  },
  columns: [
    { field: 'title', title: '任务名称' },
    { field: 'start', title: '开始时间', width: 100 },
    { field: 'end', title: '结束时间', width: 100 }
  ],
  data: [
    { id: 10001, title: 'A项目', start: '2024-03-01', end: '2024-03-04', progress: 3 },
    { id: 10002, title: '城市道路修理进度', start: '2024-03-03', end: '2024-03-08', progress: 10 },
    { id: 10003, title: 'B大工程', start: '2024-03-03', end: '2024-03-11', progress: 90 },
    { id: 10004, title: '超级大工程', start: '2024-03-05', end: '2024-03-11', progress: 15 },
    { id: 10005, title: '地球净化项目', start: '2024-03-08', end: '2024-03-15', progress: 100 },
    { id: 10006, title: '一个小目标项目', start: '2024-05-10', end: '2024-07-21', progress: 5 },
    { id: 10007, title: '某某计划', start: '2024-03-15', end: '2024-03-24', progress: 70 },
    { id: 10008, title: '某某科技项目', start: '2024-04-20', end: '2024-06-29', progress: 50 },
    { id: 10009, title: '地铁建设工程', start: '2024-03-19', end: '2024-03-20', progress: 5 },
    { id: 10010, title: '铁路修建计划', start: '2024-04-12', end: '2024-05-20', progress: 10 }
  ],
  menuConfig: {
    header: {
      options: [
        [
          { code: 'exportAll', name: '导出所有.csv', prefixConfig: { icon: 'vxe-icon-download' }, visible: true, disabled: false }
        ]
      ]
    },
    body: {
      options: [
        [
          { code: 'copy', name: '复制内容（Ctrl+C）', prefixConfig: { icon: 'vxe-icon-copy' }, visible: true, disabled: false },
          { code: 'clear', name: '清除内容', visible: true, disabled: false },
          { code: 'reload', name: '刷新表格', visible: true, disabled: false }
        ],
        [
          {
            code: 'fixed',
            name: '冻结列',
            children: [
              { code: 'cancelFixed', name: '取消冻结' },
              { code: 'fixedLeft', name: '冻结在左侧', prefixConfig: { icon: 'vxe-icon-fixed-left' } },
              { code: 'fixedRight', name: '冻结在右侧', prefixConfig: { icon: 'vxe-icon-fixed-right' } }
            ]
          }
        ],
        [
          { code: 'myPrint', name: '打印（Ctrl+P）', prefixConfig: { icon: 'vxe-icon-print' }, visible: true, disabled: false },
          { code: 'myExport', name: '导出.csv', prefixConfig: { icon: 'vxe-icon-download' }, visible: true, disabled: false }
        ]
      ]
    },
    footer: {
      options: [
        [
          { code: 'exportAll', name: '导出所有.csv', prefixConfig: { icon: 'vxe-icon-download' }, visible: true, disabled: false }
        ]
      ]
    }
  },
  footerData: [
    { title: '合计', start: 111, end: 222 }
  ]
})

const ganttEvents: VxeGanttListeners<RowVO> = {
  cellMenu ({ row }) {
    const $gantt = ganttRef.value
    if ($gantt) {
      $gantt.setCurrentRow(row)
    }
  },
  menuClick (e) {
    console.log(e)
    VxeUI.modal.message({ content: `点击了 ${e.menu.code}`, status: 'success' })
  }
}
</script>
