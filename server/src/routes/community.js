const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/communityController');

// 挑战营
router.get('/camps', ctrl.getCampList);
router.get('/camps/:userId/my', ctrl.getMyCamp);
router.post('/camps/:userId/join', ctrl.joinCamp);
router.post('/camps/:userId/checkin', ctrl.checkInCamp);
router.get('/camps/:campId/stats', ctrl.getCampStats);
router.post('/camps/:userId/leave', ctrl.leaveCamp);

// 话题圈
router.get('/posts', ctrl.getPostList);
router.post('/posts/:userId', ctrl.createPost);
router.post('/posts/:postId/like', ctrl.likePost);

module.exports = router;
