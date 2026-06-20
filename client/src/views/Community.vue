<template>
  <div class="community-page">
    <div class="page-header">
      <router-link to="/" class="btn-back-link">← 返回首页</router-link>
      <h1>👥 社区</h1>
      <p>匿名互动，互相支持，一起进步</p>
    </div>

    <div class="tab-bar">
      <button
        :class="['tab-btn', { active: activeTab === 'camp' }]"
        @click="activeTab = 'camp'"
      >🏕️ 挑战营</button>
      <button
        :class="['tab-btn', { active: activeTab === 'diary' }]"
        @click="activeTab = 'diary'"
      >📖 还债日记</button>
    </div>

    <div class="tab-content" :key="activeTab">
      <ChallengeCamp v-if="activeTab === 'camp'" :userId="userId" />
      <TopicCircle v-if="activeTab === 'diary'" :userId="userId" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ChallengeCamp from '@/components/ChallengeCamp.vue';
import TopicCircle from '@/components/TopicCircle.vue';

import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const userId = computed(() => authStore.user?.id);
const activeTab = ref('camp');
</script>

<style scoped>
.community-page { min-height: 100vh; background: #f5f7fa; }

.page-header {
  padding: 1.5rem 1.2rem 1rem;
  background: linear-gradient(135deg, #13c2c2, #36cfc9);
  color: #fff;
  text-align: center;
}

.btn-back-link {
  display: inline-block;
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.page-header h1 { font-size: 1.3rem; }
.page-header p { font-size: 0.8rem; opacity: 0.8; margin-top: 0.2rem; }

.tab-bar {
  display: flex;
  background: #fff;
  padding: 0.3rem 1.2rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  gap: 0;
}

.tab-btn {
  flex: 1;
  padding: 0.7rem;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  cursor: pointer;
  color: #999;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #13c2c2;
  border-bottom-color: #13c2c2;
  font-weight: 600;
}

.tab-content { padding: 0.8rem 1.2rem; }
</style>
