<template>
  <div class="report-page">
    <div class="report-header">
      <router-link to="/" class="btn-back-link">← 返回首页</router-link>
      <h1>📊 睡眠改善周报</h1>
      <div class="week-picker">
        <button class="btn-week" @click="prevWeek">◀</button>
        <span class="week-range">{{ displayWeekRange }}</span>
        <button class="btn-week" @click="nextWeek" :disabled="isCurrentWeek">▶</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="!report.ready" class="not-ready">
      <span class="nr-icon">📭</span>
      <p>{{ report.message || '本周暂无数据' }}</p>
      <router-link to="/diary" class="btn-to-diary">📓 去记录睡眠日记</router-link>
    </div>

    <div v-else>
      <!-- 评级 -->
      <div class="rating-card" :style="{ borderColor: report.rating.color }">
        <span class="rating-emoji">{{ report.rating.emoji }}</span>
        <div class="rating-info">
          <span class="rating-level" :style="{ color: report.rating.color }">{{ report.rating.level }}</span>
          <span class="rating-score">综合评分 {{ report.rating.score }} 分</span>
        </div>
      </div>

      <section class="section">
        <h3>🔑 关键指标</h3>
        <div class="metrics-grid">
          <div class="metric-item">
            <span class="metric-val">{{ report.current.avgEfficiency }}%</span>
            <span class="metric-label">睡眠效率</span>
          </div>
          <div class="metric-item">
            <span class="metric-val">{{ report.current.avgLatency }}分钟</span>
            <span class="metric-label">入睡耗时</span>
          </div>
          <div class="metric-item">
            <span class="metric-val">{{ report.current.avgEnergy }}/10</span>
            <span class="metric-label">日间精力</span>
          </div>
          <div class="metric-item">
            <span class="metric-val">{{ report.current.diaryCount }}天</span>
            <span class="metric-label">记录天数</span>
          </div>
        </div>
      </section>

      <section class="section" v-if="report.highlights?.length">
        <h3>✨ 亮点</h3>
        <div v-for="(h, i) in report.highlights" :key="i" class="highlight-item">
          <span class="hi-icon">{{ h.icon }}</span> {{ h.text }}
        </div>
      </section>

      <section class="section">
        <h3>💡 建议</h3>
        <div v-for="(s, i) in report.suggestions" :key="i" class="suggestion-item">
          <span class="si-dot">{{ i + 1 }}</span> {{ s }}
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import request from '@/api/request';

const authStore = useAuthStore();
const loading = ref(false);
const report = ref({ ready: false });
const weekOffset = ref(0);

const displayWeekRange = computed(() => {
  const { start, end } = getWeekDates(weekOffset.value);
  return `${start} ~ ${end}`;
});
const isCurrentWeek = computed(() => weekOffset.value >= 0);

function getWeekDates(offset) {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);
  const dow = now.getDay();
  const monOff = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(now);
  mon.setDate(now.getDate() + monOff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) };
}

function prevWeek() { weekOffset.value--; doLoad(); }
function nextWeek() { if (!isCurrentWeek.value) { weekOffset.value++; doLoad(); } }

async function doLoad() {
  const id = authStore.user?.id;
  if (!id) return;
  loading.value = true;
  try {
    const { start, end } = getWeekDates(weekOffset.value);
    const res = await request.get('/report/weekly/' + id, { params: { weekStart: start, weekEnd: end } });
    report.value = res.data || { ready: false };
  } catch(e) {
    report.value = { ready: false, message: '加载失败' };
    console.error(e);
  }
  loading.value = false;
}

watch(() => authStore.user?.id, id => { if (id) doLoad(); }, { immediate: true });
</script>

<style scoped>
.report-page { min-height: 100vh; background: #f5f7fa; padding-bottom: 30px; }
.report-header { padding: 1.5rem 1.2rem 1rem; background: linear-gradient(135deg, #4a6fa5, #6b8fc5); color: #fff; text-align: center; }
.btn-back-link { display: inline-block; color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.85rem; margin-bottom: 0.5rem; }
.report-header h1 { font-size: 1.3rem; }
.week-picker { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 0.6rem; }
.btn-week { background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 0.3rem 0.7rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; }
.btn-week:disabled { opacity: 0.3; }
.week-range { font-size: 0.85rem; min-width: 180px; }
.loading, .not-ready { text-align: center; padding: 3rem; color: #999; }
.nr-icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }
.btn-to-diary { display: inline-block; padding: 0.6rem 1.5rem; background: #4a6fa5; color: #fff; border-radius: 20px; text-decoration: none; margin-top: 1rem; }
.rating-card { display: flex; align-items: center; gap: 0.8rem; margin: 0.8rem 1.2rem; padding: 1.2rem; background: #fff; border-radius: 14px; border-left: 6px solid #4a6fa5; }
.rating-emoji { font-size: 2.5rem; }
.rating-level { font-size: 1.4rem; font-weight: 700; display: block; }
.rating-score { font-size: 0.82rem; color: #999; }
.section { margin: 0.8rem 1.2rem; background: #fff; border-radius: 14px; padding: 1rem; }
.section h3 { font-size: 0.95rem; margin-bottom: 0.6rem; }
.metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
.metric-item { text-align: center; padding: 0.8rem; background: #f9fafb; border-radius: 10px; }
.metric-val { display: block; font-size: 1.3rem; font-weight: 700; }
.metric-label { font-size: 0.75rem; color: #999; }
.highlight-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #555; padding: 0.3rem 0; }
.hi-icon { flex-shrink: 0; }
.suggestion-item { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.85rem; color: #555; padding: 0.3rem 0; }
.si-dot { width: 20px; height: 20px; border-radius: 50%; background: #e8f0fe; color: #4a6fa5; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
</style>
