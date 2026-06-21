/**
 * 认证服务 - 注册 / 登录 / JWT
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'sleep-cbti-jwt-secret-key';
const JWT_EXPIRES_IN = '7d';

// ============================================================
// 初始化：更新用户表 + 创建管理员
// ============================================================

async function initAuthTables() {
  // 先创建 users 表（如果不存在）
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255),
        nickname VARCHAR(100),
        role ENUM('user','admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ users 表已就绪');
  } catch (err) {
    console.error('创建 users 表失败:', err.message);
  }

  // 兼容旧表：补充可能缺失的字段
  const alterQueries = [
    `ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE`,
    `ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN role ENUM('user','admin') DEFAULT 'user'`,
  ];
  for (const q of alterQueries) {
    try { await pool.execute(q); } catch { /* 字段已存在 */ }
  }
}

async function seedAdmin() {
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE username = ?', ['admin']
  );
  if (existing.length > 0) return; // 已存在

  const passwordHash = await bcrypt.hash('123456', SALT_ROUNDS);
  await pool.execute(
    `INSERT INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'`,
    ['admin', passwordHash, '管理员']
  );
  console.log('✅ 管理员账号已创建: admin / 123456');
}

// ============================================================
// 注册
// ============================================================

async function register(username, password, nickname) {
  // 验证用户名
  if (!username || username.length < 3 || username.length > 50) {
    return { success: false, message: '用户名需3-50个字符' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { success: false, message: '用户名只能包含字母、数字和下划线' };
  }

  // 验证密码
  if (!password || password.length < 6) {
    return { success: false, message: '密码至少6个字符' };
  }

  // 检查用户名是否已存在
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE username = ?', [username]
  );
  if (existing.length > 0) {
    return { success: false, message: '用户名已被注册' };
  }

  // 创建用户
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const displayName = nickname || username;

  const [result] = await pool.execute(
    `INSERT INTO users (username, password_hash, nickname) VALUES (?, ?, ?)`,
    [username, passwordHash, displayName]
  );

  const user = { id: result.insertId, username, nickname: displayName, role: 'user' };
  const token = generateToken(user);

  return {
    success: true,
    message: '注册成功',
    data: { user, token },
  };
}

// ============================================================
// 登录
// ============================================================

async function login(username, password) {
  if (!username || !password) {
    return { success: false, message: '请输入用户名和密码' };
  }

  const [rows] = await pool.execute(
    'SELECT id, username, password_hash, nickname, role FROM users WHERE username = ?',
    [username]
  );

  if (rows.length === 0) {
    return { success: false, message: '用户名或密码错误' };
  }

  const user = rows[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    return { success: false, message: '用户名或密码错误' };
  }

  const token = generateToken(user);
  const { password_hash, ...userInfo } = user;

  return {
    success: true,
    message: '登录成功',
    data: { user: userInfo, token },
  };
}

// ============================================================
// 修改密码
// ============================================================

async function changePassword(userId, oldPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: '新密码至少6个字符' };
  }

  const [rows] = await pool.execute(
    'SELECT password_hash FROM users WHERE id = ?', [userId]
  );
  if (rows.length === 0) {
    return { success: false, message: '用户不存在' };
  }

  const validOld = await bcrypt.compare(oldPassword, rows[0].password_hash);
  if (!validOld) {
    return { success: false, message: '原密码错误' };
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

  return { success: true, message: '密码修改成功' };
}

// ============================================================
// JWT
// ============================================================

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = { register, login, changePassword, generateToken, verifyToken, initAuthTables, seedAdmin };
