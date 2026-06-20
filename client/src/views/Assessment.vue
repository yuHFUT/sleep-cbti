<template>
  <div class="assessment-page">
    <!-- 顶部导航 -->
    <div class="top-bar">
      <router-link to="/" class="btn-back">← 返回</router-link>
      <h1>睡眠健康测评</h1>
      <button class="btn-history" @click="showHistory = !showHistory">
        {{ showHistory ? '回到测评' : '📋 历史' }}
      </button>
    </div>

    <!-- 模式1：iframe 测评 -->
    <div v-if="!showHistory" class="iframe-wrap">
      <div v-if="loading" class="loading-state">
        <span class="loading-icon">⏳</span>
        <p>测评加载中...</p>
      </div>
      <iframe
        ref="iframeRef"
        src="/sleep-h5/index.html"
        class="assessment-iframe"
        @load="onIframeLoad"
        allow="clipboard-write"
      ></iframe>
    </div>

    <!-- 模式2：历史记录 -->
    <div v-else class="history-panel">
      <h2>📋 测评历史</h2>
      <div v-if="history.length === 0" class="empty">暂无测评记录</div>
      <div v-for="(item, i) in history" :key="i" class="history-card">
        <div class="hc-header">
          <span class="hc-date">{{ formatDate(item.completed_at) }}</span>
          <span class="hc-score" :style="{color: scoreColor(item.total_score)}">
            {{ item.total_score }} 分
          </span>
        </div>
        <div class="hc-dims">
          <span>睡眠质量 {{ item.sleep_quality }}</span>
          <span>习惯 {{ item.habit }}</span>
          <span>认知 {{ item.cognition }}</span>
          <span>时长 {{ item.duration }}</span>
        </div>
      </div>
    </div>

    <!-- 保存成功提示 -->
    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import request from '@/api/request';

const authStore = useAuthStore();
const userId = computed(() => authStore.user?.id);

const iframeRef = ref(null);
const loading = ref(true);
const showHistory = ref(false);
const history = ref([]);
const toast = ref('');

function onIframeLoad() { loading.value = false; }

// 监听 iframe 的 postMessage
function handleMessage(e) {
  if (e.data?.type === 'sleepAssessmentResult' && e.data.scores) {
    saveScores(e.data.scores);
  }
}

async function saveScores(scores) {
  try {
    await request.post('/assessment/save', {
      userId: userId.value,
      scores: {
        total: scores.total,
        sleepQuality: scores.sleepQuality,
        duration: scores.duration,
        habit: scores.habit,
        cognition: scores.cognition,
      },
    });
    toast.value = '✅ 分数已保存！';
    setTimeout(() => { toast.value = ''; }, 2000);
    loadHistory();
  } catch (e) {
    toast.value = '保存失败：' + (e.response?.data?.message || '网络错误');
    setTimeout(() => { toast.value = ''; }, 3000);
  }
}

async function loadHistory() {
  try {
    const res = await request.get(`/assessment/history/${userId.value}`);
    history.value = res.data || [];
  } catch { history.value = []; }
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function scoreColor(s) {
  if (s >= 80) return '#52c41a';
  if (s >= 60) return '#faad14';
  return '#ff4d4f';
}

onMounted(() => {
  window.addEventListener('message', handleMessage);
  loadHistory();
});
onUnmounted(() => window.removeEventListener('message', handleMessage));
</script>

<style scoped>
.assessment-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  background: #16213e;
  color: #fff;
  flex-shrink: 0;
  z-index: 10;
}

.top-bar h1 { font-size: 1rem; margin: 0; }

.btn-back {
  color: #aaa;
  text-decoration: none;
  font-size: 0.85rem;
}

.btn-history {
  background: rgba(255,255,255,0.15);
  border: none;
  color: #fff;
  padding: 0.35rem 0.8rem;
  border-radius: 14px;
  font-size: 0.8rem;
  cursor: pointer;
}

.iframe-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.loading-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #aaa;
  z-index: 5;
}

.loading-icon { font-size: 2rem; animation: pulse 1.5s infinite; }

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.assessment-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 历史面板 */
.history-panel {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #f5f7fa;
}

.history-panel h2 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 0.8rem;
}

.empty {
  text-align: center;
  color: #999;
  padding: 3rem;
}

.history-card {
  background: #fff;
  border-radius: 12px;
  padding: 0.8rem 1rem;
  margin-bottom: 0.6rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.hc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.hc-date { font-size: 0.8rem; color: #999; }

.hc-score {
  font-size: 1.2rem;
  font-weight: 700;
}

.hc-dims {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.hc-dims span {
  font-size: 0.72rem;
  color: #666;
  background: #f0f0f0;
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
}

.toast {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  font-size: 0.85rem;
  z-index: 999;
  animation: fade 2s ease;
}

@keyframes fade {
  0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  20% { opacity: 1; transform: translateX(-50%) translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
