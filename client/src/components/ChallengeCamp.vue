<template>
  <div class="challenge-camp">
    <!-- 未加入状态 - 营地选择 -->
    <div v-if="!myCamp.joined" class="camp-select">
      <div class="section-intro">
        <span class="intro-icon">🏕️</span>
        <p>选择一个适合你作息的挑战营，和匿名的伙伴们一起坚持固定作息。</p>
      </div>

      <div class="camp-cards">
        <div v-for="camp in camps" :key="camp.id" class="camp-card" @click="doJoin(camp.id)">
          <div class="camp-card-top">
            <span class="camp-icon">{{ camp.icon }}</span>
            <div class="camp-info">
              <h3>{{ camp.name }}</h3>
              <p>{{ camp.description }}</p>
            </div>
            <span class="camp-difficulty" :class="camp.difficulty === '进阶' ? 'hard' : 'easy'">{{ camp.difficulty }}</span>
          </div>
          <div class="camp-card-bottom">
            <span class="camp-time">{{ camp.timeInBed }}</span>
            <span class="camp-join-hint">点击加入 →</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 已加入状态 - 营地主页 -->
    <div v-else class="camp-main">
      <!-- 我的营地信息 -->
      <div class="my-camp-card">
        <div class="mcc-top">
          <span class="mcc-icon">{{ myCamp.camp?.icon }}</span>
          <div class="mcc-info">
            <h2>{{ myCamp.camp?.name }}</h2>
            <p>{{ myCamp.camp?.description }}</p>
          </div>
        </div>
        <div class="mcc-stats">
          <div class="mcc-stat-item">
            <span class="mcc-stat-val">{{ myCamp.streak || 0 }}天</span>
            <span class="mcc-stat-label">连续打卡</span>
          </div>
          <div class="mcc-stat-item">
            <span class="mcc-stat-val">{{ myCamp.camp?.timeInBed }}</span>
            <span class="mcc-stat-label">目标作息</span>
          </div>
          <div class="mcc-stat-item">
            <span class="mcc-stat-val">{{ myCamp.todayCheckedIn ? '✅' : '○' }}</span>
            <span class="mcc-stat-label">今日打卡</span>
          </div>
        </div>
      </div>

      <!-- 打卡按钮 -->
      <button
        class="btn-checkin-camp"
        :class="{ done: myCamp.todayCheckedIn }"
        :disabled="myCamp.todayCheckedIn"
        @click="doCheckIn"
      >
        {{ myCamp.todayCheckedIn ? '✅ 今日已打卡' : '✊ 今日打卡' }}
      </button>

      <!-- 群体统计（签到率） -->
      <div class="group-stats-card">
        <h3>📊 今日挑战营概览</h3>
        <div class="gs-row">
          <div class="gs-item">
            <span class="gs-val">{{ stats.memberCount || '--' }}</span>
            <span class="gs-label">营员</span>
          </div>
          <div class="gs-item">
            <span class="gs-val">{{ stats.todayCheckinCount != null ? stats.todayCheckinCount : '--' }}</span>
            <span class="gs-label">今日打卡</span>
          </div>
          <div class="gs-item">
            <span class="gs-val">{{ stats.todayCheckinRate != null ? stats.todayCheckinRate + '%' : '--' }}</span>
            <span class="gs-label">今日签到率</span>
          </div>
          <div class="gs-item">
            <span class="gs-val">{{ stats.weightedCheckinRate != null ? stats.weightedCheckinRate + '%' : '--' }}</span>
            <span class="gs-label">综合签到率</span>
          </div>
        </div>
        <p class="gs-message">{{ stats.groupMessage }}</p>
      </div>

      <!-- 连续打卡光荣榜（匿名） -->
      <div v-if="stats.topStreaks?.length" class="streak-board">
        <h3>🔥 连续打卡光荣榜</h3>
        <div class="streak-list">
          <div v-for="(s, i) in stats.topStreaks" :key="i" class="streak-item">
            <span class="streak-rank">{{ ['🥇','🥈','🥉','4️⃣','5️⃣'][i] }}</span>
            <span class="streak-text">{{ s.label }}</span>
          </div>
        </div>
        <p class="streak-note">* 所有数据匿名展示，不透露个人信息</p>
      </div>

      <!-- 退出按钮 -->
      <button class="btn-leave" @click="doLeave">退出当前挑战营</button>
    </div>

    <div v-if="showToast" class="toast">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import {
  getCampList, getMyCamp, joinCamp, checkInCamp, getCampStats, leaveCamp,
} from '@/api/community';

const props = defineProps({ userId: String });

const camps = ref([]);
const myCamp = reactive({ joined: false, camp: null, streak: 0, todayCheckedIn: false });
const stats = reactive({ memberCount: 0, todayCheckinCount: 0, todayCheckinRate: null, weightedCheckinRate: null, groupMessage: '', topStreaks: [] });
const toastMsg = ref('');
const showToast = ref(false);

function showMsg(msg) {
  toastMsg.value = msg;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 2500);
}

async function loadCamps() { try { const res = await getCampList(); camps.value = res.data || []; } catch {} }

async function loadMyCamp() {
  try {
    const res = await getMyCamp(props.userId);
    Object.assign(myCamp, { joined: false, camp: null, streak: 0, todayCheckedIn: false });
    if (res.data?.joined) {
      Object.assign(myCamp, res.data);
    }
  } catch {}
}

async function loadStats() {
  if (!myCamp.camp?.id) return;
  try {
    const res = await getCampStats(myCamp.camp.id);
    Object.assign(stats, res.data || {});
  } catch {}
}

async function doJoin(campId) {
  try {
    const res = await joinCamp(props.userId, campId);
    showMsg(res.message);
    await loadMyCamp();
    await loadStats();
  } catch (err) { showMsg(err.response?.data?.message || '加入失败'); }
}

async function doCheckIn() {
  try {
    const res = await checkInCamp(props.userId);
    myCamp.todayCheckedIn = true;
    myCamp.streak = res.data.myStreak || 1;
    showMsg(res.data.groupMessage || res.message);
    await loadStats();
  } catch (err) { showMsg(err.response?.data?.message || '打卡失败'); }
}

async function doLeave() {
  try {
    const res = await leaveCamp(props.userId);
    showMsg(res.message);
    Object.assign(myCamp, { joined: false, camp: null, streak: 0, todayCheckedIn: false });
  } catch {}
}

onMounted(async () => {
  await Promise.all([loadCamps(), loadMyCamp()]);
  if (myCamp.joined) await loadStats();
});
</script>

<style scoped>
.challenge-camp { min-height: 200px; position: relative; }

.section-intro {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #f0fdfd;
  border-radius: 10px;
  padding: 0.8rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #555;
  line-height: 1.5;
}

.intro-icon { font-size: 1.5rem; flex-shrink: 0; }

.camp-cards { display: flex; flex-direction: column; gap: 0.7rem; }

.camp-card {
  background: #fff;
  border-radius: 14px;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.2s;
}

.camp-card:hover { box-shadow: 0 4px 16px rgba(19,194,194,0.15); transform: translateY(-1px); }

.camp-card-top {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.6rem;
}

.camp-icon { font-size: 1.8rem; }
.camp-info { flex: 1; }
.camp-info h3 { font-size: 0.95rem; color: #333; }
.camp-info p { font-size: 0.75rem; color: #999; }

.camp-difficulty {
  font-size: 0.68rem;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-weight: 600;
}

.camp-difficulty.easy { background: #e6fffb; color: #13c2c2; }
.camp-difficulty.hard { background: #fff7e6; color: #fa8c16; }

.camp-card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.camp-time { font-size: 0.78rem; color: #666; font-weight: 500; }
.camp-join-hint { font-size: 0.78rem; color: #13c2c2; font-weight: 600; }

/* 已加入 */
.my-camp-card {
  background: linear-gradient(135deg, #13c2c2, #36cfc9);
  border-radius: 16px;
  padding: 1.2rem;
  color: #fff;
  margin-bottom: 0.8rem;
}

.mcc-top {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.8rem;
}

.mcc-icon { font-size: 2rem; }
.mcc-info h2 { font-size: 1.1rem; }
.mcc-info p { font-size: 0.78rem; opacity: 0.85; }

.mcc-stats {
  display: flex;
  gap: 0.5rem;
}

.mcc-stat-item {
  flex: 1;
  text-align: center;
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
  padding: 0.5rem 0.3rem;
}

.mcc-stat-val { display: block; font-size: 1.1rem; font-weight: 700; }
.mcc-stat-label { font-size: 0.68rem; opacity: 0.8; }

.btn-checkin-camp {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, #13c2c2, #36cfc9);
  color: #fff;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 0.8rem;
  transition: all 0.2s;
}

.btn-checkin-camp.done {
  background: #d9f7be;
  color: #389e0d;
  cursor: default;
}

.btn-checkin-camp:disabled { cursor: default; }

.group-stats-card {
  background: #fff;
  border-radius: 14px;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 0.8rem;
}

.group-stats-card h3 { font-size: 0.9rem; color: #333; margin-bottom: 0.6rem; }

.gs-row { display: flex; gap: 0.4rem; margin-bottom: 0.6rem; }

.gs-item {
  flex: 1;
  text-align: center;
  padding: 0.5rem 0.2rem;
  background: #f9fafb;
  border-radius: 8px;
}

.gs-val { display: block; font-size: 1.1rem; font-weight: 700; color: #13c2c2; }
.gs-label { font-size: 0.68rem; color: #999; }

.gs-message {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.5;
  text-align: center;
}

.streak-board {
  background: #fff;
  border-radius: 14px;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 0.8rem;
}

.streak-board h3 { font-size: 0.9rem; color: #333; margin-bottom: 0.5rem; }

.streak-list { display: flex; flex-direction: column; gap: 0.3rem; }

.streak-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: #555;
}

.streak-rank { font-size: 1rem; }
.streak-note { font-size: 0.68rem; color: #bbb; margin-top: 0.4rem; text-align: center; }

.btn-leave {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 25px;
  background: #fff;
  color: #999;
  font-size: 0.85rem;
  cursor: pointer;
}

.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #13c2c2;
  color: #fff;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
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
