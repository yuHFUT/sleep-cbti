<template>
  <div class="ai-chat">
    <!-- 消息列表 -->
    <div class="chat-messages" ref="msgList">
      <div v-if="messages.length === 0" class="chat-welcome">
        <span class="welcome-icon">🤖</span>
        <p>你好！我是你的 AI 睡眠顾问。</p>
        <p class="welcome-hint">我已经读取了你的睡眠数据，可以问我任何问题：</p>
        <div class="quick-asks">
          <button v-for="q in quickQuestions" :key="q" @click="ask(q)" class="btn-quick">{{ q }}</button>
        </div>
      </div>

      <div v-for="(m, i) in messages" :key="i" class="chat-msg" :class="m.role">
        <span class="msg-avatar">{{ m.role === 'user' ? '😴' : '🤖' }}</span>
        <div class="msg-bubble">{{ m.content }}</div>
      </div>

      <div v-if="loading" class="chat-msg assistant">
        <span class="msg-avatar">🤖</span>
        <div class="msg-bubble typing">...</div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="chat-input">
      <input
        v-model="input"
        @keydown.enter="send"
        placeholder="输入你的问题..."
        class="input-msg"
        :disabled="loading"
      />
      <button @click="send" class="btn-send" :disabled="loading || !input.trim()">发送</button>
      <button @click="clearHistory" class="btn-clear" v-if="messages.length">清</button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import request from '@/api/request';

const props = defineProps({ userId: [String, Number] });
const authStore = useAuthStore();

const STORAGE_KEY = 'ai_chat_history';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveHistory() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value.slice(-50))); }
  catch { /* ignore */ }
}

const messages = ref(loadHistory());
const input = ref('');
const loading = ref(false);
const msgList = ref(null);

const quickQuestions = [
  '我的睡眠状况怎么样？',
  '怎么才能更快入睡？',
  '半夜醒了睡不着怎么办？',
  '午睡到底好不好？',
];

async function send() {
  const text = input.value.trim();
  if (!text || loading.value) return;
  input.value = '';

  messages.value.push({ role: 'user', content: text });
  saveHistory();
  loading.value = true;
  await scrollBottom();

  try {
    const id = props.userId || authStore.user?.id;
    const res = await request.post('/ai/chat', {
      userId: id,
      messages: messages.value.map(m => ({ role: m.role, content: m.content })),
    });
    messages.value.push(res.data);
  } catch (e) {
    messages.value.push({ role: 'assistant', content: '抱歉，AI 服务暂时不可用：' + (e.response?.data?.message || e.message) });
  }
  saveHistory();
  loading.value = false;
  await scrollBottom();
}

function ask(q) { input.value = q; send(); }
function clearHistory() { messages.value = []; localStorage.removeItem(STORAGE_KEY); }

async function scrollBottom() {
  await nextTick();
  if (msgList.value) msgList.value.scrollTop = msgList.value.scrollHeight;
}
</script>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 160px);
  min-height: 350px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.chat-welcome {
  text-align: center;
  padding: 1.5rem 1rem;
}

.welcome-icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }

.chat-welcome p { font-size: 0.9rem; color: #666; }

.welcome-hint { font-size: 0.8rem !important; color: #999 !important; margin: 0.8rem 0 0.5rem; }

.quick-asks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
  margin-top: 0.6rem;
}

.btn-quick {
  padding: 0.4rem 0.8rem;
  border: 1px solid #4a6fa5;
  border-radius: 14px;
  background: #fff;
  color: #4a6fa5;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-quick:hover { background: #e8f0fe; }

.chat-msg {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.chat-msg.user { flex-direction: row-reverse; }

.msg-avatar { font-size: 1.5rem; flex-shrink: 0; }

.msg-bubble {
  max-width: 80%;
  padding: 0.6rem 0.9rem;
  border-radius: 14px;
  font-size: 0.88rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.chat-msg.assistant .msg-bubble {
  background: #f0f5ff;
  color: #333;
  border-bottom-left-radius: 4px;
}

.chat-msg.user .msg-bubble {
  background: #4a6fa5;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg-bubble.typing {
  color: #999;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  padding: 0.6rem 0;
  border-top: 1px solid #eee;
  background: #fff;
  position: sticky;
  bottom: 0;
}

.input-msg {
  flex: 1;
  padding: 0.55rem 0.9rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 0.88rem;
  outline: none;
}

.input-msg:focus { border-color: #4a6fa5; }

.btn-send {
  padding: 0.5rem 1.2rem;
  background: #4a6fa5;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}

.btn-send:disabled { opacity: 0.5; }
.btn-clear {
  padding: 0.35rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: #fff;
  color: #999;
  font-size: 0.7rem;
  cursor: pointer;
}
</style>
