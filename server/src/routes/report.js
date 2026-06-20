const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');

// 周报
router.get('/weekly/:userId', ctrl.getWeeklyReport);
router.get('/history/:userId', ctrl.getReportHistory);

// 成就
router.get('/achievements/:userId', ctrl.getAchievements);
router.post('/achievements/:userId/check', ctrl.checkAchievements);

module.exports = router;
