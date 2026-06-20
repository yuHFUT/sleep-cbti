import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as apiLogin, register as apiRegister, getProfile } from '@/api/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || '');

  const isLoggedIn = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  /** 登录 */
  async function doLogin(username, password) {
    const res = await apiLogin(username, password);
    token.value = res.data.token;
    user.value = res.data.user;
    localStorage.setItem('token', res.data.token);
    return res;
  }

  /** 注册 */
  async function doRegister(username, password, nickname) {
    const res = await apiRegister(username, password, nickname);
    token.value = res.data.token;
    user.value = res.data.user;
    localStorage.setItem('token', res.data.token);
    return res;
  }

  /** 获取用户信息 */
  async function fetchProfile() {
    if (!token.value) return;
    try {
      const res = await getProfile();
      user.value = res.data;
    } catch {
      logout();
    }
  }

  /** 登出 */
  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
  }

  return { user, token, isLoggedIn, isAdmin, doLogin, doRegister, fetchProfile, logout };
});
