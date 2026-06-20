const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// 注册
router.post('/register', ctrl.doRegister);

// 登录
router.post('/login', ctrl.doLogin);

// 获取当前用户信息（需登录）
router.get('/profile', requireAuth, ctrl.getProfile);

// 修改密码（需登录）
router.post('/change-password', requireAuth, ctrl.doChangePassword);

module.exports = router;
