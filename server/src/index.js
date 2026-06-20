const app = require('./app');
const { testConnection } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function start() {
  // 测试数据库连接
  await testConnection();

  // 初始化认证表 + 管理员账号
  const { initAuthTables, seedAdmin } = require('./services/authService');
  await initAuthTables();
  await seedAdmin();

  app.listen(PORT, () => {
    console.log(`🚀 睡益良方 CBT-I 服务已启动 → http://localhost:${PORT}`);
    console.log(`📋 健康检查 → http://localhost:${PORT}/api/health`);
  });
}

start();
