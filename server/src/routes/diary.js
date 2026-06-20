const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/diaryController');

// 保存日记
router.post('/:userId', ctrl.saveDiary);

// 获取指定日期日记
router.get('/:userId/:date', ctrl.getDiary);

// 获取日记列表
router.get('/:userId', ctrl.getDiaryList);

// 获取睡眠效率趋势
router.get('/:userId/trend/efficiency', ctrl.getEfficiencyTrend);

module.exports = router;
