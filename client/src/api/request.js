import axios from 'axios';

// 动态获取 API 基地址
// - 本地开发：默认 '/api'（Vite 代理到 localhost:3000）
// - GitHub Pages：优先从 localStorage 读取（由 api-config.json 写入），
//   回退到硬编码的隧道地址
function getApiBase() {
  if (!window.location.hostname.includes('github.io')) {
    return '/api';
  }
  // 优先用动态配置（app 启动时从 api-config.json 加载）
  const dynamic = localStorage.getItem('api_base');
  if (dynamic) return dynamic;
  // 构建时的默认隧道 URL（通过 config.json 同步更新）
  return 'https://f4d96171fff0bd.lhr.life/api';
}

const request = axios.create({
  baseURL: getApiBase(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

export default request;
