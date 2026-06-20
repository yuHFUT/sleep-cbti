const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 生产模式：托管前端静态文件
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '睡益良方 CBT-I API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 路由挂载
app.use('/api/scales', require('./routes/scales'));
app.use('/api/assessment', require('./routes/assessment'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/diary', require('./routes/diary'));
app.use('/api/intervention', require('./routes/intervention'));
app.use('/api/report', require('./routes/report'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/community', require('./routes/community'));

// SPA fallback：非 API 路由返回 index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ code: 404, message: '接口不存在' });
  }
  res.sendFile(path.join(clientDist, 'index.html'), err => { if (err) next(); });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
  });
});

module.exports = app;
