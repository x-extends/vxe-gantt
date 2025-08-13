import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'

import RouteLayout from '../views/layout/RouteLayout.vue'
import StartInstall from '../views/start/StartInstall.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    redirect: {
      name: 'StartInstall'
    }
  },
  {
    path: '/start/install',
    name: 'StartInstall',
    component: StartInstall
  },
  {
    path: '/component/gantt',
    component: RouteLayout,
    children: [
      {
        path: 'test1',
        name: 'GanttTest1',
        component: () => import('../views/gantt/GanttTest1.vue')
      },
      {
        path: 'test2',
        name: 'GanttTest2',
        component: () => import('../views/gantt/GanttTest2.vue')
      },
      {
        path: 'test3',
        name: 'GanttTest3',
        component: () => import('../views/gantt/GanttTest3.vue')
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
