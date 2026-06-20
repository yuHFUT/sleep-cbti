<template>
  <div class="cognitive-restructure">
    <div v-if="exercise && !isCompleted">
      <div class="day-badge">第 {{ exercise.dayIndex + 1 }} 天</div>

      <!-- 对比卡片 -->
      <div class="compare-cards">
        <div class="cc-thought">
          <div class="cc-header">💭 常见想法</div>
          <p>{{ exercise.thought }}</p>
        </div>
        <div class="cc-fact">
          <div class="cc-header">🔬 科学事实</div>
          <p>{{ exercise.fact }}</p>
        </div>
      </div>

      <p class="instruction">{{ exercise.instruction }}</p>

      <!-- 填空表单 -->
      <div class="exercise-form">
        <div class="form-item">
          <label>1. 我是否有过类似的想法？请描述你当时的感受：</label>
          <textarea
            v-model="thoughtRecord"
            placeholder="写下你的真实想法和感受..."
            rows="3"
            class="input-textarea"
          ></textarea>
        </div>
        <div class="form-item">
          <label>2. 看到科学事实后，我的想法有什么变化？</label>
          <textarea
            v-model="factCheck"
            placeholder="例如：我意识到...…现在我觉得...…"
            rows="3"
            class="input-textarea"
          ></textarea>
        </div>
      </div>

      <button
        class="btn-submit"
        :disabled="!thoughtRecord.trim() || !factCheck.trim() || submitting"
        @click="doSubmit"
      >
        {{ submitting ? '提交中...' : '✅ 提交练习' }}
      </button>
    </div>

    <!-- 已完成状态 -->
    <div v-if="isCompleted" class="completed-state">
      <div class="complete-icon">🎉</div>
      <h3>今日认知训练已完成！</h3>
      <p>你已经迈出了改变睡眠信念的重要一步。明天会有新的练习。</p>
      <div class="completed-content" v-if="completedData">
        <div class="cc-label">你的记录：</div>
        <p class="cc-record"><strong>想法记录：</strong>{{ completedData.thoughtRecord }}</p>
        <p class="cc-record"><strong>事实检验：</strong>{{ completedData.factCheck }}</p>
      </div>
    </div>

    <div v-if="showToast" class="toast">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCognitiveTask, submitCognitiveTask } from '@/api/intervention';

const props = defineProps({ userId: String });
const exercise = ref(null);
const isCompleted = ref(false);
const submitting = ref(false);
const thoughtRecord = ref('');
const factCheck = ref('');
const toastMsg = ref('');
const showToast = ref(false);
const completedData = ref(null);

async function loadTask() {
  try {
    const res = await getCognitiveTask(props.userId);
    exercise.value = res.data;
    isCompleted.value = res.data.isCompleted;
  } catch { /* ignore */ }
}

async function doSubmit() {
  submitting.value = true;
  try {
    const res = await submitCognitiveTask(props.userId, {
      exerciseId: exercise.value.id,
      thoughtRecord: thoughtRecord.value,
      factCheck: factCheck.value,
    });
    completedData.value = {
      thoughtRecord: thoughtRecord.value,
      factCheck: factCheck.value,
    };
    isCompleted.value = true;
    toastMsg.value = res.message;
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 2500);
  } catch (err) {
    alert(err.response?.data?.message || '提交失败');
  } finally {
    submitting.value = false;
  }
}

onMounted(loadTask);
</script>

<style scoped>
.cognitive-restructure { min-height: 200px; }

.day-badge {
  display: inline-block;
  background: #e8f0fe;
  color: #4a6fa5;
  padding: 0.25rem 0.8rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
}

.compare-cards {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.cc-thought, .cc-fact {
  padding: 1rem 1.2rem;
  border-radius: 12px;
}

.cc-thought {
  background: #fff7e6;
  border-left: 4px solid #faad14;
}

.cc-fact {
  background: #f0f5ff;
  border-left: 4px solid #4a6fa5;
}

.cc-header {
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
  color: #333;
}

.cc-thought p, .cc-fact p {
  font-size: 0.88rem;
  color: #555;
  line-height: 1.6;
}

.instruction {
  font-size: 0.82rem;
  color: #999;
  margin-bottom: 1rem;
  white-space: pre-line;
  line-height: 1.5;
}

.exercise-form { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }

.form-item { background: #fff; border-radius: 10px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

.form-item label {
  display: block;
  font-size: 0.85rem;
  color: #333;
  font-weight: 600;
  margin-bottom: 0.5rem;
  line-height: 1.4;
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

.input-textarea:focus { border-color: #4a6fa5; }

.btn-submit {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: #fff;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.completed-state {
  text-align: center;
  padding: 2rem 1rem;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.complete-icon { font-size: 3rem; margin-bottom: 0.8rem; }

.completed-state h3 { color: #333; margin-bottom: 0.5rem; }

.completed-state p { color: #999; font-size: 0.85rem; line-height: 1.5; }

.completed-content {
  margin-top: 1rem;
  background: #f9f9f9;
  border-radius: 10px;
  padding: 1rem;
  text-align: left;
}

.cc-label { font-size: 0.8rem; color: #999; margin-bottom: 0.4rem; }

.cc-record { font-size: 0.82rem; color: #555; margin-bottom: 0.3rem; line-height: 1.4; }

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
  animation: fadeInOut 2.5s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  20% { opacity: 1; transform: translateX(-50%) translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
