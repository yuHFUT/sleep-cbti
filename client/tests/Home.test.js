import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import Home from '../src/views/Home.vue';

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isLoggedIn: false,
    isAdmin: false,
    user: null,
    logout: vi.fn(),
    fetchProfile: vi.fn(),
    token: '',
  }),
}));

function mountWithPlugins(component) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: Home }],
  });
  return mount(component, {
    global: { plugins: [pinia, router] },
  });
}

describe('Home 页面', () => {
  it('应该渲染应用标题', () => {
    const wrapper = mountWithPlugins(Home);
    expect(wrapper.text()).toContain('睡益良方');
  });

  it('应该展示 CBT-I 副标题', () => {
    const wrapper = mountWithPlugins(Home);
    expect(wrapper.text()).toContain('CBT-I');
  });

  it('应该展示品牌标语', () => {
    const wrapper = mountWithPlugins(Home);
    expect(wrapper.text()).toContain('不靠药物');
  });

  it('未登录时应显示登录链接', () => {
    const wrapper = mountWithPlugins(Home);
    expect(wrapper.text()).toContain('登录');
  });
});
