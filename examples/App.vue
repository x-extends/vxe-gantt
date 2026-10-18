<template>
  <vxe-layout-container :size="componentsSize" :use-scrollbar="isScrollbar" vertical>
    <vxe-layout-header>
      <vxe-button @click="collapsed = !collapsed">折叠</vxe-button>
      主题切换:<vxe-switch v-model="theme" close-value="light" open-value="dark" @change="changeTheme"></vxe-switch>
      滚动条切换:<vxe-switch v-model="isScrollbar"></vxe-switch>
      <vxe-radio-group v-model="language" :options="langOptions" @change="changeLanguage"></vxe-radio-group>
      <vxe-radio-group class="switch-size" v-model="componentsSize" :options="sizeOptions" type="button" size="mini"></vxe-radio-group>
    </vxe-layout-header>
    <vxe-layout-container>
      <vxe-layout-aside class="page-layout-aside" :collapsed="collapsed" use-scrollbar>
        <VxeMenu :options="navList" collapse-fixed />
      </vxe-layout-aside>
      <vxe-layout-container vertical>
        <vxe-layout-body padding>
          <RouterView />
          <div style="height:100px"></div>

          <div class="my-within-demo2-wrapper" style="height: 600px; position: relative; overflow: auto; background-color: rgb(232, 234, 236);"></div>
        </vxe-layout-body>
        <vxe-layout-footer fixed>11111</vxe-layout-footer>
      </vxe-layout-container>
    </vxe-layout-container>
  </vxe-layout-container>
   <!-- <RouterView /> -->
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { VxeUI, VxeMenuPropTypes, VxeLayoutContainerPropTypes } from 'vxe-pc-ui'
const collapsed = ref(false)

const componentsSize = ref<VxeLayoutContainerPropTypes.Size>('')
const sizeOptions = ref([
  { label: '默认', value: '' },
  { label: '中', value: 'medium' },
  { label: '小', value: 'small' },
  { label: '迷你', value: 'mini' }
])

const navList = ref<VxeMenuPropTypes.Options>([
  { name: 'Home', icon: 'vxe-icon-user-fill', routerLink: { path: '/' } },
  { name: 'GanttTest1', routerLink: { name: 'GanttTest1' } },
  { name: 'GanttTest2', routerLink: { name: 'GanttTest2' } },
  { name: 'GanttTest3', routerLink: { name: 'GanttTest3' } },
  { name: 'GanttTest4', routerLink: { name: 'GanttTest4' } },
  { name: 'GanttTest5', routerLink: { name: 'GanttTest5' } },
  { name: 'GanttTest6', routerLink: { name: 'GanttTest6' } },
  { name: 'GanttTest7', routerLink: { name: 'GanttTest7' } },
  { name: 'GanttTest8', routerLink: { name: 'GanttTest8' } }
])

const isScrollbar = ref(false)

const theme = ref((localStorage.getItem('VXE_THEME') as 'light' | 'dark') || 'light')
VxeUI.setTheme(theme.value)
const changeTheme = () => {
  const themeName = VxeUI.getTheme() === 'dark' ? 'light' : 'dark'
  theme.value = themeName
  VxeUI.setTheme(themeName)
  localStorage.setItem('VXE_THEME', themeName)
}

const language = ref((localStorage.getItem('VXE_LANGUAGE') as 'zh-CN' | 'en-US') || 'zh-CN')
const langOptions = ref([
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: '英文' }
])
const changeLanguage = () => {
  VxeUI.setLanguage(language.value)
  localStorage.setItem('VXE_LANGUAGE', language.value)
}
</script>

<style lang="scss" scoped>
.nav {
  display: block;
}
</style>
