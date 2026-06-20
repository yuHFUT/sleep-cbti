<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <span class="logo">🌙</span>
        <h1>睡益良方</h1>
        <p>CBT-I 数字疗法助手</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-item">
          <label>用户名</label>
          <input
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            class="input-field"
            autocomplete="username"
          />
        </div>

        <div class="form-item">
          <label>密码</label>
          <input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            class="input-field"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>

        <div class="form-footer">
          <router-link to="/register">还没有账号？立即注册</router-link>
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
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

async function handleLogin() {
  if (!username.value || !password.value) {
    errorMsg.value = '请输入用户名和密码';
    return;
  }

  loading.value = true;
  errorMsg.value = '';

  try {
    await authStore.doLogin(username.value, password.value);
    router.push('/');
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4a6fa5 0%, #6b8fc5 50%, #89b4d4 100%);
  padding: 2rem 1.2rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 20px;
  padding: 2.5rem 1.8rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo { font-size: 3rem; display: block; margin-bottom: 0.5rem; }

.login-header h1 {
  font-size: 1.6rem;
  color: #333;
  margin-bottom: 0.3rem;
}

.login-header p { font-size: 0.85rem; color: #999; }

.form-item { margin-bottom: 1.2rem; }

.form-item label {
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.4rem;
}

.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.input-field:focus { border-color: #4a6fa5; }

.btn-login {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, #4a6fa5, #6b8fc5);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: all 0.2s;
}

.btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

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
