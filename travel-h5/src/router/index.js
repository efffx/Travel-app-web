import { createRouter, createWebHistory } from 'vue-router'
const routes = [
    {
    path :'/',
    name :'home',
    component: () =>import('../views/Home2.vue')
    },
    {
    path :'/chat',
    name :'Chat',
    component: () =>import('../views/Chat.vue')
    },
    {
    path :'/profile',
    name :'Profile',
    component: () =>import('../views/Profile2.vue')
    },
    {
    path :'/detail',
    name :'Detail',
    component: () =>import('../views/Detail2.vue')
    },
    {
    path :'/login',
    name :'Login',
    component: () =>import('../views/Login2.vue')
    },
    {
    path :'/register',
    name :'Register',
    component: () =>import('../views/Register2.vue')
    },
    {
    path :'/travel-logs',
    name :'TravelLogs',
    component: () =>import('../views/TravelLogList.vue')
    },
    {
    path :'/travel-log/new',
    name :'TravelLogNew',
    component: () =>import('../views/TravelLogForm.vue')
    },
    {
    path :'/travel-log/:id/edit',
    name :'TravelLogEdit',
    component: () =>import('../views/TravelLogForm.vue')
    },
    {
    path :'/my-plans',
    name :'MyPlans',
    component: () =>import('../views/MyPlans.vue')
    },
]

const router = createRouter({
    history : createWebHistory(),
    routes
})
export default router
