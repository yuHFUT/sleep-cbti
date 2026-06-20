<template>
  <div class="register-page">
    <div class="register-card">
      <div class="register-header">
        <span class="logo">🌙</span>
        <h1>创建账号</h1>
        <p>加入睡益良方，开始改善睡眠</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-item">
          <label>用户名</label>
          <input
            v-model="username"
            type="text"
            placeholder="3-50个字符，字母数字下划线"
            class="input-field"
            autocomplete="username"
          />
        </div>

        <div class="form-item">
          <label>昵称（选填）</label>
          <input
            v-model="nickname"
            type="text"
            placeholder="如何称呼你？"
            class="input-field"
          />
        </div>

        <div class="form-item">
          <label>密码</label>
          <input
            v-model="password"
            type="password"
            placeholder="至少6个字符"
            class="input-field"
            autocomplete="new-password"
          />
        </div>

        <div class="form-item">
          <label>确认密码</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="再次输入密码"
            class="input-field"
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="btn-register" :disabled="loading">
          {{ loading ? '注册中...' : '注 册' }}
        </button>

        <div class="form-footer">
          <router-link to="/login">已有账号？立即登录</router-link>
        </div>
      </form>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const nickname = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMsg = ref('');

async function handleRegister() {
  errorMsg.value = '';

  if (!username.value || !password.value) {
    errorMsg.value = '请输入用户名和密码';
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致';
    return;
  }

  if (password.value.length < 6) {
    errorMsg.value = '密码至少6个字符';
    return;
  }

  loading.value = true;

  try {
    await authStore.doRegister(username.value, password.value, nickname.value || undefined);
    router.push('/');
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '注册失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4a6fa5 0%, #6b8fc5 50%, #89b4d4 100%);
  padding: 2rem 1.2rem;
}

.register-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 20px;
  padding: 2rem 1.8rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.register-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }

.register-header h1 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 0.3rem;
}

.register-header p { font-size: 0.85rem; color: #999; }

.form-item { margin-bottom: 1rem; }

.form-item label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.3rem;
}

.input-field {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.input-field:focus { border-color: #4a6fa5; }

.btn-register {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: all 0.2s;
}

.btn-register:disabled { opacity: 0.6; cursor: not-allowed; }

.form-footer {
  text-align: center;
  margin-top: 1rem;
}

.form-footer a {
  font-size: 0.85rem;
  color: #4a6fa5;
  text-decoration: none;
}

.error-msg {
  margin-top: 0.8rem;
  padding: 0.6rem;
  background: #fff1f0;
  border-radius: 8px;
  color: #ff4d4f;
  font-size: 0.85rem;
  text-align: center;
}
</style>
