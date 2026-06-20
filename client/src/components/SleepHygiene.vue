<template>
  <div class="sleep-hygiene">
    <div class="day-indicator">📅 {{ todayStr }}</div>

    <div class="points-summary" v-if="totalPoints > 0">
      <span class="pts-icon">⭐</span>
      <span class="pts-value">{{ totalPoints }} 分</span>
      <span class="pts-label">今日已获积分</span>
    </div>

    <div class="task-list">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-card"
        :class="{ completed: task.isCompleted }"
        @click="toggleTask(task)"
      >
        <div class="task-left">
          <span class="task-icon">{{ task.icon }}</span>
          <div class="task-info">
            <h4>{{ task.task }}</h4>
            <span class="task-category">{{ task.category }}</span>
          </div>
        </div>
        <div class="task-right">
          <span class="task-points">+{{ task.points }}</span>
          <span class="task-check" :class="{ done: task.isCompleted }">
            {{ task.isCompleted ? '✅' : '○' }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="tasks.length === 0" class="empty">今日任务加载中...</div>

    <div v-if="showToast" class="toast">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getDailyHygiene, toggleHygieneTask } from '@/api/intervention';

const props = defineProps({ userId: String });
const tasks = ref([]);
const toastMsg = ref('');
const showToast = ref(false);

const todayStr = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
});

const totalPoints = computed(() => {
  return tasks.value.filter(t => t.isCompleted).reduce((s, t) => s + (t.points || 0), 0);
});

async function loadTasks() {
  try {
    const res = await getDailyHygiene(props.userId);
    tasks.value = res.data?.tasks || [];
  } catch {
    tasks.value = [];
  }
}

async function toggleTask(task) {
  const newCompleted = !task.isCompleted;
  try {
    const res = await toggleHygieneTask(props.userId, task.id, newCompleted);
    task.isCompleted = newCompleted;
    toastMsg.value = res.message;
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 2000);
  } catch {
    alert('操作失败');
  }
}

onMounted(loadTasks);
</script>

<style scoped>
.sleep-hygiene { min-height: 200px; position: relative; }

.day-indicator {
  text-align: center;
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 0.8rem;
}

.points-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem;
  background: linear-gradient(135deg, #fffbe6, #fff7e6);
  border-radius: 14px;
  margin-bottom: 1rem;
}

.pts-icon { font-size: 1.2rem; }
.pts-value { font-size: 1.3rem; font-weight: 700; color: #faad14; }
.pts-label { font-size: 0.75rem; color: #999; }

.task-list { display: flex; flex-direction: column; gap: 0.5rem; }

.task-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.2s;
}

.task-card:hover { box-shadow: 0 4px 12px rgba(74,111,165,0.1); }

.task-card.completed {
  opacity: 0.6;
  background: #f9fff9;
}

.task-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1;
}

.task-icon { font-size: 1.4rem; flex-shrink: 0; }

.task-info h4 {
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.1rem;
}

.task-category {
  font-size: 0.7rem;
  color: #bbb;
}

.task-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.task-points {
  font-size: 0.8rem;
  font-weight: 600;
  color: #faad14;
}

.task-check {
  font-size: 1.3rem;
  color: #ddd;
}

.task-check.done { color: #52c41a; }

.empty { text-align: center; color: #999; padding: 2rem; }

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
  white-space: nowrap;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  20% { opacity: 1; transform: translateX(-50%) translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
