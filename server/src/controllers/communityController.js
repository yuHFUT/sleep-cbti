const { pool } = require('../config/db');
const {
  CAMP_SCHEDULES,
  moderateContent,
  calcCampStats,
} = require('../services/communityService');

// ============================================================
// 初始化社区相关表
// ============================================================

async function initCommunityTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS camp_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      camp_id VARCHAR(50) NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active TINYINT(1) DEFAULT 1,
      UNIQUE KEY uk_user_camp (user_id, camp_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='挑战营成员'
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS camp_checkins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      camp_id VARCHAR(50) NOT NULL,
      checkin_date DATE NOT NULL,
      sleep_efficiency DECIMAL(5,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_camp_date (user_id, camp_id, checkin_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='挑战营打卡记录'
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS topic_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      display_name VARCHAR(50) DEFAULT '匿名睡友',
      content TEXT NOT NULL,
      sanitized_content TEXT,
      risk_level ENUM('low','medium','high') DEFAULT 'low',
      is_approved TINYINT(1) DEFAULT 1,
      likes INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='话题圈帖子'
  `);
}

// 首次引入时初始化表
initCommunityTables().catch(err => console.error('社区表初始化失败:', err.message));

// ============================================================
// 一、挑战营 API
// ============================================================

/**
 * 获取所有挑战营列表
 */
async function getCampList(req, res) {
  try {
    const camps = CAMP_SCHEDULES.map(c => ({ ...c }));
    res.json({ code: 200, data: camps });
  } catch (error) {
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

/**
 * 加入挑战营
 */
async function joinCamp(req, res) {
  try {
    const { userId } = req.params;
    const { campId } = req.body;

    const camp = CAMP_SCHEDULES.find(c => c.id === campId);
    if (!camp) {
      return res.status(404).json({ code: 404, message: '挑战营不存在' });
    }

    // 先停用旧营
    await pool.execute(
      'UPDATE camp_members SET is_active = 0 WHERE user_id = ? AND is_active = 1',
      [userId]
    );

    // 加入新营
    await pool.execute(
      `INSERT INTO camp_members (user_id, camp_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE is_active = 1, joined_at = CURRENT_TIMESTAMP`,
      [userId, campId]
    );

    res.json({
      code: 200,
      message: `🎉 已加入「${camp.name}」挑战营！${camp.description}`,
      data: camp,
    });
  } catch (error) {
    console.error('加入挑战营失败:', error);
    res.status(500).json({ code: 500, message: '加入失败' });
  }
}

/**
 * 获取用户当前挑战营信息
 */
async function getMyCamp(req, res) {
  try {
    const { userId } = req.params;

    const [members] = await pool.execute(
      `SELECT cm.*, c.name FROM camp_members cm
       LEFT JOIN (SELECT 'dummy' as name) c ON 1=1
       WHERE cm.user_id = ? AND cm.is_active = 1
       ORDER BY cm.joined_at DESC LIMIT 1`,
      [userId]
    );

    if (members.length === 0) {
      return res.json({
        code: 200,
        data: { joined: false },
      });
    }

    const camp = CAMP_SCHEDULES.find(c => c.id === members[0].camp_id);

    // 获取今日打卡状态
    const today = new Date().toISOString().slice(0, 10);
    const [checkins] = await pool.execute(
      'SELECT * FROM camp_checkins WHERE user_id = ? AND camp_id = ? AND checkin_date = ?',
      [userId, members[0].camp_id, today]
    );

    // 获取连续打卡天数
    const [allCheckins] = await pool.execute(
      'SELECT checkin_date FROM camp_checkins WHERE user_id = ? AND camp_id = ? ORDER BY checkin_date DESC',
      [userId, members[0].camp_id]
    );
    let streak = 0;
    const dates = allCheckins.map(c => c.checkin_date).sort().reverse();
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) { streak = 1; continue; }
      const d1 = new Date(dates[i - 1]);
      const d2 = new Date(dates[i]);
      if ((d1 - d2) / (1000 * 60 * 60 * 24) === 1) streak++;
      else break;
    }

    res.json({
      code: 200,
      data: {
        joined: true,
        camp,
        todayCheckedIn: checkins.length > 0,
        streak,
        joinedAt: members[0].joined_at,
      },
    });
  } catch (error) {
    console.error('获取我的挑战营失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

/**
 * 打卡
 */
async function checkInCamp(req, res) {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().slice(0, 10);

    // 获取当前活跃营地
    const [members] = await pool.execute(
      'SELECT camp_id FROM camp_members WHERE user_id = ? AND is_active = 1 LIMIT 1',
      [userId]
    );

    if (members.length === 0) {
      return res.status(400).json({ code: 400, message: '请先加入一个挑战营' });
    }

    const campId = members[0].camp_id;

    // 获取今日睡眠效率
    const [diaries] = await pool.execute(
      'SELECT sleep_efficiency FROM sleep_diaries WHERE user_id = ? AND diary_date = ?',
      [userId, today]
    );
    const efficiency = diaries.length > 0 ? diaries[0].sleep_efficiency : null;

    await pool.execute(
      `INSERT INTO camp_checkins (user_id, camp_id, checkin_date, sleep_efficiency)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE sleep_efficiency = VALUES(sleep_efficiency)`,
      [userId, campId, today, efficiency]
    );

    // 群体签到统计
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as cnt FROM camp_members WHERE camp_id = ? AND is_active = 1',
      [campId]
    );
    const memCount = countResult[0].cnt;

    const [todayRows] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM camp_checkins cc
       JOIN camp_members cm ON cc.user_id = cm.user_id AND cc.camp_id = cm.camp_id
       WHERE cc.camp_id = ? AND cc.checkin_date = ? AND cm.is_active = 1`,
      [campId, today]
    );
    const todayCnt = todayRows[0].cnt;
    const todayRate = memCount > 0 ? Math.round((todayCnt / memCount) * 100) : 0;

    // 加权平均签到率：只统计活跃成员的签到，权重=签到次数
    const [weightedRows] = await pool.execute(
      `SELECT cc.user_id, COUNT(*) as cnt FROM camp_checkins cc
       JOIN camp_members cm ON cc.user_id = cm.user_id AND cc.camp_id = cm.camp_id
       WHERE cc.camp_id = ? AND cc.checkin_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
       AND cm.is_active = 1
       GROUP BY cc.user_id HAVING cnt >= 1`,
      [campId]
    );
    let weightedRate = 0;
    if (weightedRows.length > 0) {
      const totalWeight = weightedRows.reduce((s, r) => s + r.cnt, 0);
      const weightedSum = weightedRows.reduce((s, r) => s + r.cnt * (r.cnt / 14), 0);
      weightedRate = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
    }

    // 连续打卡排行
    const [streakRows] = await pool.execute(
      `SELECT user_id, COUNT(*) as streak FROM camp_checkins
       WHERE camp_id = ? AND checkin_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
       GROUP BY user_id ORDER BY streak DESC LIMIT 5`,
      [campId]
    );
    const topStreaks = streakRows.map(r => ({
      streak: r.streak,
      label: `有用户连续打卡 ${r.streak} 天`,
    }));

    const groupMsg = todayCnt > 0
      ? (todayRate >= 80 ? `🔥 今日 ${todayCnt}/${memCount} 人打卡，大家热情高涨！`
        : todayRate >= 50 ? `👍 今日 ${todayCnt}/${memCount} 人打卡，一起坚持！`
        : `🤝 今日 ${todayCnt}/${memCount} 人打卡，慢慢来。`)
      : '来成为今天第一个打卡的人吧！';

    res.json({
      code: 200,
      message: '✅ 打卡成功！',
      data: {
        memberCount: memCount,
        todayCheckinCount: todayCnt,
        todayCheckinRate: todayRate,
        weightedCheckinRate: weightedRate,
        myStreak: streakRows.find(r => r.user_id == userId)?.streak || 1,
        groupMessage: groupMsg,
        topStreaks,
      },
    });
  } catch (error) {
    console.error('打卡失败:', error);
    res.status(500).json({ code: 500, message: '打卡失败' });
  }
}

/**
 * 获取挑战营群体统计（不暴露个人信息）
 */
async function getCampStats(req, res) {
  try {
    const { campId } = req.params;

    const [memberCount] = await pool.execute(
      'SELECT COUNT(*) as cnt FROM camp_members WHERE camp_id = ? AND is_active = 1',
      [campId]
    );
    const memCnt = memberCount[0].cnt;

    const [todayCount] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM camp_checkins cc
       JOIN camp_members cm ON cc.user_id = cm.user_id AND cc.camp_id = cm.camp_id
       WHERE cc.camp_id = ? AND cc.checkin_date = CURDATE() AND cm.is_active = 1`,
      [campId]
    );
    const todayCnt = todayCount[0].cnt;
    const todayRate = memCnt > 0 ? Math.round((todayCnt / memCnt) * 100) : 0;

    // 加权平均签到率
    const [weightedRows] = await pool.execute(
      `SELECT cc.user_id, COUNT(*) as cnt FROM camp_checkins cc
       JOIN camp_members cm ON cc.user_id = cm.user_id AND cc.camp_id = cm.camp_id
       WHERE cc.camp_id = ? AND cc.checkin_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
       AND cm.is_active = 1
       GROUP BY cc.user_id HAVING cnt >= 1`,
      [campId]
    );
    let weightedRate = 0;
    if (weightedRows.length > 0) {
      const totalWeight = weightedRows.reduce((s, r) => s + r.cnt, 0);
      const weightedSum = weightedRows.reduce((s, r) => s + r.cnt * (r.cnt / 14), 0);
      weightedRate = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
    }

    // 连续打卡排行
    const [streakRows] = await pool.execute(
      `SELECT cc.user_id, COUNT(*) as streak FROM camp_checkins cc
       JOIN camp_members cm ON cc.user_id = cm.user_id AND cc.camp_id = cm.camp_id
       WHERE cc.camp_id = ? AND cc.checkin_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
       AND cm.is_active = 1
       GROUP BY cc.user_id ORDER BY streak DESC LIMIT 5`,
      [campId]
    );
    const topStreaks = streakRows.map(r => ({
      streak: r.streak,
      label: `有用户连续打卡 ${r.streak} 天`,
    }));

    const groupMsg = todayCnt > 0
      ? (todayRate >= 80 ? `🔥 今日 ${todayCnt}/${memCnt} 人打卡，热情高涨！`
        : todayRate >= 50 ? `👍 今日 ${todayCnt}/${memCnt} 人打卡，一起坚持！`
        : `🤝 今日 ${todayCnt}/${memCnt} 人打卡，慢慢来。`)
      : '来成为今天第一个打卡的人吧！';

    res.json({
      code: 200,
      data: {
        memberCount: memCnt,
        todayCheckinCount: todayCnt,
        todayCheckinRate: todayRate,
        weightedCheckinRate: weightedRate,
        groupMessage: groupMsg,
        topStreaks,
      },
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

/**
 * 离开挑战营
 */
async function leaveCamp(req, res) {
  try {
    const { userId } = req.params;

    await pool.execute(
      'UPDATE camp_members SET is_active = 0 WHERE user_id = ? AND is_active = 1',
      [userId]
    );

    res.json({ code: 200, message: '已退出挑战营。随时欢迎回来！' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '操作失败' });
  }
}

// ============================================================
// 二、话题圈 API
// ============================================================

/**
 * 获取帖子列表
 */
async function getPostList(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [posts] = await pool.execute(
      `SELECT id, display_name, sanitized_content as content, likes, created_at
       FROM topic_posts
       WHERE is_approved = 1
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    const [total] = await pool.execute(
      'SELECT COUNT(*) as cnt FROM topic_posts WHERE is_approved = 1'
    );

    res.json({
      code: 200,
      data: {
        posts: posts.map(p => ({
          ...p,
          content: p.content || '(内容已编辑)',
          timeAgo: timeAgo(p.created_at),
        })),
        total: total[0].cnt,
        page: parseInt(page),
        hasMore: offset + posts.length < total[0].cnt,
      },
    });
  } catch (error) {
    console.error('获取帖子失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

/**
 * 发布帖子
 */
async function createPost(req, res) {
  try {
    const { userId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ code: 400, message: '内容至少5个字符' });
    }

    if (content.length > 500) {
      return res.status(400).json({ code: 400, message: '内容不能超过500字' });
    }

    // 内容审核
    const moderation = moderateContent(content);

    if (!moderation.approved) {
      return res.status(400).json({
        code: 400,
        message: moderation.message,
        risk: moderation.risk,
      });
    }

    // 匿名显示名
    const displayName = `匿名睡友${String(userId).slice(-4)}`;

    const [result] = await pool.execute(
      `INSERT INTO topic_posts (user_id, display_name, content, sanitized_content, risk_level, is_approved)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [userId, displayName, content, moderation.sanitized, moderation.risk]
    );

    res.json({
      code: 200,
      message: moderation.message || '✅ 发布成功！感谢你的分享，每一次记录都是进步。',
      data: { id: result.insertId, risk: moderation.risk },
    });
  } catch (error) {
    console.error('发帖失败:', error);
    res.status(500).json({ code: 500, message: '发布失败' });
  }
}

/**
 * 点赞帖子
 */
async function likePost(req, res) {
  try {
    const { postId } = req.params;

    await pool.execute(
      'UPDATE topic_posts SET likes = likes + 1 WHERE id = ?',
      [postId]
    );

    res.json({ code: 200, message: '已点赞' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '操作失败' });
  }
}

// ============================================================
// 工具函数
// ============================================================

function timeAgo(dateStr) {
  const now = new Date();
  const past = new Date(dateStr);
  const diff = Math.floor((now - past) / 1000);

  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  if (diff < 604800) return Math.floor(diff / 86400) + '天前';
  return past.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

module.exports = {
  getCampList,
  joinCamp,
  getMyCamp,
  checkInCamp,
  getCampStats,
  leaveCamp,
  getPostList,
  createPost,
  likePost,
};
