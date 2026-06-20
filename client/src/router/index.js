import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { guest: true },
  },
  {
    path: '/assessment',
    name: 'Assessment',
    component: () => import('@/views/Assessment.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/diary',
    name: 'Diary',
    component: () => import('@/views/SleepDiary.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/intervention',
    name: 'Intervention',
    component: () => import('@/views/Intervention.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/report',
    name: 'WeeklyReport',
    component: () => import('@/views/WeeklyReport.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/achievements',
    name: 'Achievements',
    component: () => import('@/views/Achievements.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('@/views/Community.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');

  // 已登录用户访问登录/注册页 → 跳转首页
  if (to.meta.guest && token) {
    return next('/');
  }

  // 需要认证的页面但未登录 → 跳转登录页
  if (to.meta.requiresAuth && !token) {
    return next('/login');
  }

  next();
});

export default router;
