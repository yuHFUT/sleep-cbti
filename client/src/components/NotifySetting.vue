<template>
  <div class="notify-overlay" v-if="visible" @click.self="visible = false">
    <div class="notify-card">
      <h3>🔔 睡眠提醒</h3>
      <p class="notify-desc">每天固定时间提醒你准备睡觉</p>

      <div class="time-picker">
        <select v-model.number="hour" class="tp-select">
          <option v-for="h in 24" :key="h" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}</option>
        </select>
        <span class="tp-colon">:</span>
        <select v-model.number="minute" class="tp-select">
          <option :value="0">00</option>
          <option :value="15">15</option>
          <option :value="30">30</option>
          <option :value="45">45</option>
        </select>
      </div>

      <div class="notify-actions">
        <button class="btn-save" @click="saveNotify">✅ 开启提醒</button>
        <button v-if="active" class="btn-cancel" @click="cancelNotify">关闭提醒</button>
      </div>

      <p v-if="active" class="notify-status">✅ 已设置 · 每天 {{ pad(hour) }}:{{ pad(minute) }} 提醒</p>
      <p v-if="msg" class="notify-msg">{{ msg }}</p>
      <button class="btn-close" @click="visible = false">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const visible = ref(false);
const hour = ref(22);
const minute = ref(0);
const active = ref(false);
const msg = ref('');

function pad(n) { return String(n).padStart(2, '0'); }

function open() {
  visible.value = true;
  active.value = !!(localStorage.getItem('notify_time'));
  const saved = localStorage.getItem('notify_time');
  if (saved) {
    const [h, m] = saved.split(':').map(Number);
    hour.value = h; minute.value = m;
  }
}

function saveNotify() {
  const time = `${pad(hour.value)}:${pad(minute.value)}`;
  localStorage.setItem('notify_time', time);
  active.value = true;
  msg.value = '提醒已设置';

  // 调用 Android 原生接口
  if (window.NativeBridge) {
    window.NativeBridge.setNotification(hour.value, minute.value);
  }

  setTimeout(() => { msg.value = ''; }, 2000);
}

function cancelNotify() {
  localStorage.removeItem('notify_time');
  active.value = false;
  msg.value = '提醒已关闭';
  if (window.NativeBridge) window.NativeBridge.cancelNotification();
  setTimeout(() => { msg.value = ''; }, 2000);
}

defineExpose({ open });
</script>

<style scoped>
.notify-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 999;
}
.notify-card {
  background: #fff; border-radius: 16px; padding: 1.5rem;
  width: 300px; text-align: center;
}
.notify-card h3 { font-size: 1.1rem; margin-bottom: 0.3rem; }
.notify-desc { font-size: 0.82rem; color: #999; margin-bottom: 1rem; }
.time-picker { display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin-bottom: 1rem; }
.tp-select { padding: 0.5rem 1rem; font-size: 1.3rem; font-weight: 700; border: 2px solid #ddd; border-radius: 10px; text-align: center; }
.tp-colon { font-size: 1.5rem; font-weight: 700; }
.notify-actions { display: flex; flex-direction: column; gap: 0.5rem; }
.btn-save { padding: 0.6rem; background: #4a6fa5; color: #fff; border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.btn-cancel { padding: 0.5rem; background: #fff; color: #ff4d4f; border: 1px solid #ff4d4f; border-radius: 10px; font-size: 0.8rem; cursor: pointer; }
.notify-status { font-size: 0.82rem; color: #52c41a; margin-top: 0.6rem; }
.notify-msg { font-size: 0.8rem; color: #666; margin-top: 0.4rem; }
.btn-close { margin-top: 0.8rem; padding: 0.3rem 1.2rem; background: #f0f0f0; border: none; border-radius: 10px; font-size: 0.8rem; color: #999; cursor: pointer; }
</style>
