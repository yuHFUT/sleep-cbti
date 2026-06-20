const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// 首页数据汇总
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 最新评估得分
    const [assessRows] = await pool.execute(
      `SELECT total_score, completed_at FROM assessments
       WHERE user_id = ? AND scale_type = 'UNIFIED'
       ORDER BY completed_at DESC LIMIT 1`,
      [userId]
    );

    // 近30天平均数据
    const [diaryRows] = await pool.execute(
      `SELECT
         AVG(sleep_efficiency) as avg_efficiency,
         AVG(TIME_TO_SEC(TIMEDIFF(
           IF(wake_up_time < lights_off_time, ADDTIME(wake_up_time, '24:00:00'), wake_up_time),
           lights_off_time
         )) / 3600) as avg_duration_hours,
         COUNT(*) as diary_count
       FROM sleep_diaries
       WHERE user_id = ? AND diary_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         AND lights_off_time IS NOT NULL AND wake_up_time IS NOT NULL`,
      [userId]
    );

    res.json({
      code: 200,
      data: {
        latestScore: assessRows[0]?.total_score || null,
        latestScoreDate: assessRows[0]?.completed_at || null,
        avgEfficiency: diaryRows[0]?.avg_efficiency
          ? Math.round(diaryRows[0].avg_efficiency * 10) / 10
          : null,
        avgDuration: diaryRows[0]?.avg_duration_hours
          ? Math.round(diaryRows[0].avg_duration_hours * 10) / 10
          : null,
        diaryCount: diaryRows[0]?.diary_count || 0,
      },
    });
  } catch (error) {
    console.error('首页数据获取失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});

module.exports = router;
