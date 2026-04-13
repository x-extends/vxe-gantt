<template>
  <div>
    <vxe-gantt v-bind="ganttOptions"></vxe-gantt>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import type { VxeGanttProps } from '../../../types'

interface RowVO {
  id: number
  title: string
  start: string
  end: string
  progress: number
}

const list = [
  { id: 10001, title: 'A项目', start: '2024-03-01', end: '2024-03-04', progress: 3 },
  { id: 10002, title: '城市道路修理进度', start: '2024-03-03', end: '2024-03-08', progress: 10 },
  { id: 10003, title: 'B大工程', start: '2024-03-03', end: '2024-03-11', progress: 90 },
  { id: 10004, title: '超级大工程', start: '2024-03-05', end: '2024-03-11', progress: 15 },
  { id: 10005, title: '地球净化项目', start: '2024-03-08', end: '2024-03-15', progress: 100 },
  { id: 10006, title: '一个小目标项目', start: '2024-03-10', end: '2024-03-21', progress: 0 },
  { id: 10007, title: '某某计划', start: '2024-03-15', end: '2024-03-24', progress: 70 },
  { id: 10008, title: '某某科技项目', start: '2024-03-20', end: '2024-03-29', progress: 50 },
  { id: 10009, title: '地铁建设工程', start: '2024-03-19', end: '2024-03-20', progress: 5 },
  { id: 10010, title: '公寓装修计划2', start: '2024-03-12', end: '2024-03-20', progress: 30 },
  { id: 10011, title: '两个小目标工程', start: '2024-03-01', end: '2024-03-04', progress: 20 },
  { id: 10012, title: '蓝天计划', start: '2024-03-02', end: '2024-03-08', progress: 50 },
  { id: 10013, title: 'C大项目', start: '2024-03-08', end: '2024-03-11', progress: 10 },
  { id: 10014, title: 'H计划', start: '2024-03-12', end: '2024-03-16', progress: 100 },
  { id: 10015, title: '铁路修建计划', start: '2024-03-05', end: '2024-03-06', progress: 0 },
  { id: 10016, title: 'D项目', start: '2024-03-06', end: '2024-03-11', progress: 10 },
  { id: 10017, title: '海外改造工程', start: '2024-03-08', end: '2024-03-09', progress: 0 },
  { id: 10018, title: 'Z计划', start: '2024-03-24', end: '2024-03-26', progress: 80 },
  { id: 10019, title: 'F工程', start: '2024-03-20', end: '2024-03-28', progress: 10 },
  { id: 10020, title: '投资大项目', start: '2024-03-23', end: '2024-03-28', progress: 60 },
  { id: 10021, title: 'X计划', start: '2024-03-16', end: '2024-03-25', progress: 10 },
  { id: 10022, title: '上天计划', start: '2024-03-05', end: '2024-03-24', progress: 0 },
  { id: 10023, title: 'G项目', start: '2024-03-08', end: '2024-03-28', progress: 5 },
  { id: 10024, title: '下地计划', start: '2024-03-09', end: '2024-03-16', progress: 50 }
]

// 模拟接口
const findPageList = (pageSize: number, currentPage: number) => {
  console.log(`调用查询接口 pageSize=${pageSize} currentPage=${currentPage}`)
  return new Promise<{
    result: RowVO[]
    page: {
      total: number
    }
  }>(resolve => {
    setTimeout(() => {
      resolve({
        result: list.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        page: {
          total: list.length
        }
      })
    }, 100)
  })
}

const ganttOptions = reactive<VxeGanttProps<RowVO>>({
  border: true,
  height: 500,
  pagerConfig: {},
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
  proxyConfig: {
    // showLoading: false, // 关闭加载中
    // response: {
    //   result: 'result', // 配置响应结果列表字段
    //   total: 'page.total' // 配置响应结果总页数字段
    // },
    ajax: {
      query: ({ page }) => {
        // 默认接收 Promise<{ result: [], page: { total: 100 } }>
        return findPageList(page.pageSize, page.currentPage)
      }
    }
  },
  columns: [
    { type: 'seq', width: 70 },
    { field: 'title', title: '任务名称' },
    { field: 'start', title: '开始时间', width: 100 },
    { field: 'end', title: '结束时间', width: 100 }
  ]
})
</script>
