<template>
  <div class="relaxation">
    <!-- 列表模式 -->
    <div v-if="!activeExercise" class="exercise-list">
      <div
        v-for="ex in exercises"
        :key="ex.id"
        class="exercise-card"
        @click="startExercise(ex)"
      >
        <span class="ex-icon">{{ ex.icon }}</span>
        <div class="ex-info">
          <h4>{{ ex.title }}</h4>
          <p>{{ ex.description }}</p>
          <span class="ex-duration">⏱️ {{ formatDuration(ex.duration) }}</span>
        </div>
        <span class="ex-arrow">→</span>
      </div>
    </div>

    <!-- 播放模式 -->
    <div v-else class="player-mode">
      <button class="btn-back-player" @click="stopExercise">← 返回列表</button>

      <div class="player-card">
        <div class="player-icon">{{ activeExercise.icon }}</div>
        <h2>{{ activeExercise.title }}</h2>
        <p class="player-desc">{{ activeExercise.description }}</p>

        <!-- 定时器 -->
        <div class="timer-section">
          <div class="timer-display" :class="{ running: isPlaying }">
            {{ formatTime(timerRemaining) }}
          </div>
          <div class="timer-controls">
            <button class="btn-timer" @click="toggleTimer">
              {{ isPlaying ? '⏸️ 暂停' : '▶️ 开始' }}
            </button>
            <button class="btn-timer btn-reset" @click="resetTimer">🔄 重置</button>
          </div>
        </div>

        <!-- 定时关闭设置 -->
        <div class="auto-stop" v-if="isPlaying">
          <label>🔔 定时关闭（分钟后）：</label>
          <div class="auto-stop-options">
            <button
              v-for="min in [5, 10, 15, 20, 30]"
              :key="min"
              class="btn-auto-stop"
              :class="{ selected: autoStopMinutes === min }"
              @click="setAutoStop(min)"
            >{{ min }}分钟</button>
          </div>
          <p v-if="autoStopMinutes" class="auto-stop-info">
            将在 {{ autoStopMinutes }} 分钟后自动停止播放
          </p>
        </div>

        <!-- 呼吸引导（腹式呼吸） -->
        <div v-if="activeExercise.type === 'breathing' && isPlaying" class="breathing-guide">
          <div class="breath-circle" :class="breathPhase">
            <span class="breath-text">{{ breathText }}</span>
          </div>
          <p class="breath-counter">第 {{ breathCount }} / {{ activeExercise.repeat || 15 }} 次</p>
        </div>

        <!-- PMR 引导 -->
        <div v-if="activeExercise.type === 'pmr' && isPlaying" class="pmr-guide">
          <div class="pmr-current">
            <span class="pmr-index">{{ currentMuscleIndex + 1 }} / {{ activeExercise.muscleGroups?.length }}</span>
            <p class="pmr-instruction">{{ currentMuscleGroup?.instruction }}</p>
          </div>
          <div class="pmr-progress">
            <div
              v-for="(mg, mi) in activeExercise.muscleGroups"
              :key="mi"
              class="pmr-dot"
              :class="{ done: mi < currentMuscleIndex, current: mi === currentMuscleIndex }"
            ></div>
          </div>
          <button class="btn-next-muscle" @click="nextMuscle">下一个肌群 →</button>
        </div>

        <!-- 正念冥想 -->
        <div v-if="activeExercise.type === 'mindfulness' && isPlaying" class="mindfulness-guide">
          <p class="mindfulness-step">{{ currentMindfulnessStep }}</p>
          <div class="mindfulness-progress">
            <div class="mp-bar">
              <div class="mp-fill" :style="{ width: mindfulnessProgress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAutoStopToast" class="toast">⏰ 定时关闭已触发，播放已停止</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { getRelaxationList, getRelaxationDetail } from '@/api/intervention';

const props = defineProps({ userId: String });

const exercises = ref([]);
const activeExercise = ref(null);
const isPlaying = ref(false);
const timerRemaining = ref(0);
const autoStopMinutes = ref(0);
const showAutoStopToast = ref(false);

let timerInterval = null;
let autoStopTimeout = null;

// Breathing state
const breathPhase = ref('inhale');
const breathText = ref('吸气...');
const breathCount = ref(1);

// PMR state
const currentMuscleIndex = ref(0);

// Mindfulness state
const currentMindfulnessStep = ref('');
const mindfulnessProgress = ref(0);

const currentMuscleGroup = computed(() => {
  return activeExercise.value?.muscleGroups?.[currentMuscleIndex.value];
});

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  return m + '分钟';
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function loadList() {
  try {
    const res = await getRelaxationList();
    exercises.value = res.data || [];
  } catch { /* ignore */ }
}

async function startExercise(ex) {
  try {
    const res = await getRelaxationDetail(ex.id);
    activeExercise.value = res.data;
    timerRemaining.value = res.data.duration || 300;
    isPlaying.value = false;
    currentMuscleIndex.value = 0;
    breathCount.value = 1;
    mindfulnessProgress.value = 0;
    currentMindfulnessStep.value = '';
  } catch { /* ignore */ }
}

function toggleTimer() {
  if (isPlaying.value) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  isPlaying.value = true;
  clearInterval(timerInterval);

  // 呼吸引导动画
  if (activeExercise.value?.type === 'breathing') {
    startBreathingCycle();
  }

  // 正念脚本
  if (activeExercise.value?.type === 'mindfulness') {
    startMindfulnessScript();
  }

  timerInterval = setInterval(() => {
    if (timerRemaining.value > 0) {
      timerRemaining.value--;
    } else {
      stopExercise();
    }
  }, 1000);
}

function pauseTimer() {
  isPlaying.value = false;
  clearInterval(timerInterval);
}

function resetTimer() {
  clearInterval(timerInterval);
  isPlaying.value = false;
  timerRemaining.value = activeExercise.value?.duration || 300;
  breathCount.value = 1;
  breathPhase.value = 'inhale';
  currentMuscleIndex.value = 0;
  mindfulnessProgress.value = 0;
}

function stopExercise() {
  clearInterval(timerInterval);
  clearTimeout(autoStopTimeout);
  isPlaying.value = false;
  activeExercise.value = null;
  autoStopMinutes.value = 0;
}

function setAutoStop(min) {
  autoStopMinutes.value = min;
  clearTimeout(autoStopTimeout);
  autoStopTimeout = setTimeout(() => {
    isPlaying.value = false;
    clearInterval(timerInterval);
    showAutoStopToast.value = true;
    setTimeout(() => { showAutoStopToast.value = false; }, 3000);
    autoStopMinutes.value = 0;
  }, min * 60 * 1000);
}

// 呼吸引导
let breathInterval = null;

function startBreathingCycle() {
  clearInterval(breathInterval);
  let phaseSec = 0;
  const inhaleSec = 4;
  const holdSec = 2;
  const exhaleSec = 6;
  const cycleTotal = inhaleSec + holdSec + exhaleSec;

  breathPhase.value = 'inhale';
  breathText.value = '吸气...';

  breathInterval = setInterval(() => {
    phaseSec++;
    if (phaseSec <= inhaleSec) {
      breathPhase.value = 'inhale';
      breathText.value = '吸气...';
    } else if (phaseSec <= inhaleSec + holdSec) {
      breathPhase.value = 'hold';
      breathText.value = '屏住...';
    } else if (phaseSec < cycleTotal) {
      breathPhase.value = 'exhale';
      breathText.value = '呼气...';
    } else {
      phaseSec = 0;
      breathCount.value++;
    }
  }, 1000);
}

// PMR
function nextMuscle() {
  if (currentMuscleIndex.value < (activeExercise.value?.muscleGroups?.length || 0) - 1) {
    currentMuscleIndex.value++;
  }
}

// 正念冥想
function startMindfulnessScript() {
  const steps = activeExercise.value?.guideScript || [];
  if (steps.length === 0) return;

  let stepIdx = 0;
  const totalTime = activeExercise.value.duration || 480;
  const stepDuration = Math.round(totalTime / steps.length);

  currentMindfulnessStep.value = steps[0];
  mindfulnessProgress.value = 0;

  const mindInterval = setInterval(() => {
    stepIdx++;
    if (stepIdx < steps.length) {
      currentMindfulnessStep.value = steps[stepIdx];
      mindfulnessProgress.value = Math.round((stepIdx / steps.length) * 100);
    } else {
      clearInterval(mindInterval);
    }
  }, stepDuration * 1000);

  // Clean up on unmount
  const originalMindInterval = mindInterval;
  onUnmounted(() => clearInterval(originalMindInterval));
}

watch(() => activeExercise.value, (newVal) => {
  if (!newVal) {
    clearInterval(breathInterval);
    clearInterval(timerInterval);
  }
});

onMounted(loadList);
onUnmounted(() => {
  clearInterval(timerInterval);
  clearInterval(breathInterval);
  clearTimeout(autoStopTimeout);
});
</script>

<style scoped>
.relaxation { min-height: 200px; }

.exercise-list { display: flex; flex-direction: column; gap: 0.8rem; }

.exercise-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.2rem;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.2s;
}

.exercise-card:hover { box-shadow: 0 4px 16px rgba(74,111,165,0.1); }
.ex-icon { font-size: 2rem; flex-shrink: 0; }

.ex-info { flex: 1; }
.ex-info h4 { font-size: 0.95rem; color: #333; margin-bottom: 0.2rem; }
.ex-info p { font-size: 0.78rem; color: #999; line-height: 1.4; margin-bottom: 0.3rem; }
.ex-duration { font-size: 0.75rem; color: #4a6fa5; font-weight: 600; }
.ex-arrow { font-size: 1.2rem; color: #bbb; }

.btn-back-player {
  display: block;
  background: none;
  border: none;
  color: #4a6fa5;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.8rem;
}

.player-card {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

.player-icon { font-size: 3rem; margin-bottom: 0.5rem; }

.player-card h2 { font-size: 1.2rem; color: #333; margin-bottom: 0.3rem; }

.player-desc { font-size: 0.82rem; color: #999; margin-bottom: 1.2rem; }

.timer-section { margin-bottom: 1.2rem; }

.timer-display {
  font-size: 3rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: #ddd;
  margin-bottom: 0.6rem;
  transition: color 0.3s;
}

.timer-display.running { color: #4a6fa5; }

.timer-controls {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
}

.btn-timer {
  padding: 0.6rem 1.5rem;
  border: 1px solid #4a6fa5;
  border-radius: 20px;
  background: #fff;
  color: #4a6fa5;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset { border-color: #ddd; color: #999; }

.auto-stop { margin-bottom: 1.2rem; text-align: left; }

.auto-stop label { font-size: 0.8rem; color: #666; display: block; margin-bottom: 0.4rem; }

.auto-stop-options { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.btn-auto-stop {
  padding: 0.35rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 14px;
  background: #f9f9f9;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-auto-stop.selected {
  background: #4a6fa5;
  color: #fff;
  border-color: #4a6fa5;
}

.auto-stop-info {
  font-size: 0.75rem;
  color: #4a6fa5;
  margin-top: 0.4rem;
}

/* 呼吸引导 */
.breathing-guide { margin: 1rem 0; }

.breath-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #4a6fa5;
  transition: all 0.3s;
  background: #f8f9ff;
}

.breath-circle.inhale { transform: scale(1.3); background: #e8f0fe; }
.breath-circle.hold { transform: scale(1.3); background: #dbe8ff; }
.breath-circle.exhale { transform: scale(1); background: #f8f9ff; }

.breath-text { font-size: 0.9rem; color: #4a6fa5; font-weight: 600; }
.breath-counter { font-size: 0.8rem; color: #999; }

/* PMR */
.pmr-guide { margin: 1rem 0; }

.pmr-current { margin-bottom: 0.8rem; }

.pmr-index { display: inline-block; background: #e8f0fe; color: #4a6fa5; padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.75rem; margin-bottom: 0.4rem; }

.pmr-instruction { font-size: 0.85rem; color: #555; line-height: 1.5; }

.pmr-progress { display: flex; justify-content: center; gap: 0.3rem; margin-bottom: 0.8rem; }

.pmr-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ddd;
}

.pmr-dot.done { background: #52c41a; }
.pmr-dot.current { background: #4a6fa5; transform: scale(1.3); }

.btn-next-muscle {
  padding: 0.4rem 1rem;
  border: 1px solid #4a6fa5;
  border-radius: 14px;
  background: #fff;
  color: #4a6fa5;
  font-size: 0.8rem;
  cursor: pointer;
}

/* 正念冥想 */
.mindfulness-guide { margin: 1rem 0; }

.mindfulness-step {
  font-size: 0.9rem;
  color: #555;
  line-height: 1.6;
  min-height: 60px;
}

.mindfulness-progress { margin-top: 0.8rem; }

.mp-bar {
  height: 4px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;
}

.mp-fill {
  height: 100%;
  background: #4a6fa5;
  border-radius: 2px;
  transition: width 0.5s;
}

.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff7a45;
  color: #fff;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  z-index: 100;
  animation: fadeInOut 3s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  20% { opacity: 1; transform: translateX(-50%) translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
