const { register, login, changePassword } = require('../services/authService');

/**
 * 注册
 */
async function doRegister(req, res) {
  try {
    const { username, password, nickname } = req.body;
    const result = await register(username, password, nickname);

    if (!result.success) {
      return res.status(400).json({ code: 400, message: result.message });
    }

    res.json({ code: 200, message: result.message, data: result.data });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ code: 500, message: '注册失败' });
  }
}

/**
 * 登录
 */
async function doLogin(req, res) {
  try {
    const { username, password } = req.body;
    const result = await login(username, password);

    if (!result.success) {
      return res.status(401).json({ code: 401, message: result.message });
    }

    res.json({ code: 200, message: result.message, data: result.data });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ code: 500, message: '登录失败' });
  }
}

/**
 * 获取当前用户信息
 */
async function getProfile(req, res) {
  try {
    const { pool } = require('../config/db');
    const [rows] = await pool.execute(
      'SELECT id, username, nickname, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    res.json({ code: 200, data: rows[0] });
  } catch (error) {
    res.status(500).json({ code: 500, message: '获取信息失败' });
  }
}

/**
 * 修改密码
 */
async function doChangePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await changePassword(req.user.id, oldPassword, newPassword);

    if (!result.success) {
      return res.status(400).json({ code: 400, message: result.message });
    }

    res.json({ code: 200, message: result.message });
  } catch (error) {
    res.status(500).json({ code: 500, message: '修改失败' });
  }
}

module.exports = { doRegister, doLogin, getProfile, doChangePassword };
