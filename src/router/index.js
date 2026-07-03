import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/hero/:name',
    name: 'hero',
    component: () => import('@/views/HeroView.vue'),
    props: true
  },
  {
    path: '/game/:type',
    name: 'game',
    component: () => import('@/views/GameDataView.vue'),
    props: true
  },
  {
    path: '/board',
    name: 'board',
    component: () => import('@/views/BoardView.vue')
  },
  {
    path: '/simulator',
    name: 'simulator',
    component: () => import('@/views/SimulatorView.vue')
  },
  {
    path: '/mechanics',
    name: 'mechanics',
    component: () => import('@/views/MechanicsView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
