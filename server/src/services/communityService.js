/**
 * 社区服务
 * 匿名睡眠挑战营 / 还债日记话题圈 / 内容审核
 */

// ============================================================
// 一、内容审核
// ============================================================

// 负面关键词库（会触发拦截或标记）
const NEGATIVE_KEYWORDS = [
  '自杀', '想死', '活不下去', '绝望', '崩溃', '完蛋',
  '自残', '伤害自己', '不想活', '没有希望', '毫无意义',
  '去死', '死了算了', '生无可恋', '了结', '轻生',
];

// 高风险词（直接拦截）
const HIGH_RISK_KEYWORDS = [
  '自杀', '想死', '活不下去', '自残', '伤害自己', '去死', '死了算了', '轻生',
];

// 温和引导词（替换为积极内容）
const NEGATIVE_PATTERNS = [
  { pattern: /又失眠了|又没睡|又睡不着/g, replacement: '昨晚睡眠遇到了一些挑战' },
  { pattern: /我完蛋了|我废了|我完了/g, replacement: '我需要一些调整' },
  { pattern: /太痛苦了|折磨/g, replacement: '不太舒服' },
];

/**
 * 审核内容
 * @returns {{ approved: boolean, risk: 'low'|'medium'|'high', message: string, sanitized: string }}
 */
function moderateContent(text) {
  if (!text || text.trim().length === 0) {
    return { approved: false, risk: 'low', message: '内容不能为空', sanitized: '' };
  }

  // 检查高风险词
  for (const kw of HIGH_RISK_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        approved: false,
        risk: 'high',
        message: '我们注意到您的内容可能表达了较强烈的负面情绪。如果您正在经历困难时期，请寻求专业帮助。社区鼓励分享积极的CBT-I实践经验。',
        sanitized: text.replace(new RegExp(kw, 'g'), '***'),
      };
    }
  }

  // 检查一般负面词
  let risk = 'low';
  for (const kw of NEGATIVE_KEYWORDS) {
    if (text.includes(kw)) {
      risk = 'medium';
      break;
    }
  }

  // 温和处理
  let sanitized = text;
  for (const { pattern, replacement } of NEGATIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  if (risk === 'medium') {
    return {
      approved: true,
      risk: 'medium',
      message: '内容已发布。我们注意到一些负面表达，CBT-I是一个循序渐进的过程，每一步都在变好。',
      sanitized,
    };
  }

  return { approved: true, risk: 'low', message: '', sanitized };
}

// ============================================================
// 二、挑战营核心逻辑
// ============================================================

const CAMP_SCHEDULES = [
  {
    id: 'early_bird_22_6',
    name: '早鸟计划',
    description: '22:30上床 · 6:00起床',
    bedTime: '22:30',
    wakeTime: '06:00',
    icon: '🌅',
    timeInBed: '7.5小时',
    difficulty: '进阶',
  },
  {
    id: 'standard_23_7',
    name: '标准作息',
    description: '23:00上床 · 7:00起床',
    bedTime: '23:00',
    wakeTime: '07:00',
    icon: '⏰',
    timeInBed: '8小时',
    difficulty: '基础',
  },
  {
    id: 'night_owl_24_8',
    name: '夜猫子计划',
    description: '24:00上床 · 8:00起床',
    bedTime: '00:00',
    wakeTime: '08:00',
    icon: '🦉',
    timeInBed: '8小时',
    difficulty: '基础',
  },
];

/**
 * 计算群体平均睡眠效率（不展示原始数据，避免焦虑）
 */
function calcGroupEfficiency(checkins) {
  if (!checkins || checkins.length === 0) {
    return {
      participantCount: 0,
      avgEfficiency: null,
      message: '暂无数据，来成为第一个打卡的人吧！',
    };
  }

  const withEfficiency = checkins.filter(c => c.sleep_efficiency !== null);
  const total = withEfficiency.reduce((s, c) => s + parseFloat(c.sleep_efficiency || 0), 0);
  const avg = total / withEfficiency.length;

  // 只显示积极引导，不制造焦虑
  let message;
  if (avg >= 85) {
    message = `👏 今日 ${checkins.length} 人打卡，群体效率优秀！坚持规律作息的力量真大！`;
  } else if (avg >= 75) {
    message = `💪 今日 ${checkins.length} 人打卡，大家在稳步进步中。CBT-I 是一场马拉松，不是短跑。`;
  } else if (avg >= 65) {
    message = `🌱 今日 ${checkins.length} 人打卡，每个人都有自己的节奏。每一次记录都是进步。`;
  } else {
    message = `🤝 今日 ${checkins.length} 人打卡。睡眠改善需要时间，你并不孤单。`;
  }

  return {
    participantCount: checkins.length,
    avgEfficiency: Math.round(avg * 10) / 10,
    message,
    // 不显示具体分布，避免对比焦虑
  };
}

/**
 * 计算挑战营统计数据
 */
function calcCampStats(memberCount, recentCheckins) {
  const today = new Date().toISOString().slice(0, 10);
  const todayCheckins = recentCheckins.filter(c => c.checkin_date === today);
  const groupStats = calcGroupEfficiency(todayCheckins);

  // 连续打卡排行榜（取前5但不显示具体姓名）
  const streakData = calcStreaks(recentCheckins).slice(0, 5);

  return {
    memberCount,
    todayCheckinCount: todayCheckins.length,
    checkinRate: memberCount > 0 ? Math.round((todayCheckins.length / memberCount) * 100) : 0,
    groupEfficiency: groupStats.avgEfficiency,
    groupMessage: groupStats.message,
    topStreaks: streakData.map(s => ({
      streak: s.streak,
      label: `有用户连续打卡 ${s.streak} 天`,
    })),
  };
}

function calcStreaks(checkins) {
  const userDates = {};
  for (const c of checkins) {
    if (!userDates[c.user_id]) userDates[c.user_id] = new Set();
    userDates[c.user_id].add(c.checkin_date);
  }

  const streaks = [];
  for (const [userId, dates] of Object.entries(userDates)) {
    const sorted = [...dates].sort().reverse();
    let streak = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      const d1 = new Date(sorted[i]);
      const d2 = new Date(sorted[i + 1]);
      if ((d1 - d2) / (1000 * 60 * 60 * 24) === 1) {
        streak++;
      } else break;
    }
    streaks.push({ userId, streak });
  }

  return streaks.sort((a, b) => b.streak - a.streak);
}

module.exports = {
  CAMP_SCHEDULES,
  moderateContent,
  calcGroupEfficiency,
  calcCampStats,
  NEGATIVE_KEYWORDS,
  HIGH_RISK_KEYWORDS,
};
