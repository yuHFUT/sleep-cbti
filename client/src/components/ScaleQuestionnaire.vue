<template>
  <div class="questionnaire">
    <div class="q-header">
      <button class="btn-back" @click="$emit('back')" v-if="!hideBack">← 返回</button>
      <h2>{{ config.title }}</h2>
      <p class="q-instruction">{{ config.instruction }}</p>
      <div class="q-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
        </div>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ allQuestions.length }}</span>
      </div>
    </div>

    <div class="q-body">
      <!-- 分组显示 -->
      <div v-for="(section, si) in config.sections" :key="'s-' + si">
        <div
          v-for="(q, qi) in section.questions"
          :key="'q-' + q.id"
          :ref="el => { if (el) questionRefs[q.id] = el; }"
        >
          <div
            class="question-card"
            :class="{ active: currentQ?.id === q.id, answered: answers[q.id] !== undefined && answers[q.id] !== '' }"
            :data-qid="q.id"
          >
            <div class="q-section-label" v-if="qi === 0">{{ section.title }}</div>
            <div v-if="section.description && qi === 0" class="q-section-desc">{{ section.description }}</div>

            <p class="q-label">
              {{ q.label }}
              <span v-if="q.optional" class="q-optional">（选填）</span>
            </p>

            <!-- 时间选择器 -->
            <div v-if="q.type === 'time'" class="q-input-group">
              <input
                type="time"
                :value="answers[q.id] || ''"
                @input="setAnswer(q.id, $event.target.value)"
                class="input-time"
              />
              <span v-if="q.hint" class="input-hint">{{ q.hint }}</span>
            </div>

            <!-- 数字输入 -->
            <div v-else-if="q.type === 'number'" class="q-input-group">
              <input
                type="number"
                :value="answers[q.id] || ''"
                @input="setAnswer(q.id, $event.target.value)"
                :min="q.min"
                :max="q.max"
                :step="q.step || 1"
                class="input-number"
                :placeholder="'请输入' + (q.unit || '')"
              />
              <span v-if="q.unit" class="input-unit">{{ q.unit }}</span>
            </div>

            <!-- 4级评分 -->
            <div v-else-if="q.type === 'scale4' || section.scaleType === 'frequency4'" class="q-scale-options">
              <button
                v-for="(label, oi) in (q.scaleLabels || section.scaleLabels)"
                :key="oi"
                :class="['btn-scale', { selected: answers[q.id] === oi }]"
                @click="setAnswer(q.id, oi)"
              >
                <span class="scale-dot" :class="'level-' + oi"></span>
                {{ label }}
              </button>
            </div>

            <!-- 7级 Likert (SHPS) -->
            <div v-else-if="section.scaleType !== 'likert10' && config.scaleLabels?.length === 8" class="q-scale-slider">
              <div class="slider-labels-top">
                <span v-for="(sl, sli) in config.scaleLabels" :key="sli" class="sl-label"
                  :class="{ active: answers[q.id] === sl.value }">
                  {{ sl.label }}
                </span>
              </div>
              <input
                type="range"
                :value="answers[q.id] ?? -1"
                @input="setAnswer(q.id, parseInt($event.target.value))"
                min="0"
                max="7"
                step="1"
                class="range-slider"
              />
              <div class="slider-value" v-if="answers[q.id] !== undefined && answers[q.id] !== ''">
                当前选择：<strong>{{ answers[q.id] }}</strong> — {{ config.scaleLabels[answers[q.id]]?.label }}
              </div>
              <div class="slider-value placeholder" v-else>请拖动滑块选择</div>
            </div>

            <!-- 10级 Likert (DBAS-16) -->
            <div v-else-if="section.scaleType === 'likert10'" class="q-scale-likert10">
              <div class="likert-endpoints">
                <span>{{ config.scaleLabels[0].label }} (0)</span>
                <span>{{ config.scaleLabels[2].label }} (10)</span>
              </div>
              <input
                type="range"
                :value="answers[q.id] ?? -1"
                @input="setAnswer(q.id, parseInt($event.target.value))"
                min="0"
                max="10"
                step="1"
                class="range-slider"
              />
              <div class="slider-value" v-if="answers[q.id] !== undefined && answers[q.id] !== ''">
                当前评分：<strong>{{ answers[q.id] }}</strong> / 10
              </div>
              <div class="slider-value placeholder" v-else>请拖动滑块选择（0-10分）</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="q-footer">
      <button
        v-if="currentIndex > 0"
        class="btn-nav btn-prev"
        @click="goPrev"
      >上一题</button>
      <button
        v-if="currentIndex < allQuestions.length - 1"
        class="btn-nav btn-next"
        @click="goNext"
        :disabled="currentAnswer === undefined || currentAnswer === ''"
      >下一题</button>
      <button
        v-if="currentIndex >= allQuestions.length - 1"
        class="btn-nav btn-submit"
        :disabled="!allAnswered"
        @click="handleSubmit"
      >提交评估</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';

const props = defineProps({
  config: { type: Object, required: true },
  hideBack: { type: Boolean, default: false },
});

const emit = defineEmits(['back', 'submit']);

const answers = ref({});
const currentIndex = ref(0);

const questionRefs = ref({});

const allQuestions = computed(() => {
  const list = [];
  for (const section of props.config.sections) {
    for (const q of section.questions) {
      list.push(q);
    }
  }
  return list;
});

const currentQ = computed(() => allQuestions.value[currentIndex.value]);

const currentAnswer = computed(() => {
  if (!currentQ.value) return undefined;
  return answers.value[currentQ.value.id];
});

const allAnswered = computed(() => {
  return allQuestions.value.every(q => {
    if (q.optional) return true;
    const val = answers.value[q.id];
    return val !== undefined && val !== '' && val !== -1;
  });
});

const progressPct = computed(() => {
  const answered = allQuestions.value.filter(q => {
    const val = answers.value[q.id];
    return val !== undefined && val !== '' && val !== -1;
  }).length;
  return Math.round((answered / allQuestions.value.length) * 100);
});

function setAnswer(id, value) {
  answers.value[id] = value;
}

function goNext() {
  if (currentIndex.value < allQuestions.value.length - 1) {
    currentIndex.value++;
    scrollToCurrent();
  }
}

function goPrev() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    scrollToCurrent();
  }
}

function scrollToCurrent() {
  nextTick(() => {
    const qid = currentQ.value?.id;
    if (qid && questionRefs.value[qid]) {
      questionRefs.value[qid].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

function handleSubmit() {
  // 构建答案对象
  const result = {};
  for (const q of allQuestions.value) {
    result[q.id] = answers.value[q.id];
  }
  emit('submit', result);
}
</script>

<style scoped>
.questionnaire {
  padding-bottom: 100px;
  position: relative;
  min-height: 100vh;
}

.q-header {
  padding: 1rem 1.2rem;
  background: linear-gradient(135deg, #4a6fa5, #6b8fc5);
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
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

.q-header h2 {
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
}

.q-instruction {
  font-size: 0.8rem;
  opacity: 0.85;
  line-height: 1.4;
}

.q-progress {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.8rem;
}

.progress-bar {
  flex: 1;
  height: 5px;
  background: rgba(255,255,255,0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #fff;
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.8rem;
  white-space: nowrap;
}

.q-body {
  padding: 0.8rem 1.2rem;
}

.question-card {
  padding: 1rem 1.2rem;
  margin-bottom: 0.8rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.3s;
  border: 2px solid transparent;
}

.question-card.active {
  border-color: #4a6fa5;
  box-shadow: 0 4px 16px rgba(74,111,165,0.15);
}

.question-card.answered {
  border-left: 3px solid #52c41a;
}

.q-section-label {
  font-size: 0.75rem;
  color: #4a6fa5;
  font-weight: 700;
  margin-bottom: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.q-section-desc {
  font-size: 0.78rem;
  color: #999;
  margin-bottom: 0.5rem;
}

.q-label {
  font-size: 1rem;
  color: #333;
  line-height: 1.5;
  margin-bottom: 0.8rem;
}

.q-optional {
  font-size: 0.78rem;
  color: #999;
}

.q-input-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.input-time,
.input-number {
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  width: 180px;
}

.input-time:focus,
.input-number:focus {
  border-color: #4a6fa5;
}

.input-hint,
.input-unit {
  font-size: 0.82rem;
  color: #999;
}

/* 4级按钮选择 */
.q-scale-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-scale {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: #f9f9f9;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-scale.selected {
  background: #e8f0fe;
  border-color: #4a6fa5;
  color: #4a6fa5;
  font-weight: 600;
}

.scale-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.scale-dot.level-0 { background: #52c41a; }
.scale-dot.level-1 { background: #8bc34a; }
.scale-dot.level-2 { background: #ff9800; }
.scale-dot.level-3 { background: #f44336; }

/* 滑块 */
.q-scale-slider,
.q-scale-likert10 {
  padding: 0.5rem 0;
}

.slider-labels-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.sl-label {
  font-size: 0.65rem;
  color: #bbb;
  text-align: center;
  flex: 1;
  transition: color 0.2s;
}

.sl-label.active {
  color: #4a6fa5;
  font-weight: 600;
}

.likert-endpoints {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 0.4rem;
}

.range-slider {
  width: 100%;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #52c41a, #ff9800, #f44336);
  outline: none;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #4a6fa5;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  cursor: pointer;
}

.slider-value {
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: #4a6fa5;
  text-align: center;
}

.slider-value.placeholder {
  color: #ccc;
  font-style: italic;
}

/* Footer */
.q-footer {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
  z-index: 10;
}

.btn-nav {
  padding: 0.7rem 2rem;
  border: none;
  border-radius: 25px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-prev {
  background: #f0f0f0;
  color: #666;
}

.btn-next {
  background: #4a6fa5;
  color: #fff;
}

.btn-submit {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.btn-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
