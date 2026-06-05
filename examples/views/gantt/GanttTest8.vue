<template>
  <div>
    <vxe-gantt v-bind="ganttOptions"></vxe-gantt>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import type { VxeGanttProps } from '../../../types'

interface RowVO {
  id: number
  title: string
  start: string
  end: string
  progress: number
}

export default Vue.extend({
  data () {
    const ganttOptions: VxeGanttProps<RowVO> = {
      border: true,
      showOverflow: true,
      showHeaderOverflow: true,
      showFooterOverflow: true,
      height: 600,
      virtualYConfig: {
        enabled: true,
        gt: 0
      },
      taskBarConfig: {
        showProgress: true,
        showContent: true
      },
      taskViewConfig: {
        tableStyle: {
          width: 480
        }
      },
      columns: [
        { type: 'seq', width: 70 },
        { field: 'title', title: '任务名称' },
        { field: 'start', title: '开始时间', width: 100 },
        { field: 'end', title: '结束时间', width: 100 }
      ],
      data: []
    }

    return {
      ganttOptions
    }
  },
  methods: {
    // 模拟行数据
    loadList (size = 200) {
      const dataList: RowVO[] = []
      for (let i = 0; i < size; i++) {
        dataList.push({
          id: 10000 + i,
          title: `任务计划${i + 1}`,
          start: i % 3 ? '2024-03-03' : i % 2 ? '2024-03-05' : '2024-03-09',
          end: i % 3 ? '2024-03-11' : i % 2 ? '2024-03-19' : '2024-03-14',
          progress: i % 2 ? 50 : 30
        })
      }
      this.ganttOptions.data = dataList
    }
  },
  created () {
    this.loadList(500)
  }
})
</script>
