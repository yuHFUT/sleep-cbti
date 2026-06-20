<template>
  <div class="achievements-page">
    <div class="page-header">
      <router-link to="/" class="btn-back-link">← 返回首页</router-link>
      <h1>🏆 成就徽章</h1>
    </div>

    <!-- 进度概览 -->
    <div class="progress-card">
      <div class="progress-ring-container">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#eee" stroke-width="5" />
          <circle
            cx="40" cy="40" r="34"
            fill="none" stroke="#4a6fa5" stroke-width="5"
            :stroke-dasharray="2 * Math.PI * 34"
            :stroke-dashoffset="2 * Math.PI * 34 * (1 - (summary.progress || 0) / 100)"
            stroke-linecap="round"
            transform="rotate(-90 40 40)"
          />
        </svg>
        <div class="progress-text-center">
          <span class="ptc-num">{{ summary.totalUnlocked || 0 }}</span>
          <span class="ptc-div">/ {{ summary.totalBadges || 0 }}</span>
        </div>
      </div>
      <div class="progress-info">
        <h3>成就进度</h3>
        <p>{{ summary.progress || 0 }}% 完成</p>
        <div class="progress-bar-small">
          <div class="pbs-fill" :style="{ width: (summary.progress || 0) + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 徽章网格 -->
    <div class="badges-grid">
      <div
        v-for="badge in badges"
        :key="badge.code"
        class="badge-card"
        :class="{ unlocked: badge.unlocked }"
      >
        <div class="badge-icon-wrap" :class="{ locked: !badge.unlocked }">
          <span class="badge-icon">{{ badge.unlocked ? badge.icon : '🔒' }}</span>
        </div>
        <h4>{{ badge.name }}</h4>
        <p>{{ badge.description }}</p>
        <span v-if="badge.unlocked" class="badge-date">
          {{ formatDate(badge.earnedAt) }}
        </span>
        <span v-else class="badge-locked-label">未解锁</span>
      </div>
    </div>

    <div class="refresh-area">
      <button class="btn-refresh" @click="refreshAchievements">🔄 刷新成就状态</button>
    </div>

    <!-- 解锁提示 -->
    <div v-if="showToast" class="toast">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { getAchievements, checkAchievements } from '@/api/report';

import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const userId = computed(() => authStore.user?.id);
const badges = ref([]);
const summary = reactive({ totalUnlocked: 0, totalBadges: 0, progress: 0 });
const toastMsg = ref('');
const showToast = ref(false);

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

async function loadAchievements() {
  try {
    const res = await getAchievements(userId.value);
    badges.value = res.data.badges || [];
    Object.assign(summary, res.data.summary || {});
  } catch { /* ignore */ }
}

async function refreshAchievements() {
  try {
    const res = await checkAchievements(userId.value);
    toastMsg.value = res.data.message;
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 2500);
    loadAchievements();
  } catch { /* ignore */ }
}

watch(userId, (id) => { if (id) loadAchievements(); }, { immediate: true });
</script>

<style scoped>
.achievements-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 30px;
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

.page-header h1 { font-size: 1.3rem; }

/* 进度卡片 */
.progress-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.8rem 1.2rem;
  padding: 1rem 1.2rem;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.progress-ring-container {
  position: relative;
  flex-shrink: 0;
}

.progress-text-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.ptc-num { font-size: 1.2rem; font-weight: 700; color: #4a6fa5; }
.ptc-div { font-size: 0.7rem; color: #999; }

.progress-info { flex: 1; }
.progress-info h3 { font-size: 0.95rem; color: #333; }
.progress-info p { font-size: 0.8rem; color: #999; margin: 0.2rem 0 0.4rem; }

.progress-bar-small {
  height: 5px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
}

.pbs-fill {
  height: 100%;
  background: #4a6fa5;
  border-radius: 3px;
  transition: width 0.5s;
}

/* 徽章网格 */
.badges-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  padding: 0 1.2rem;
}

.badge-card {
  padding: 0.8rem 0.5rem;
  text-align: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  transition: all 0.2s;
  opacity: 0.45;
}

.badge-card.unlocked {
  opacity: 1;
}

.badge-card.unlocked:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74,111,165,0.15);
}

.badge-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #f0f5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.4rem;
  border: 2px solid #d9e6ff;
}

.badge-icon-wrap.locked {
  background: #f5f5f5;
  border-color: #e8e8e8;
}

.badge-icon { font-size: 1.4rem; }

.badge-card h4 {
  font-size: 0.78rem;
  color: #333;
  margin-bottom: 0.15rem;
}

.badge-card p {
  font-size: 0.65rem;
  color: #999;
  line-height: 1.3;
  margin-bottom: 0.3rem;
}

.badge-date {
  font-size: 0.62rem;
  color: #52c41a;
  font-weight: 600;
}

.badge-locked-label {
  font-size: 0.62rem;
  color: #ccc;
}

.refresh-area {
  text-align: center;
  margin-top: 1.5rem;
}

.btn-refresh {
  padding: 0.6rem 1.5rem;
  border: 1px solid #4a6fa5;
  border-radius: 20px;
  background: #fff;
  color: #4a6fa5;
  font-size: 0.85rem;
  cursor: pointer;
}

.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  font-size: 0.85rem;
  z-index: 100;
  animation: fadeInOut 2.5s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  20% { opacity: 1; transform: translateX(-50%) translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
