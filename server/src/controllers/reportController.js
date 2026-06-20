const { pool } = require('../config/db');
const {
  generateWeeklyReport,
  checkAndUnlockAchievements,
  getAllAchievements,
  BADGE_DEFINITIONS,
} = require('../services/reportService');

/**
 * 获取指定周的睡眠改善周报
 */
async function getWeeklyReport(req, res) {
  try {
    const { userId } = req.params;
    const { weekStart, weekEnd } = req.query;

    let start, end;
    if (weekStart && weekEnd) {
      start = weekStart;
      end = weekEnd;
    } else {
      // 默认当前周（周一到周日）
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      start = monday.toISOString().slice(0, 10);
      end = sunday.toISOString().slice(0, 10);
    }

    // 获取本周日记
    const [diaries] = await pool.execute(
      `SELECT * FROM sleep_diaries
       WHERE user_id = ? AND diary_date >= ? AND diary_date <= ?
       ORDER BY diary_date ASC`,
      [userId, start, end]
    );

    // 获取上周日记（基线）
    const prevStart = shiftDate(start, -7);
    const prevEnd = shiftDate(end, -7);
    const [prevDiaries] = await pool.execute(
      `SELECT * FROM sleep_diaries
       WHERE user_id = ? AND diary_date >= ? AND diary_date <= ?
       ORDER BY diary_date ASC`,
      [userId, prevStart, prevEnd]
    );

    // 获取用户信心评分（取最近的 DBAS-16 平均分做参考）
    let confidenceScore = null;

    // 生成报告
    const report = generateWeeklyReport(diaries, prevDiaries, {
      weekStart: start,
      weekEnd: end,
      confidenceScore,
    });

    // 保存到数据库
    if (report.ready) {
      await pool.execute(
        `INSERT INTO weekly_reports (user_id, week_start, week_end, avg_sleep_efficiency, avg_sleep_latency, confidence_score, report_data)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          avg_sleep_efficiency = VALUES(avg_sleep_efficiency),
          avg_sleep_latency = VALUES(avg_sleep_latency),
          confidence_score = VALUES(confidence_score),
          report_data = VALUES(report_data)`,
        [
          userId, start, end,
          report.current.avgEfficiency,
          report.current.avgLatency,
          confidenceScore,
          JSON.stringify(report),
        ]
      );
    }

    // 检查并解锁成就
    const newBadges = await checkAndUnlockAchievements({ userId, pool });

    res.json({
      code: 200,
      data: {
        ...report,
        newBadges: newBadges.length > 0 ? newBadges : undefined,
      },
    });
  } catch (error) {
    console.error('周报生成失败:', error);
    res.status(500).json({ code: 500, message: '周报生成失败' });
  }
}

/**
 * 获取周报历史列表
 */
async function getReportHistory(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const [rows] = await pool.execute(
      `SELECT id, week_start, week_end, avg_sleep_efficiency, avg_sleep_latency, created_at
       FROM weekly_reports WHERE user_id = ?
       ORDER BY week_start DESC LIMIT ?`,
      [userId, parseInt(limit)]
    );

    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error('获取周报历史失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

/**
 * 获取成就列表（含解锁状态）
 */
async function getAchievements(req, res) {
  try {
    const { userId } = req.params;

    const achievements = await getAllAchievements({ userId, pool });

    const totalUnlocked = achievements.filter(a => a.unlocked).length;
    const totalBadges = achievements.length;

    res.json({
      code: 200,
      data: {
        badges: achievements,
        summary: {
          totalUnlocked,
          totalBadges,
          progress: Math.round((totalUnlocked / totalBadges) * 100),
        },
      },
    });
  } catch (error) {
    console.error('获取成就失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

/**
 * 手动触发成就检查（通常在完成任务后调用）
 */
async function checkAchievements(req, res) {
  try {
    const { userId } = req.params;

    const newBadges = await checkAndUnlockAchievements({ userId, pool });

    res.json({
      code: 200,
      data: {
        newBadges,
        message: newBadges.length > 0
          ? `🎉 恭喜！你获得了 ${newBadges.length} 个新成就！`
          : '暂无新成就解锁',
      },
    });
  } catch (error) {
    console.error('成就检查失败:', error);
    res.status(500).json({ code: 500, message: '检查失败' });
  }
}

function shiftDate(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

module.exports = { getWeeklyReport, getReportHistory, getAchievements, checkAchievements };
