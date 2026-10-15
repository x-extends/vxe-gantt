<template>
  <div>
    X：<vxe-radio-group v-model="scrollbarConfig.xConfig.position">
      <vxe-radio-button checked-value="top" content="top"></vxe-radio-button>
      <vxe-radio-button checked-value="bottom" content="bottom"></vxe-radio-button>
    </vxe-radio-group>
    Y：<vxe-radio-group v-model="scrollbarConfig.yConfig.position">
      <vxe-radio-button checked-value="left" content="left"></vxe-radio-button>
      <vxe-radio-button checked-value="right" content="right"></vxe-radio-button>
    </vxe-radio-group>
    边距：<vxe-switch v-model="scrollbarConfig.padding"></vxe-switch>

    <vxe-gantt v-bind="ganttOptions"></vxe-gantt>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import type { VxeGanttProps, VxeWithRequired } from '../../../types'
import type { VxeTablePropTypes } from 'vxe-table'

interface RowVO {
  id: number
  title: string
  start: string
  end: string
  progress: number
  responsibleBy: string
  description: string
  imgList: string[]
  fileList: {
    name: string
    size: number
    url: string
  }[]
  createBy: string
  updateBy: string
  createDate: string
  updateDate: string
}

const scrollbarConfig = reactive<VxeWithRequired<VxeTablePropTypes.ScrollbarConfig, 'xConfig' | 'yConfig'>>({
  padding: false,
  autoHide: true,
  xConfig: {
    position: 'top'
  },
  yConfig: {
    position: 'left'
  }
})

const ganttOptions = reactive<VxeGanttProps<RowVO>>({
  border: true,
  height: 400,
  useScrollbar: true,
  taskBarConfig: {
    showProgress: true,
    showContent: true
  },
  taskViewConfig: {
    tableStyle: {
      width: 480
    }
  },
  scrollbarConfig,
  columns: [
    { type: 'seq', field: 'seq', width: 70 },
    { field: 'title', title: '任务名称', minWidth: 300 },
    { field: 'start', title: '开始时间', width: 100 },
    { field: 'end', title: '结束时间', width: 100 },
    { field: 'responsibleBy', title: '负责人', width: 140 },
    { field: 'description', title: '备注', width: 200 },
    { field: 'createBy', title: '创建人', width: 160 },
    { field: 'updateBy', title: '最后更新人', width: 180 },
    { field: 'createDate', title: '创建时间', width: 140 },
    { field: 'updateDate', title: '更新时间', width: 140 }
  ],
  data: [
    { id: 10001, title: '任务R790', start: '2024-03-01', end: '2024-03-04', progress: 3, responsibleBy: '张三', description: '', createBy: '小明', updateBy: '小陈', createDate: '2024-03-01', updateDate: '2024-03-02', imgList: ['https://vxeui.com/resource/img/bq475.gif'], fileList: [{ name: 'fj577.jpg', url: 'https://vxeui.com/resource/img/fj577.jpg', size: 6054 }] },
    { id: 10002, title: '任务C30456572349', start: '2024-03-03', end: '2024-03-08', progress: 10, responsibleBy: '小徐', description: '', createBy: '小徐', updateBy: '小徐', createDate: '2024-03-01', updateDate: '2024-03-02', imgList: ['https://vxeui.com/resource/img/bq673.gif'], fileList: [] },
    { id: 10003, title: '任务E563', start: '2024-03-03', end: '2024-03-11', progress: 90, responsibleBy: '李四', description: '不备注', createBy: '李四', updateBy: '老黄', createDate: '2024-03-01', updateDate: '2024-03-02', imgList: [], fileList: [{ name: 'bq987.gif', url: 'https://vxeui.com/resource/img/bq987.gif', size: 6054 }] },
    { id: 10004, title: '任务P687', start: '2024-03-05', end: '2024-03-11', progress: 15, responsibleBy: '小陈', description: '', createBy: '小红', updateBy: '小陈', createDate: '2024-03-01', updateDate: '2024-03-02', imgList: ['https://vxeui.com/resource/img/fj577.jpg'], fileList: [] },
    { id: 10005, title: '任务L8412430903', start: '2024-03-08', end: '2024-03-15', progress: 100, responsibleBy: '小李', description: '备注描述', createBy: '小李', updateBy: '小李', createDate: '2024-03-01', updateDate: '2024-03-02', imgList: [], fileList: [] },
    { id: 10006, title: '任务B567', start: '2024-03-10', end: '2024-03-21', progress: 5, responsibleBy: '老六', description: '任务备注备注备注', createBy: '小陈', updateBy: '王五', createDate: '2024-03-01', updateDate: '2024-03-02', imgList: ['https://vxeui.com/resource/img/fj124.jpeg'], fileList: [{ name: 'fj586.pn', url: 'https://vxeui.com/resource/img/fj586.png', size: 75064 }] },
    { id: 10007, title: '任务V513802134450', start: '2024-03-15', end: '2024-03-24', progress: 70, responsibleBy: '小红', description: '', createBy: '张三', updateBy: '小红', createDate: '2024-03-01', updateDate: '2024-03-02', imgList: ['https://vxeui.com/resource/img/fj581.jpeg'], fileList: [] },
    { id: 10008, title: '任务G110', start: '2024-03-20', end: '2024-03-29', progress: 50, responsibleBy: '王五', description: '', createBy: '小明', updateBy: '小徐', createDate: '2024-03-01', updateDate: '2024-03-02', imgList: ['https://vxeui.com/resource/img/fj586.png'], fileList: [{ name: 'fj843.jpg', url: 'https://vxeui.com/resource/img/fj843.jpg', size: 10240 }] },
    { id: 10009, title: '任务I802', start: '2024-03-19', end: '2024-03-20', progress: 5, responsibleBy: '老黄', description: '备注信息备注信息', createBy: '李四', updateBy: '小明', createDate: '2024-03-01', updateDate: '2024-03-02', imgList: [], fileList: [] },
    { id: 10010, title: '任务K778', start: '2024-03-12', end: '2024-03-20', progress: 10, responsibleBy: '小明', description: '', createBy: '王五', updateBy: '老黄', createDate: '2024-03-01', updateDate: '2024-03-02', imgList: ['https://vxeui.com/resource/img/fj843.jpg'], fileList: [] }
  ]
})
</script>
