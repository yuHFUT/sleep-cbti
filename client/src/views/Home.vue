<template>
  <div class="home">
    <!-- 用户状态栏 -->
    <div class="user-bar">
      <template v-if="authStore.isLoggedIn">
        <span class="user-info">
          <span class="user-avatar">😴</span>
          <span class="user-name">{{ authStore.user?.nickname || authStore.user?.username }}</span>
          <span v-if="authStore.isAdmin" class="admin-badge">管理员</span>
        </span>
        <button class="btn-notify" @click="notifyRef?.open()">🔔</button>
        <button class="btn-logout" @click="handleLogout">退出</button>
      </template>
      <template v-else>
        <router-link to="/login" class="btn-login">登录</router-link>
        <router-link to="/register" class="btn-register-link">注册</router-link>
      </template>
    </div>

    <div class="hero">
      <div class="moon-icon">🌙</div>
      <h1>睡益良方</h1>
      <p class="subtitle">大学生 CBT-I 数字疗法助手</p>
      <p class="slogan">不靠药物，用行为改变赢回睡眠</p>
    </div>

    <!-- 数据概览 -->
    <div class="stats-row" v-if="authStore.isLoggedIn">
      <div class="stat-card">
        <span class="stat-val">{{ dash.latestScore != null ? dash.latestScore + '分' : '--' }}</span>
        <span class="stat-label">最新测评得分</span>
      </div>
      <div class="stat-card">
        <span class="stat-val">{{ dash.avgDuration != null ? dash.avgDuration + 'h' : '--' }}</span>
        <span class="stat-label">平均睡眠时长</span>
      </div>
      <div class="stat-card">
        <span class="stat-val">{{ dash.avgEfficiency != null ? dash.avgEfficiency + '%' : '--' }}</span>
        <span class="stat-label">平均睡眠效率</span>
      </div>
    </div>

    <div class="module-cards">
      <router-link to="/assessment" class="module-card card-assessment">
        <span class="card-icon">📋</span>
        <div class="card-text">
          <h3>睡眠档案与评估</h3>
          <p>完成三大量表，获取专属睡眠六维图</p>
        </div>
        <span class="card-arrow">→</span>
      </router-link>

      <router-link to="/diary" class="module-card card-diary">
        <span class="card-icon">📓</span>
        <div class="card-text">
          <h3>睡眠日记</h3>
          <p>每日快速记录，追踪睡眠效率变化</p>
        </div>
        <span class="card-arrow">→</span>
      </router-link>

      <router-link to="/intervention" class="module-card card-intervention">
        <span class="card-icon">💊</span>
        <div class="card-text">
          <h3>智能干预处方</h3>
          <p>睡眠限制 · 刺激控制 · 认知重塑 · 放松训练</p>
        </div>
        <span class="card-arrow">→</span>
      </router-link>

      <router-link to="/report" class="module-card card-report">
        <span class="card-icon">📊</span>
        <div class="card-text">
          <h3>睡眠改善周报</h3>
          <p>每周数据总结 · 趋势分析 · 改善建议</p>
        </div>
        <span class="card-arrow">→</span>
      </router-link>

      <router-link to="/achievements" class="module-card card-achievements">
        <span class="card-icon">🏆</span>
        <div class="card-text">
          <h3>成就徽章</h3>
          <p>规律之星 · 早起勇士 · 效率达人</p>
        </div>
        <span class="card-arrow">→</span>
      </router-link>

      <router-link to="/community" class="module-card card-community">
        <span class="card-icon">👥</span>
        <div class="card-text">
          <h3>社区与打卡</h3>
          <p>匿名睡眠挑战营 · 还债日记话题圈</p>
        </div>
        <span class="card-arrow">→</span>
      </router-link>
    </div>

    <NotifySetting ref="notifyRef" />

    <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import request from '@/api/request';
import NotifySetting from '@/components/NotifySetting.vue';

const router = useRouter();
const notifyRef = ref(null);
const authStore = useAuthStore();
const toastMsg = ref('');
const dash = reactive({ latestScore: null, avgDuration: null, avgEfficiency: null });

async function loadDash() {
  const id = authStore.user?.id;
  if (!id) return;
  try {
    const res = await request.get('/dashboard/' + id);
    Object.assign(dash, res.data);
  } catch { /* ignore */ }
}

watch(() => authStore.user?.id, id => { if (id) loadDash(); }, { immediate: true });

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

function showToast(msg) {
  toastMsg.value = msg;
  setTimeout(() => { toastMsg.value = ''; }, 2000);
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: 0 1.2rem 3rem;
  text-align: center;
}

/* 用户状态栏 */
.user-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 0;
  margin-bottom: 0.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.user-avatar { font-size: 1.3rem; }

.user-name {
  font-size: 0.88rem;
  color: #555;
  font-weight: 500;
}

.admin-badge {
  font-size: 0.65rem;
  background: #722ed1;
  color: #fff;
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  font-weight: 600;
}

.btn-notify {
  padding: 0.35rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 14px;
  background: #fff;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-logout {
  padding: 0.35rem 0.9rem;
  border: 1px solid #ddd;
  border-radius: 14px;
  background: #fff;
  color: #999;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover { border-color: #ff4d4f; color: #ff4d4f; }

.btn-login, .btn-register-link {
  padding: 0.35rem 0.9rem;
  border-radius: 14px;
  font-size: 0.82rem;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-login {
  background: #4a6fa5;
  color: #fff;
  border: none;
}

.btn-register-link {
  border: 1px solid #4a6fa5;
  color: #4a6fa5;
  background: #fff;
}

.hero {
  margin-bottom: 1.2rem;
}

.stats-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 14px;
  padding: 0.7rem 0.4rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stat-val {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  color: #4a6fa5;
}

.stat-label {
  display: block;
  font-size: 0.65rem;
  color: #999;
  margin-top: 0.15rem;
}

.moon-icon {
  font-size: 3.5rem;
  margin-bottom: 0.5rem;
}

.home h1 {
  font-size: 2rem;
  color: #4a6fa5;
  margin-bottom: 0.3rem;
}

.subtitle {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 0.3rem;
}

.slogan {
  font-size: 0.85rem;
  color: #999;
  font-style: italic;
}

.module-cards {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.module-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.2rem;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.module-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(74,111,165,0.15);
}

.card-assessment { border-left: 4px solid #4a6fa5; }
.card-diary { border-left: 4px solid #52c41a; }
.card-intervention { border-left: 4px solid #722ed1; }
.card-report { border-left: 4px solid #13c2c2; }
.card-achievements { border-left: 4px solid #faad14; }
.card-community { border-left: 4px solid #13c2c2; }
.card-locked { border-left: 4px solid #d9d9d9; opacity: 0.6; }

.card-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.card-text {
  flex: 1;
}

.card-text h3 {
  font-size: 1rem;
  color: #333;
  margin-bottom: 0.2rem;
}

.card-text h3 small {
  font-size: 0.7rem;
  color: #bbb;
  font-weight: normal;
}

.card-text p {
  font-size: 0.78rem;
  color: #999;
  line-height: 1.4;
}

.card-arrow {
  font-size: 1.2rem;
  color: #4a6fa5;
  flex-shrink: 0;
}

.card-lock {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.75);
  color: #fff;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-size: 0.85rem;
  z-index: 100;
  animation: fadeInOut 2s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
