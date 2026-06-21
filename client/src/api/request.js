import axios from 'axios';

// GitHub Pages 模式：前端在 Pages，API 走隧道
const API_BASE = window.location.hostname.includes('github.io')
  ? 'https://cba064a99f1c11.lhr.life/api'
  : '/api';

const request = axios.create({
  baseURL: API_BASE,
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
