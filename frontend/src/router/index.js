import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'MurderList' } },
    {
      path: '/create',
      name: 'create',
      component: () => import('../views/CreateView.vue'),
      meta: { title: 'Create a room — MurderList' },
    },
    {
      path: '/join',
      name: 'join',
      component: () => import('../views/JoinView.vue'),
      meta: { title: 'Join a game — MurderList' },
    },
    {
      path: '/room/:code',
      name: 'room',
      component: () => import('../views/RoomView.vue'),
      meta: { title: 'Room — MurderList' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  document.title = to.meta.title ?? 'MurderList'
})

export default router
