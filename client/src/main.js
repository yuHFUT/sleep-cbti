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
  // GitHub Pages 模式：动态加载 API 配置
  if (window.location.hostname.includes('github.io')) {
    try {
      const resp = await fetch('/sleep-cbti/api-config.json');
      if (resp.ok) {
        const config = await resp.json();
        if (config.apiBase) {
          localStorage.setItem('api_base', config.apiBase);
        }
      }
    } catch {
      // 使用 request.js 中的硬编码回退地址
    }
  }

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
