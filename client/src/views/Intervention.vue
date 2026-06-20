<template>
  <div class="intervention-page">
    <div class="page-header">
      <router-link to="/" class="btn-back-link">← 返回首页</router-link>
      <h1>💊 智能干预处方</h1>
      <p>基于您的评估结果，为您定制CBT-I干预方案</p>
    </div>

    <!-- Tab 导航 -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab 内容 -->
    <div class="tab-content" :key="activeTab">
      <SleepRestriction v-if="activeTab === 'restriction'" :userId="userId" />
      <StimulusControl v-if="activeTab === 'stimulus'" :userId="userId" />
      <CognitiveRestructure v-if="activeTab === 'cognitive'" :userId="userId" />
      <Relaxation v-if="activeTab === 'relaxation'" :userId="userId" />
      <SleepHygiene v-if="activeTab === 'hygiene'" :userId="userId" />
      <AIChat v-if="activeTab === 'ai'" :userId="userId" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import SleepRestriction from '@/components/SleepRestriction.vue';
import StimulusControl from '@/components/StimulusControl.vue';
import CognitiveRestructure from '@/components/CognitiveRestructure.vue';
import Relaxation from '@/components/Relaxation.vue';
import SleepHygiene from '@/components/SleepHygiene.vue';
import AIChat from '@/components/AIChat.vue';

import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const userId = computed(() => authStore.user?.id);
const activeTab = ref('restriction');

const tabs = [
  { key: 'restriction', label: '睡眠限制', icon: '⏰' },
  { key: 'stimulus', label: '刺激控制', icon: '🛌' },
  { key: 'cognitive', label: '认知重塑', icon: '🧠' },
  { key: 'relaxation', label: '放松训练', icon: '🧘' },
  { key: 'hygiene', label: '卫生任务', icon: '✅' },
  { key: 'ai', label: 'AI助手', icon: '🤖' },
];
</script>

<style scoped>
.intervention-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 20px;
}

.page-header {
  padding: 1.5rem 1.2rem 1rem;
  background: linear-gradient(135deg, #4a6fa5, #6b8fc5);
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

.page-header h1 {
  font-size: 1.3rem;
}

.page-header p {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 0.2rem;
}

.tab-bar {
  display: flex;
  background: #fff;
  padding: 0.4rem 0.4rem;
  gap: 0;
  overflow-x: auto;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  position: sticky;
  top: 0;
  z-index: 10;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tab-bar::-webkit-scrollbar { display: none; }

.tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  flex-shrink: 0;
  min-width: 56px;
  padding: 0.4rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: #999;
  font-size: 0.7rem;
}

.tab-btn.active {
  background: #e8f0fe;
  color: #4a6fa5;
  font-weight: 600;
}

.tab-icon { font-size: 1.2rem; line-height: 1; }
.tab-label { white-space: nowrap; line-height: 1; }

.tab-content {
  padding: 0.8rem 1.2rem;
}
</style>
