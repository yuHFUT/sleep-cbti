<template>
  <div class="diary-page">
    <div class="diary-header">
      <router-link to="/" class="btn-back-link">← 返回首页</router-link>
      <h1>📓 睡眠日记</h1>
      <p class="diary-date">{{ displayDate }}</p>
    </div>

    <!-- 日期选择器 -->
    <div class="date-picker">
      <button class="btn-date" @click="changeDate(-1)">◀ 前一天</button>
      <input type="date" :value="diaryDate" @change="onDateChange" class="input-date" />
      <button class="btn-date" @click="changeDate(1)">后一天 ▶</button>
    </div>

    <!-- 睡眠效率趋势小卡片 -->
    <div class="trend-card" v-if="trend.length > 0">
      <h3>📈 近7天睡眠效率趋势</h3>
      <div class="trend-bars">
        <div
          v-for="(item, idx) in trend"
          :key="idx"
          class="trend-bar-item"
          :class="{ today: item.diary_date === diaryDate }"
        >
          <div class="bar-fill-wrapper">
            <div
              class="bar-fill"
              :style="{ height: (item.sleep_efficiency || 0) + '%' }"
              :class="efficiencyClass(item.sleep_efficiency)"
            ></div>
          </div>
          <span class="bar-label">{{ formatShortDate(item.diary_date) }}</span>
          <span class="bar-value">{{ item.sleep_efficiency || '--' }}%</span>
        </div>
      </div>
    </div>

    <!-- 日记表单 -->
    <div class="diary-form">
      <!-- 上床时间 -->
      <div class="form-group">
        <label>🛌 上床时间</label>
        <div class="time-split">
          <select v-model="form.bedH" class="input-split">
            <option v-for="h in hours" :key="h" :value="h">{{ String(h).padStart(2,'0') }}</option>
          </select>
          <span class="time-colon">:</span>
          <select v-model="form.bedM" class="input-split">
            <option v-for="m in minutes" :key="m" :value="m">{{ String(m).padStart(2,'0') }}</option>
          </select>
        </div>
      </div>

      <!-- 熄灯时间 -->
      <div class="form-group">
        <label>💡 熄灯时间</label>
        <div class="time-split">
          <select v-model="form.lightsOffH" class="input-split">
            <option v-for="h in hours" :key="h" :value="h">{{ String(h).padStart(2,'0') }}</option>
          </select>
          <span class="time-colon">:</span>
          <select v-model="form.lightsOffM" class="input-split">
            <option v-for="m in minutes" :key="m" :value="m">{{ String(m).padStart(2,'0') }}</option>
          </select>
        </div>
        <span class="hint">关灯准备入睡的时间</span>
      </div>

      <!-- 入睡耗时（滑块） -->
      <div class="form-group slider-group">
        <label>⏱️ 入睡耗时</label>
        <div class="slider-value-display">
          <span class="big-value">{{ form.sleepLatency || 0 }}</span>
          <span class="unit">分钟</span>
        </div>
        <input
          type="range"
          v-model.number="form.sleepLatency"
          min="0"
          max="180"
          step="5"
          class="range-input"
        />
        <div class="slider-marks">
          <span>0</span><span>30</span><span>60</span><span>90</span><span>120+</span>
        </div>
        <p class="slider-desc">{{ latencyDesc }}</p>
      </div>

      <!-- 夜醒次数（滑块） -->
      <div class="form-group slider-group">
        <label>🌙 夜醒次数</label>
        <div class="slider-value-display">
          <span class="big-value">{{ form.nightAwakenings || 0 }}</span>
          <span class="unit">次</span>
        </div>
        <input
          type="range"
          v-model.number="form.nightAwakenings"
          min="0"
          max="10"
          step="1"
          class="range-input"
        />
        <div class="slider-marks">
          <span>0</span><span>2</span><span>4</span><span>6</span><span>8</span><span>10</span>
        </div>
      </div>

      <!-- 起床时间 -->
      <div class="form-group">
        <label>⏰ 起床时间</label>
        <div class="time-split">
          <select v-model="form.wakeH" class="input-split">
            <option v-for="h in hours" :key="h" :value="h">{{ String(h).padStart(2,'0') }}</option>
          </select>
          <span class="time-colon">:</span>
          <select v-model="form.wakeM" class="input-split">
            <option v-for="m in minutes" :key="m" :value="m">{{ String(m).padStart(2,'0') }}</option>
          </select>
        </div>
      </div>

      <!-- 日间精力评分（滑块） -->
      <div class="form-group slider-group">
        <label>⚡ 日间精力评分</label>
        <div class="slider-value-display">
          <span class="big-value">{{ form.daytimeEnergy || 5 }}</span>
          <span class="unit">/ 10 分</span>
        </div>
        <input
          type="range"
          v-model.number="form.daytimeEnergy"
          min="1"
          max="10"
          step="1"
          class="range-input energy-range"
        />
        <div class="energy-labels">
          <span>😴 很差</span>
          <span>😐 一般</span>
          <span>😊 很好</span>
        </div>
      </div>

      <!-- 备注 -->
      <div class="form-group">
        <label>📝 备注（选填）</label>
        <textarea
          v-model="form.notes"
          class="input-textarea"
          placeholder="今天有什么影响睡眠的事情？如：咖啡、运动、压力...…"
          rows="2"
        ></textarea>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="diary-footer">
      <button class="btn-save" @click="saveDiaryEntry" :disabled="saving">
        {{ saving ? '保存中...' : '💾 保存日记' }}
      </button>
    </div>

    <!-- 保存成功提示 -->
    <div v-if="showSuccess" class="toast-success">✅ 日记保存成功！</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { saveDiary, getDiary, getEfficiencyTrend } from '@/api/diary';

import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const userId = computed(() => authStore.user?.id);
const diaryDate = ref(todayStr());
const saving = ref(false);
const showSuccess = ref(false);
const trend = ref([]);

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = [0, 15, 30, 45];

const form = reactive({
  bedH: 22, bedM: 0,
  lightsOffH: 22, lightsOffM: 0,
  sleepLatency: 20,
  nightAwakenings: 0,
  wakeH: 8, wakeM: 0,
  daytimeEnergy: 5,
  notes: '',
});

function fmt(h, m) { return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }

const displayDate = computed(() => {
  const d = new Date(diaryDate.value);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
});

const latencyDesc = computed(() => {
  const v = form.sleepLatency;
  if (v <= 15) return '👍 入睡很快，非常好！';
  if (v <= 30) return '✅ 入睡时间正常';
  if (v <= 60) return '⚠️ 入睡偏慢，可尝试放松技巧';
  return '🔴 入睡困难，建议咨询干预方案';
});

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function efficiencyClass(val) {
  if (!val || val < 65) return 'bad';
  if (val < 75) return 'warn';
  if (val < 85) return 'fair';
  return 'good';
}

function changeDate(delta) {
  const d = new Date(diaryDate.value);
  d.setDate(d.getDate() + delta);
  diaryDate.value = d.toISOString().slice(0, 10);
}

function onDateChange(e) {
  diaryDate.value = e.target.value;
}

function parseTime(timeStr) {
  if (!timeStr) return [22, 0];
  const parts = timeStr.toString().split(':');
  const h = parseInt(parts[0]) || 22;
  const m = Math.round((parseInt(parts[1]) || 0) / 15) * 15;
  return m >= 60 ? [(h + 1) % 24, 0] : [h, m];
}

async function loadDiary() {
  try {
    const res = await getDiary(userId.value, diaryDate.value);
    if (res.data) {
      [form.bedH, form.bedM] = parseTime(res.data.bed_time);
      [form.lightsOffH, form.lightsOffM] = parseTime(res.data.lights_off_time);
      form.sleepLatency = res.data.sleep_latency || 20;
      form.nightAwakenings = res.data.night_awakenings || 0;
      [form.wakeH, form.wakeM] = parseTime(res.data.wake_up_time);
      form.daytimeEnergy = res.data.daytime_energy || 5;
      form.notes = res.data.notes || '';
    } else {
      resetForm();
    }
  } catch {
    resetForm();
  }
}

function resetForm() {
  form.bedH = 22; form.bedM = 0;
  form.lightsOffH = 22; form.lightsOffM = 0;
  form.sleepLatency = 20;
  form.nightAwakenings = 0;
  form.wakeH = 8; form.wakeM = 0;
  form.daytimeEnergy = 5;
  form.notes = '';
}

async function loadTrend() {
  try {
    const res = await getEfficiencyTrend(userId.value, 7);
    trend.value = res.data || [];
  } catch {
    trend.value = [];
  }
}

async function saveDiaryEntry() {
  saving.value = true;
  try {
    await saveDiary(userId.value, {
      diaryDate: diaryDate.value,
      bedTime: fmt(form.bedH, form.bedM),
      lightsOffTime: fmt(form.lightsOffH, form.lightsOffM),
      sleepLatency: form.sleepLatency,
      nightAwakenings: form.nightAwakenings,
      wakeUpTime: fmt(form.wakeH, form.wakeM),
      daytimeEnergy: form.daytimeEnergy,
      notes: form.notes || null,
    });
    showSuccess.value = true;
    setTimeout(() => { showSuccess.value = false; }, 2000);
    loadTrend();
  } catch {
    alert('保存失败，请重试');
  } finally {
    saving.value = false;
  }
}

watch(diaryDate, () => {
  loadDiary();
});

onMounted(() => {
  loadDiary();
  loadTrend();
});
</script>

<style scoped>
.diary-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 100px;
}

.diary-header {
  padding: 1.5rem 1.2rem 0.5rem;
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

.diary-header h1 {
  font-size: 1.3rem;
}

.diary-date {
  font-size: 0.85rem;
  opacity: 0.8;
  margin-top: 0.2rem;
}

.date-picker {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  background: #fff;
  margin: 0.8rem 1.2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.btn-date {
  padding: 0.4rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
  font-size: 0.8rem;
  cursor: pointer;
  color: #666;
}

.input-date {
  padding: 0.4rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  text-align: center;
}

/* 趋势卡片 */
.trend-card {
  background: #fff;
  margin: 0 1.2rem 0.8rem;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.trend-card h3 {
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.8rem;
}

.trend-bars {
  display: flex;
  gap: 0.5rem;
  justify-content: space-around;
  align-items: flex-end;
  height: 100px;
}

.trend-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.trend-bar-item.today .bar-fill {
  opacity: 1;
  box-shadow: 0 0 8px rgba(74,111,165,0.4);
}

.bar-fill-wrapper {
  width: 100%;
  height: 60px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar-fill {
  width: 22px;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.5s;
  opacity: 0.8;
}

.bar-fill.good { background: #52c41a; }
.bar-fill.fair { background: #faad14; }
.bar-fill.warn { background: #ff7a45; }
.bar-fill.bad { background: #f5222d; }

.bar-label {
  font-size: 0.65rem;
  color: #999;
  margin-top: 0.3rem;
}

.bar-value {
  font-size: 0.7rem;
  font-weight: 600;
  color: #333;
}

/* 表单 */
.diary-form {
  padding: 0 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.form-group {
  background: #fff;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.form-group label {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.6rem;
}

.input-field {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.input-field:focus {
  border-color: #4a6fa5;
}

.input-select {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1.1rem;
  outline: none;
  background: #fff;
  transition: border-color 0.2s;
  appearance: auto;
  -webkit-appearance: auto;
}

.input-select:focus { border-color: #4a6fa5; }

.time-split {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.input-split {
  padding: 0.55rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  outline: none;
  background: #fff;
  transition: border-color 0.2s;
  text-align: center;
  flex: 1;
  appearance: auto;
  -webkit-appearance: auto;
}

.input-split:focus { border-color: #4a6fa5; }

.time-colon {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4a6fa5;
  flex-shrink: 0;
}

.hint {
  display: block;
  font-size: 0.75rem;
  color: #bbb;
  margin-top: 0.3rem;
}

/* 滑块组 */
.slider-group {
  padding-bottom: 0.5rem;
}

.slider-value-display {
  text-align: center;
  margin-bottom: 0.5rem;
}

.big-value {
  font-size: 2.2rem;
  font-weight: 700;
  color: #4a6fa5;
}

.unit {
  font-size: 0.9rem;
  color: #999;
  margin-left: 0.2rem;
}

.range-input {
  width: 100%;
  -webkit-appearance: none;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #52c41a, #faad14, #ff7a45, #f5222d);
  outline: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #4a6fa5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  cursor: pointer;
}

.energy-range {
  background: linear-gradient(to right, #f5222d, #faad14, #52c41a);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #ccc;
  margin-top: 0.3rem;
}

.energy-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #999;
  margin-top: 0.4rem;
}

.slider-desc {
  text-align: center;
  font-size: 0.82rem;
  margin-top: 0.4rem;
  color: #4a6fa5;
  font-weight: 500;
}

.input-textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
}

.input-textarea:focus {
  border-color: #4a6fa5;
}

.diary-footer {
  padding: 1rem 1.2rem;
}

.btn-save {
  width: 100%;
  padding: 0.85rem;
  background: linear-gradient(135deg, #4a6fa5, #6b8fc5);
  color: #fff;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toast-success {
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
