import axios from 'axios';

// 动态获取 API 基地址
// - 本地开发：默认 '/api'（Vite 代理到 localhost:3000）
// - GitHub Pages：优先从 localStorage 读取（由 api-config.json 写入），
//   回退到硬编码的隧道地址
function getApiBase() {
  // 本地开发：Vite 代理 /api → localhost:3000
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) return '/api';

  // 生产部署：优先用 api-config.json 加载的地址
  const dynamic = localStorage.getItem('api_base');
  if (dynamic) return dynamic;

  // 回退：构建时预设的 API 地址
  return 'https://eleven-ads-heal.loca.lt/api';
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
