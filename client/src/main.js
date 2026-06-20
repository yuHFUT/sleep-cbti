import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);

// 挂载前初始化认证状态
async function initApp() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const { useAuthStore } = await import('@/stores/auth');
      const authStore = useAuthStore();
      await authStore.fetchProfile();
    } catch {
      // token 无效，忽略
    }
  }
  app.mount('#app');

  // Android 回退键适配
  window.__handleBackPress = () => {
    const currentRoute = router.currentRoute.value;
    if (currentRoute.path === '/' || currentRoute.path === '/login') {
      if (window.NativeBridge) window.NativeBridge.exitApp();
    } else {
      router.back();
    }
  };
}

initApp();
