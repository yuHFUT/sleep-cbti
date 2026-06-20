const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/interventionController');

// 睡眠限制处方
router.get('/sleep-restriction/:userId', ctrl.getSleepRestriction);

// 刺激控制
router.get('/stimulus-control/:userId', ctrl.getStimulusCard);
router.post('/stimulus-control/:userId/checkin', ctrl.checkInStimulus);

// 认知重塑
router.get('/cognitive/:userId', ctrl.getCognitiveTask);
router.post('/cognitive/:userId', ctrl.submitCognitiveTask);

// 放松训练
router.get('/relaxation', ctrl.getRelaxationList);
router.get('/relaxation/:exerciseId', ctrl.getRelaxationDetail);

// 睡眠卫生任务
router.get('/hygiene/:userId', ctrl.getDailySleepHygiene);
router.post('/hygiene/:userId/:taskId', ctrl.toggleSleepHygieneTask);

module.exports = router;
