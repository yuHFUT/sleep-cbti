<template>
  <div class="sleep-restriction">
    <!-- 未就绪状态 -->
    <div v-if="!data.ready" class="not-ready">
      <div class="nr-icon">📊</div>
      <h3>数据收集中</h3>
      <p>{{ data.message }}</p>
      <router-link to="/diary" class="btn-to-diary">📓 去记录睡眠日记</router-link>
    </div>

    <!-- 处方 -->
    <div v-else>
      <!-- 效率概览 -->
      <div class="efficiency-card" :class="efficiencyClass">
        <span class="eff-icon">{{ efficiencyIcon }}</span>
        <div class="eff-info">
          <span class="eff-value">{{ data.avgEfficiency }}%</span>
          <span class="eff-label">平均睡眠效率</span>
        </div>
        <span class="eff-level">{{ data.efficiencyLevel }}</span>
      </div>

      <!-- 时间窗对比 -->
      <div class="window-compare">
        <div class="window-card current">
          <h4>📋 当前卧床</h4>
          <div class="time-range">
            <span class="time">{{ data.currentWindow.bedTime }}</span>
            <span class="arrow">→</span>
            <span class="time">{{ data.currentWindow.wakeTime }}</span>
          </div>
          <span class="duration">共 {{ data.currentWindow.timeInBed }}</span>
        </div>

        <div class="window-card suggested" v-if="data.avgEfficiency < 85">
          <h4>🎯 建议调整</h4>
          <div class="time-range">
            <span class="time highlight">{{ data.suggestedWindow.bedTime }}</span>
            <span class="arrow">→</span>
            <span class="time highlight">{{ data.suggestedWindow.wakeTime }}</span>
          </div>
          <span class="duration">共 {{ data.suggestedWindow.timeInBed }}</span>
          <p class="tip">{{ data.suggestedWindow.tip }}</p>
        </div>

        <div class="window-card good" v-else>
          <h4>✅ 保持当前作息</h4>
          <p class="tip">{{ data.suggestedWindow.tip }}</p>
        </div>
      </div>

      <!-- 效率趋势曲线 -->
      <div class="trend-section">
        <h3>📈 睡眠效率提升曲线</h3>
        <div class="trend-chart">
          <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="efficiency-chart">
            <!-- 参考线 -->
            <line x1="0" :y1="y(85)" :x2="chartW" :y2="y(85)" stroke="#52c41a" stroke-dasharray="4,4" stroke-width="1" />
            <text :x="chartW - 30" :y="y(85) - 5" font-size="10" fill="#52c41a">85%目标</text>

            <!-- 折线 -->
            <polyline
              :points="linePoints"
              fill="none"
              stroke="#4a6fa5"
              stroke-width="2.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />

            <!-- 数据点 -->
            <circle
              v-for="(pt, i) in chartPoints"
              :key="i"
              :cx="pt.x"
              :cy="pt.y"
              r="4"
              fill="#fff"
              stroke="#4a6fa5"
              stroke-width="2"
            />

            <!-- 日期标签 -->
            <text
              v-for="(pt, i) in chartPoints"
              :key="'d-' + i"
              :x="pt.x"
              :y="chartH - 5"
              text-anchor="middle"
              font-size="9"
              fill="#999"
            >{{ formatDate(pt.date) }}</text>

            <!-- 效率值标签 -->
            <text
              v-for="(pt, i) in chartPoints"
              :key="'v-' + i"
              :x="pt.x"
              :y="pt.y - 10"
              text-anchor="middle"
              font-size="10"
              :fill="pt.val >= 85 ? '#52c41a' : '#ff7a45'"
              font-weight="600"
            >{{ pt.val }}%</text>
          </svg>
        </div>
      </div>

      <!-- 数据摘要 -->
      <div class="data-summary">
        <div class="ds-item">
          <span class="ds-val">{{ Math.round(data.avgSleepDuration) }}分钟</span>
          <span class="ds-label">平均实际睡眠</span>
        </div>
        <div class="ds-item">
          <span class="ds-val">{{ data.avgLatency }}分钟</span>
          <span class="ds-label">平均入睡耗时</span>
        </div>
        <div class="ds-item">
          <span class="ds-val">{{ Math.round(data.avgTimeInBed) }}分钟</span>
          <span class="ds-label">平均卧床时间</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getSleepRestriction } from '@/api/intervention';

const props = defineProps({ userId: String });
const data = ref({ ready: false });
const loading = ref(true);

const chartW = 320;
const chartH = 160;
const padding = { top: 25, right: 10, bottom: 20, left: 10 };

const efficiencyClass = computed(() => {
  const v = data.value.avgEfficiency;
  if (v >= 85) return 'good';
  if (v >= 75) return 'fair';
  if (v >= 65) return 'warn';
  return 'bad';
});

const efficiencyIcon = computed(() => {
  const v = data.value.avgEfficiency;
  if (v >= 85) return '✅';
  if (v >= 75) return '⚠️';
  return '🔴';
});

const chartPoints = computed(() => {
  if (!data.value.efficiencyTrend) return [];
  return data.value.efficiencyTrend.map((d, i) => ({
    x: padding.left + (i / Math.max(data.value.efficiencyTrend.length - 1, 1)) * (chartW - padding.left - padding.right),
    y: y(d.efficiency),
    val: d.efficiency,
    date: d.date,
  }));
});

const linePoints = computed(() => {
  return chartPoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

function y(val) {
  return chartH - padding.bottom - (val / 100) * (chartH - padding.top - padding.bottom);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(5); // MM-DD
}

onMounted(async () => {
  try {
    const res = await getSleepRestriction(props.userId);
    data.value = res.data;
  } catch { /* ignore */ }
  loading.value = false;
});
</script>

<style scoped>
.sleep-restriction { min-height: 200px; }

.not-ready {
  text-align: center;
  padding: 3rem 1rem;
}

.nr-icon { font-size: 3rem; margin-bottom: 1rem; }

.not-ready h3 { color: #333; margin-bottom: 0.5rem; }

.not-ready p { color: #999; font-size: 0.85rem; line-height: 1.5; margin-bottom: 1.5rem; }

.btn-to-diary {
  display: inline-block;
  padding: 0.6rem 1.5rem;
  background: #4a6fa5;
  color: #fff;
  border-radius: 20px;
  text-decoration: none;
  font-size: 0.9rem;
}

.efficiency-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.2rem;
  border-radius: 14px;
  margin-bottom: 1rem;
}

.efficiency-card.good { background: #f0fff0; border: 1px solid #b7eb8f; }
.efficiency-card.fair { background: #fffbe6; border: 1px solid #ffe58f; }
.efficiency-card.warn { background: #fff2e8; border: 1px solid #ffbb96; }
.efficiency-card.bad { background: #fff1f0; border: 1px solid #ffa39e; }

.eff-icon { font-size: 1.8rem; }
.eff-info { flex: 1; }
.eff-value { font-size: 2rem; font-weight: 700; color: #333; display: block; }
.eff-label { font-size: 0.78rem; color: #999; }
.eff-level { font-weight: 600; font-size: 0.85rem; color: #666; }

.window-compare { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.2rem; }

.window-card {
  padding: 1rem 1.2rem;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.window-card.suggested {
  border-left: 4px solid #4a6fa5;
  background: #f8f9ff;
}

.window-card.good {
  border-left: 4px solid #52c41a;
  background: #f0fff0;
}

.window-card h4 { font-size: 0.9rem; color: #333; margin-bottom: 0.6rem; }

.time-range {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.4rem;
}

.time {
  font-size: 1.8rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: #666;
}

.time.highlight {
  color: #4a6fa5;
  background: #e8f0fe;
  padding: 0.3rem 0.8rem;
  border-radius: 8px;
}

.arrow { font-size: 1.2rem; color: #bbb; }

.duration { display: block; text-align: center; font-size: 0.8rem; color: #999; }

.tip { text-align: center; font-size: 0.82rem; color: #4a6fa5; margin-top: 0.5rem; line-height: 1.5; }

.trend-section {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.trend-section h3 { font-size: 0.95rem; color: #333; margin-bottom: 0.6rem; }

.trend-chart { overflow-x: auto; }

.efficiency-chart { display: block; width: 100%; min-width: 320px; }

.data-summary {
  display: flex;
  gap: 0.5rem;
}

.ds-item {
  flex: 1;
  text-align: center;
  padding: 0.8rem 0.4rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.ds-val { display: block; font-size: 1.1rem; font-weight: 700; color: #4a6fa5; }
.ds-label { display: block; font-size: 0.7rem; color: #999; margin-top: 0.2rem; }

.loading { text-align: center; padding: 2rem; color: #999; }
</style>
