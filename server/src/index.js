const app = require('./app');
const { pool, testConnection } = require('./config/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function start() {
  // 测试数据库连接
  await testConnection();

  // 执行数据库初始化脚本（create tables）
  try {
    const initSql = fs.readFileSync(path.join(__dirname, 'config/init.sql'), 'utf8');
    const statements = initSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE '));
    for (const stmt of statements) {
      try { await pool.execute(stmt); } catch (e) {
        // 忽略重复创建等错误
        if (!e.message.includes('already exists')) console.error('SQL init:', e.message);
      }
    }
    console.log('✅ 数据库表初始化完成');
  } catch (e) {
    console.error('初始化 SQL 执行失败:', e.message);
  }

  // 初始化认证字段 + 管理员账号
  const { initAuthTables, seedAdmin } = require('./services/authService');
  await initAuthTables();
  await seedAdmin();

  app.listen(PORT, () => {
    console.log(`🚀 睡益良方 CBT-I 服务已启动 → http://localhost:${PORT}`);
    console.log(`📋 健康检查 → http://localhost:${PORT}/api/health`);
  });
}

start();
