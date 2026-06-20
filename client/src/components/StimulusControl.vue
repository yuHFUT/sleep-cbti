<template>
  <div class="stimulus-control">
    <!-- 指令卡片 -->
    <div class="card-main" v-if="card">
      <div class="card-badge">第 {{ card.dayIndex + 1 }} 天 / 共 {{ card.totalCards }} 条</div>
      <div class="card-icon-large">{{ card.icon }}</div>
      <h2>{{ card.title }}</h2>
      <p class="card-content">{{ card.content }}</p>

      <div class="challenge-box">
        <span class="challenge-icon">🎯</span>
        <p>{{ card.challenge }}</p>
      </div>

      <button
        class="btn-checkin"
        :class="{ checked: isCheckedIn }"
        :disabled="isCheckedIn"
        @click="doCheckIn"
      >
        {{ isCheckedIn ? '✅ 今日已打卡' : '✊ 完成打卡' }}
      </button>
    </div>

    <!-- 打卡记录 -->
    <div class="checkin-history" v-if="card">
      <h3>📅 本周刺激控制打卡</h3>
      <div class="week-dots">
        <span
          v-for="(day, di) in weekDays"
          :key="di"
          class="week-dot"
          :class="{ done: di < card.dayIndex || isCheckedIn, today: di === card.dayIndex && !isCheckedIn }"
        >
          <span class="dot-circle">{{ di < card.dayIndex || (di === card.dayIndex && isCheckedIn) ? '✅' : di === card.dayIndex ? '📍' : '○' }}</span>
          <span class="dot-label">{{ day }}</span>
        </span>
      </div>
    </div>

    <div v-if="showToast" class="toast">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getStimulusCard, checkInStimulus } from '@/api/intervention';

const props = defineProps({ userId: String });
const card = ref(null);
const isCheckedIn = ref(false);
const toastMsg = ref('');
const showToast = ref(false);

const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

async function loadCard() {
  try {
    const res = await getStimulusCard(props.userId);
    card.value = res.data;
    isCheckedIn.value = res.data.isCheckedIn;
  } catch { /* ignore */ }
}

async function doCheckIn() {
  try {
    const res = await checkInStimulus(props.userId);
    isCheckedIn.value = true;
    toastMsg.value = res.message;
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 2000);
  } catch {
    alert('打卡失败');
  }
}

onMounted(loadCard);
</script>

<style scoped>
.stimulus-control { position: relative; min-height: 200px; }

.card-main {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  position: relative;
  overflow: hidden;
}

.card-badge {
  display: inline-block;
  background: #e8f0fe;
  color: #4a6fa5;
  padding: 0.25rem 0.8rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.card-icon-large { font-size: 3.5rem; margin-bottom: 0.5rem; }

.card-main h2 {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 0.8rem;
}

.card-content {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.7;
  margin-bottom: 1.2rem;
}

.challenge-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #f8f9ff;
  border-radius: 10px;
  padding: 0.8rem;
  margin-bottom: 1.2rem;
  text-align: left;
}

.challenge-icon { font-size: 1.2rem; flex-shrink: 0; }

.challenge-box p { font-size: 0.85rem; color: #555; line-height: 1.5; }

.btn-checkin {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, #4a6fa5, #6b8fc5);
  color: #fff;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-checkin.checked {
  background: #d9f7be;
  color: #389e0d;
  cursor: default;
}

.btn-checkin:disabled { cursor: default; }

.checkin-history {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.checkin-history h3 { font-size: 0.9rem; color: #333; margin-bottom: 0.8rem; }

.week-dots {
  display: flex;
  justify-content: space-around;
}

.week-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.dot-circle { font-size: 1.3rem; }

.dot-circle .done { color: #52c41a; }

.week-dot.today .dot-circle { color: #4a6fa5; }

.dot-label { font-size: 0.7rem; color: #999; }

.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #52c41a;
  color: #fff;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  z-index: 100;
  animation: fadeInOut 2s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  20% { opacity: 1; transform: translateX(-50%) translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
