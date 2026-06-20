const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assessmentController');

// 提交各量表（保留兼容）
router.post('/psqi', ctrl.submitPSQI);
router.post('/shps', ctrl.submitSHPS);
router.post('/dbas16', ctrl.submitDBAS16);

// 统一保存（H5测评结果）
router.post('/save', ctrl.saveUnified);

// 获取综合评估报告
router.get('/report/:userId', ctrl.getReport);

// 获取评估历史
router.get('/history/:userId', ctrl.getHistory);

module.exports = router;
