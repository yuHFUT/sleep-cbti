<template>
  <div class="report-page">
    <div class="report-header">
      <button class="btn-back" @click="$emit('back')">← 返回</button>
      <h1>📈 我的睡眠评估报告</h1>
      <p class="report-date">{{ reportDate }}</p>
    </div>

    <!-- 睡眠六维图 -->
    <section class="report-section">
      <h2>🔍 我的睡眠六维图</h2>
      <p class="section-desc">分数越高越好（0-100分），反映您的睡眠综合状况</p>
      <RadarChart :data="reportData.radarData" />
    </section>

    <!-- 量表结果概览 -->
    <section class="report-section">
      <h2>📊 三大量表结果</h2>

      <div class="result-cards">
        <div class="result-card" :class="psqiClass">
          <div class="rc-header">
            <span class="rc-icon">📊</span>
            <span class="rc-name">PSQI</span>
          </div>
          <div class="rc-score">{{ reportData.psqi?.totalScore }} <small>/ 21</small></div>
          <div class="rc-level">{{ psqiLevel }}</div>
        </div>

        <div class="result-card" :class="shpsClass">
          <div class="rc-header">
            <span class="rc-icon">🛏️</span>
            <span class="rc-name">SHPS</span>
          </div>
          <div class="rc-score">{{ reportData.shps?.totalScore }} <small>/ 133</small></div>
          <div class="rc-level">{{ shpsLevel }}</div>
        </div>

        <div class="result-card" :class="dbas16Class">
          <div class="rc-header">
            <span class="rc-icon">🧠</span>
            <span class="rc-name">DBAS-16</span>
          </div>
          <div class="rc-score">{{ reportData.dbas16?.averageScore }} <small>/ 10</small></div>
          <div class="rc-level">{{ dbas16Level }}</div>
        </div>
      </div>
    </section>

    <!-- 综合评估 -->
    <section class="report-section">
      <h2>📝 综合评估</h2>
      <div class="summary-box">
        <p>{{ reportData.summary }}</p>
      </div>
    </section>

    <!-- 干预策略推荐 -->
    <section class="report-section">
      <h2>💡 干预策略推荐</h2>
      <div class="intervention-list">
        <div
          v-for="(item, idx) in reportData.interventions"
          :key="idx"
          class="intervention-card"
          :class="'priority-' + item.priority"
        >
          <div class="int-header">
            <span class="int-priority" :class="item.priority">
              {{ item.priority === 'high' ? '优先推荐' : item.priority === 'medium' ? '建议尝试' : '可选' }}
            </span>
            <span class="int-type">{{ getInterventionIcon(item.type) }}</span>
          </div>
          <h4>{{ item.name }}</h4>
          <p>{{ item.reason }}</p>
        </div>
      </div>
    </section>

    <!-- 行动按钮 -->
    <div class="report-actions">
      <button class="btn-primary" @click="goToIntervention">🎯 查看详细干预方案</button>
      <button class="btn-secondary" @click="goToDiary">📓 开始记录睡眠日记</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import RadarChart from '@/components/RadarChart.vue';

const props = defineProps({
  reportData: { type: Object, required: true },
});

defineEmits(['back']);
const router = useRouter();

const reportDate = computed(() => new Date().toLocaleDateString('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric',
}));

const psqiLevel = computed(() => {
  const s = props.reportData.psqi?.totalScore;
  if (s <= 5) return '睡眠质量很好';
  if (s <= 10) return '睡眠质量还行';
  if (s <= 15) return '睡眠质量一般';
  return '睡眠质量很差';
});
const psqiClass = computed(() => {
  const s = props.reportData.psqi?.totalScore;
  if (s <= 5) return 'good';
  if (s <= 10) return 'fair';
  if (s <= 15) return 'warn';
  return 'bad';
});

const shpsLevel = computed(() => {
  const s = props.reportData.shps?.totalScore;
  if (s <= 33) return '习惯良好';
  if (s <= 66) return '习惯一般';
  if (s <= 99) return '习惯较差';
  return '习惯很差';
});
const shpsClass = computed(() => {
  const s = props.reportData.shps?.totalScore;
  if (s <= 33) return 'good';
  if (s <= 66) return 'fair';
  if (s <= 99) return 'warn';
  return 'bad';
});

const dbas16Level = computed(() => {
  const s = props.reportData.dbas16?.averageScore;
  if (s < 3.5) return '信念健康';
  if (s < 4.0) return '轻度不合理';
  if (s <= 5.0) return '需认知重构';
  return '不合理较严重';
});
const dbas16Class = computed(() => {
  const s = props.reportData.dbas16?.averageScore;
  if (s < 3.5) return 'good';
  if (s < 4.0) return 'fair';
  if (s <= 5.0) return 'warn';
  return 'bad';
});

function getInterventionIcon(type) {
  const map = {
    sleep_restriction: '⏰',
    stimulus_control: '🛌',
    cognitive_restructure: '🧠',
    relaxation: '🧘',
    sleep_hygiene: '✅',
  };
  return map[type] || '📌';
}

function goToIntervention() {
  router.push('/intervention');
}

function goToDiary() {
  router.push('/diary');
}
</script>

<style scoped>
.report-page {
  padding-bottom: 100px;
  min-height: 100vh;
  background: #f5f7fa;
}

.report-header {
  padding: 1.5rem 1.2rem 1rem;
  background: linear-gradient(135deg, #4a6fa5, #6b8fc5);
  color: #fff;
  text-align: center;
}

.btn-back {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.report-header h1 {
  font-size: 1.3rem;
}

.report-date {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 0.3rem;
}

.report-section {
  background: #fff;
  margin: 0.8rem 1.2rem;
  border-radius: 16px;
  padding: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.report-section h2 {
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 0.3rem;
}

.section-desc {
  font-size: 0.78rem;
  color: #999;
  margin-bottom: 0.8rem;
}

.result-cards {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.result-card {
  flex: 1;
  min-width: 90px;
  text-align: center;
  padding: 0.8rem 0.5rem;
  border-radius: 12px;
  background: #f9f9f9;
}

.result-card.good { background: #f0fff0; border: 1px solid #b7eb8f; }
.result-card.fair { background: #fffbe6; border: 1px solid #ffe58f; }
.result-card.warn { background: #fff2e8; border: 1px solid #ffbb96; }
.result-card.bad { background: #fff1f0; border: 1px solid #ffa39e; }

.rc-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  margin-bottom: 0.3rem;
}

.rc-icon { font-size: 1.1rem; }
.rc-name { font-size: 0.8rem; font-weight: 700; color: #666; }

.rc-score {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.rc-score small { font-size: 0.75rem; color: #999; }
.rc-level { font-size: 0.75rem; color: #666; margin-top: 0.2rem; }

.summary-box {
  background: #f8f9ff;
  border-radius: 10px;
  padding: 1rem;
  border-left: 3px solid #4a6fa5;
}

.summary-box p {
  font-size: 0.9rem;
  color: #555;
  line-height: 1.6;
}

.intervention-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.intervention-card {
  padding: 1rem;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #eee;
}

.intervention-card.priority-high {
  background: #f0f5ff;
  border-color: #adc6ff;
}

.intervention-card.priority-medium {
  background: #fffbe6;
  border-color: #ffe58f;
}

.int-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.int-priority {
  font-size: 0.72rem;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-weight: 600;
}

.int-priority.high { background: #4a6fa5; color: #fff; }
.int-priority.medium { background: #faad14; color: #fff; }
.int-priority.low { background: #d9d9d9; color: #666; }

.int-type { font-size: 1.3rem; }

.intervention-card h4 {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.3rem;
}

.intervention-card p {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
}

.report-actions {
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.8rem;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #4a6fa5, #6b8fc5);
  color: #fff;
  font-weight: 600;
}

.btn-secondary {
  background: #fff;
  color: #4a6fa5;
  border: 1px solid #4a6fa5;
}
</style>
