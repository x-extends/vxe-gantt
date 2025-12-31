<template>
  <div>
    <vxe-select v-model="rowSize" :options="dataOptions" @change="changeRowSizeEvent"></vxe-select>

    <vxe-gantt ref="ganttRef" v-bind="ganttOptions"></vxe-gantt>
  </div>
</template>

<script>
export default {
  data () {
    const ganttOptions = {
      border: true,
      loading: false,
      showOverflow: true,
      showHeaderOverflow: true,
      showFooterOverflow: true,
      height: 600,
      rowConfig: {
        keyField: 'id' // 行主键
      },
      taskBarConfig: {
        showProgress: true,
        showContent: true,
        moveable: true,
        resizable: true,
        barStyle: {
          round: true,
          bgColor: '#fca60b',
          completedBgColor: '#65c16f' // 已完成部分任务条的背景颜色
        }
      },
      taskViewConfig: {
        tableStyle: {
          width: 480 // 表格宽度
        }
      },
      virtualYConfig: {
        gt: 0,
        enabled: true
      },
      columns: [
        { type: 'seq', width: 70 },
        { field: 'title', title: '任务名称' },
        { field: 'start', title: '开始时间', width: 100 },
        { field: 'end', title: '结束时间', width: 100 },
        { field: 'progress', title: '进度(%)', width: 80 }
      ],
      data: [
        { id: 10001, title: '任务1', start: '2024-03-01', end: '2024-03-04', progress: 3 },
        { id: 10002, title: '任务2', start: '2024-03-03', end: '2024-03-08', progress: 10 },
        { id: 10003, title: '任务3', start: '2024-03-03', end: '2024-03-11', progress: 90 },
        { id: 10004, title: '任务4', start: '2024-03-05', end: '2024-03-11', progress: 15 },
        { id: 10005, title: '任务5', start: '2024-03-08', end: '2024-03-15', progress: 100 },
        { id: 10006, title: '任务6', start: '2024-03-10', end: '2024-03-21', progress: 5 },
        { id: 10007, title: '任务7', start: '2024-03-15', end: '2024-03-24', progress: 70 },
        { id: 10008, title: '任务8', start: '2024-03-05', end: '2024-03-15', progress: 50 },
        { id: 10009, title: '任务9', start: '2024-03-19', end: '2024-03-20', progress: 5 },
        { id: 10010, title: '任务10', start: '2024-03-12', end: '2024-03-20', progress: 10 },
        { id: 10011, title: '任务11', start: '2024-03-01', end: '2024-03-08', progress: 90 },
        { id: 10012, title: '任务12', start: '2024-03-03', end: '2024-03-06', progress: 60 },
        { id: 10013, title: '任务13', start: '2024-03-02', end: '2024-03-05', progress: 50 },
        { id: 10014, title: '任务14', start: '2024-03-04', end: '2024-03-15', progress: 0 },
        { id: 10015, title: '任务15', start: '2024-03-01', end: '2024-03-05', progress: 30 }
      ]
    }
    const rowSize = 500
    const dataOptions = [
      { label: '加载 3 行', value: 3 },
      { label: '加载 20 行', value: 20 },
      { label: '加载 100 行', value: 100 },
      { label: '加载 500 行', value: 500 },
      { label: '加载 1000 行', value: 1000 },
      { label: '加载 5000 行', value: 5000 },
      { label: '加载 10000 行', value: 10000 },
      { label: '加载 50000 行', value: 50000 },
      { label: '加载 100000 行', value: 100000 }
    ]
    return {
      ganttOptions,
      rowSize,
      dataOptions
    }
  },
  created () {
    this.loadList(this.rowSize)
  },
  methods: {
    // 模拟行数据
    loadList (size = 200) {
      this.ganttOptions.loading = true
      setTimeout(() => {
        const dataList = []
        for (let i = 0; i < size; i++) {
          dataList.push({
            id: 10000 + i,
            title: `任务${i + 1}`,
            start: i % 3 ? '2024-03-03' : i % 2 ? '2024-03-10' : '2024-03-22',
            end: i % 3 ? '2024-03-11' : i % 2 ? '2024-03-19' : '2024-04-04',
            progress: i % 2 ? 50 : 30
          })
        }
        const $gantt = this.$refs.ganttRef
        if ($gantt) {
          $gantt.loadData(dataList).then(() => {
            this.ganttOptions.loading = false
          })
        } else {
          this.ganttOptions.loading = false
        }
      }, 150)
    },
    changeRowSizeEvent () {
      this.loadList(this.rowSize)
    }
  }
}
</script>
