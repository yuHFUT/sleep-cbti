/**
 * 睡眠改善周报服务
 * 以周为单位生成报告，对比干预前后变化
 */

// ============================================================
// 一、周报生成
// ============================================================

/**
 * 生成单周睡眠周报
 * @param {Array} diaries - 本周日记列表
 * @param {Array} prevDiaries - 上周日记列表（基线对比）
 * @param {Object} options - 额外选项
 */
function generateWeeklyReport(diaries, prevDiaries = [], options = {}) {
  const weekStart = options.weekStart || '';
  const weekEnd = options.weekEnd || '';
  const confidenceScore = options.confidenceScore || null;

  const validDiaries = diaries.filter(d => d.sleep_efficiency !== null);
  const validPrev = prevDiaries.filter(d => d.sleep_efficiency !== null);

  if (validDiaries.length === 0) {
    return { ready: false, message: '本周暂无睡眠日记数据' };
  }

  // 本周指标
  const current = calcWeekMetrics(validDiaries);

  // 上周指标（基线）
  const baseline = validPrev.length > 0 ? calcWeekMetrics(validPrev) : null;

  // 变化量
  const changes = baseline ? calcChanges(current, baseline) : null;

  // 趋势方向
  const trend = changes ? getTrend(changes) : {};

  // 评级
  const rating = getWeeklyRating(current, changes);

  // 生成建议
  const suggestions = generateSuggestions(current, changes);

  // 关键亮点
  const highlights = generateHighlights(current, changes);

  // 可视化数据
  const chart = {
    daily: validDiaries.map(d => ({
      date: d.diary_date,
      efficiency: parseFloat(d.sleep_efficiency) || 0,
      latency: d.sleep_latency || 0,
      energy: d.daytime_energy || 5,
    })),
  };

  return {
    ready: true,
    weekStart,
    weekEnd,
    rating,
    current,
    baseline,
    changes,
    trend,
    confidenceScore,
    highlights,
    suggestions,
    chart,
    generatedAt: new Date().toISOString(),
  };
}

function calcWeekMetrics(diaries) {
  const n = diaries.length;
  const sum = (arr, key) => arr.reduce((s, d) => s + (parseFloat(d[key]) || 0), 0);
  const avg = (arr, key) => n > 0 ? sum(arr, key) / n : 0;

  const avgEfficiency = avg(diaries, 'sleep_efficiency');
  const avgLatency = avg(diaries, 'sleep_latency');
  const avgAwakenings = avg(diaries, 'night_awakenings');
  const avgEnergy = avg(diaries, 'daytime_energy');

  // 睡眠效率达标天数（≥85%）
  const goodDays = diaries.filter(d => parseFloat(d.sleep_efficiency) >= 85).length;

  // 最佳/最差日
  const sortedEff = [...diaries].sort((a, b) => parseFloat(b.sleep_efficiency) - parseFloat(a.sleep_efficiency));
  const bestDay = sortedEff[0];
  const worstDay = sortedEff[sortedEff.length - 1];

  return {
    diaryCount: n,
    avgEfficiency: round2(avgEfficiency),
    avgLatency: Math.round(avgLatency),
    avgAwakenings: round2(avgAwakenings),
    avgEnergy: round2(avgEnergy),
    goodDays,
    goodDaysRate: n > 0 ? Math.round((goodDays / n) * 100) : 0,
    bestDay: bestDay ? {
      date: bestDay.diary_date,
      efficiency: parseFloat(bestDay.sleep_efficiency) || 0,
    } : null,
    worstDay: worstDay ? {
      date: worstDay.diary_date,
      efficiency: parseFloat(worstDay.sleep_efficiency) || 0,
    } : null,
  };
}

function calcChanges(current, baseline) {
  const diff = (c, b, key) => round2((c[key] || 0) - (b[key] || 0));
  const pct = (c, b, key) => {
    if (!b[key]) return null;
    return round2(((c[key] - b[key]) / b[key]) * 100);
  };

  return {
    efficiency: diff(current, baseline, 'avgEfficiency'),
    efficiencyPct: pct(current, baseline, 'avgEfficiency'),
    latency: diff(current, baseline, 'avgLatency'),
    latencyPct: pct(current, baseline, 'avgLatency'),
    awakenings: diff(current, baseline, 'avgAwakenings'),
    energy: diff(current, baseline, 'avgEnergy'),
    goodDays: diff(current, baseline, 'goodDays'),
  };
}

function getTrend(changes) {
  return {
    efficiency: changes.efficiency > 0 ? 'improving' : changes.efficiency < 0 ? 'declining' : 'stable',
    latency: changes.latency < 0 ? 'improving' : changes.latency > 0 ? 'worsening' : 'stable',
    overall: changes.efficiency >= 0 && changes.latency <= 0 ? 'improving'
      : changes.efficiency < -5 || changes.latency > 10 ? 'needs_attention'
      : 'stable',
  };
}

function getWeeklyRating(current, changes) {
  const eff = current.avgEfficiency;
  let score = 0;

  // 效率评分（0-40分）
  if (eff >= 90) score += 40;
  else if (eff >= 85) score += 35;
  else if (eff >= 75) score += 25;
  else if (eff >= 65) score += 15;
  else score += 5;

  // 改善趋势加分（0-30分）
  if (changes) {
    if (changes.efficiency >= 5) score += 30;
    else if (changes.efficiency >= 3) score += 20;
    else if (changes.efficiency >= 0) score += 15;
    else if (changes.efficiency > -5) score += 8;
    else score += 0;
  } else {
    score += 15; // 无基线数据，给中等分
  }

  // 日记天数（0-30分）
  const days = current.diaryCount;
  if (days >= 7) score += 30;
  else if (days >= 5) score += 20;
  else if (days >= 3) score += 10;
  else score += 5;

  // 评级
  let level, emoji, color;
  if (score >= 80) { level = '优秀'; emoji = '🌟'; color = '#52c41a'; }
  else if (score >= 60) { level = '良好'; emoji = '👍'; color = '#73d13d'; }
  else if (score >= 40) { level = '一般'; emoji = '📊'; color = '#faad14'; }
  else { level = '需要改善'; emoji = '💪'; color = '#ff7a45'; }

  return { score, level, emoji, color };
}

function generateSuggestions(current, changes) {
  const suggestions = [];

  if (current.avgEfficiency < 85) {
    suggestions.push('建议继续执行睡眠限制疗法，逐步压缩卧床时间以提高效率');
  }
  if (current.avgLatency > 30) {
    suggestions.push('入睡耗时偏长，睡前尝试腹式呼吸或渐进式肌肉放松');
  }
  if (current.diaryCount < 5) {
    suggestions.push('本周记录天数较少，坚持每日记录能获得更准确的分析');
  }
  if (changes && changes.efficiency < 0) {
    suggestions.push('本周效率有所下降，回顾是否有压力事件或作息变动影响了睡眠');
  }
  if (changes && changes.latency > 5) {
    suggestions.push('入睡时间变长，检查是否睡前使用电子设备或摄入咖啡因');
  }
  if (current.avgAwakenings > 2) {
    suggestions.push('夜醒次数较多，注意睡前减少液体摄入，保持卧室温度舒适');
  }
  if (suggestions.length === 0) {
    suggestions.push('本周表现不错！继续保持当前的睡眠卫生习惯和规律作息。');
  }

  return suggestions;
}

function generateHighlights(current, changes) {
  const highlights = [];

  if (current.goodDays >= 5) {
    highlights.push({ icon: '🏆', text: `本周有 ${current.goodDays} 天睡眠效率达到85%以上！` });
  }
  if (current.bestDay) {
    highlights.push({ icon: '⭐', text: `${formatDateCN(current.bestDay.date)} 是最佳睡眠日，效率 ${Math.round(current.bestDay.efficiency)}%` });
  }
  if (changes && changes.efficiency >= 5) {
    highlights.push({ icon: '📈', text: `睡眠效率比上周提升了 ${changes.efficiency}%，进步显著！` });
  }
  if (changes && changes.latency <= -5) {
    highlights.push({ icon: '🚀', text: `入睡时间比上周快了 ${Math.abs(changes.latency)} 分钟！` });
  }
  if (current.diaryCount === 7) {
    highlights.push({ icon: '📝', text: '连续7天完整记录，数据质量很高！' });
  }

  return highlights;
}

// ============================================================
// 二、成就系统
// ============================================================

const BADGE_DEFINITIONS = [
  {
    code: 'regular_star',
    name: '规律之星',
    icon: '⭐',
    description: '连续7天在固定时间上床和起床',
    condition: 'checkRegularStar',
  },
  {
    code: 'early_bird',
    name: '早起勇士',
    icon: '🌅',
    description: '连续5天在早上7点前起床',
    condition: 'checkEarlyBird',
  },
  {
    code: 'bed_experiment',
    name: '离床实验成功',
    icon: '🔬',
    description: '睡不着时主动离床，完成刺激控制实验至少3次',
    condition: 'checkBedExperiment',
  },
  {
    code: 'efficiency_master',
    name: '效率达人',
    icon: '📊',
    description: '连续3天睡眠效率达到90%以上',
    condition: 'checkEfficiencyMaster',
  },
  {
    code: 'diary_keeper',
    name: '日记记录员',
    icon: '📓',
    description: '累计记录14天睡眠日记',
    condition: 'checkDiaryKeeper',
  },
  {
    code: 'sleep_hygiene_champion',
    name: '卫生达人',
    icon: '🧹',
    description: '累计完成20个睡眠卫生任务',
    condition: 'checkHygieneChampion',
  },
  {
    code: 'cognitive_warrior',
    name: '认知战士',
    icon: '🧠',
    description: '完成7次认知重塑练习',
    condition: 'checkCognitiveWarrior',
  },
  {
    code: 'relaxation_lover',
    name: '放松爱好者',
    icon: '🧘',
    description: '完成5次放松训练',
    condition: 'checkRelaxationLover',
  },
  {
    code: 'stimulus_control_master',
    name: '刺激控制大师',
    icon: '🛌',
    description: '连续打卡刺激控制挑战7天',
    condition: 'checkStimulusControlMaster',
  },
  {
    code: 'one_month_veteran',
    name: '一月老将',
    icon: '🏅',
    description: '坚持使用30天',
    condition: 'checkOneMonthVeteran',
  },
  {
    code: 'no_medication',
    name: '自然睡眠者',
    icon: '🌿',
    description: '连续14天不使用助眠药物',
    condition: 'checkNoMedication',
  },
  {
    code: 'morning_person',
    name: '晨型人',
    icon: '☀️',
    description: '连续7天在早上6:30前起床',
    condition: 'checkMorningPerson',
  },
];

/**
 * 检查并解锁所有成就
 * @param {Object} context - { userId, pool }
 * @returns {Array} 新解锁的成就列表
 */
async function checkAndUnlockAchievements(context) {
  const { userId, pool } = context;
  const newlyUnlocked = [];

  // 获取已解锁的成就
  const [existing] = await pool.execute(
    'SELECT badge_code FROM achievements WHERE user_id = ?',
    [userId]
  );
  const existingCodes = new Set(existing.map(e => e.badge_code));

  for (const badge of BADGE_DEFINITIONS) {
    if (existingCodes.has(badge.code)) continue; // 已解锁，跳过

    const unlocked = await ACHIEVEMENT_CHECKS[badge.condition]?.(context);
    if (unlocked) {
      await pool.execute(
        `INSERT INTO achievements (user_id, badge_code, badge_name) VALUES (?, ?, ?)`,
        [userId, badge.code, badge.name]
      );
      newlyUnlocked.push(badge);
    }
  }

  return newlyUnlocked;
}

/**
 * 获取所有成就（含解锁状态）
 */
async function getAllAchievements(context) {
  const { userId, pool } = context;

  const [earned] = await pool.execute(
    'SELECT badge_code, earned_at FROM achievements WHERE user_id = ?',
    [userId]
  );
  const earnedMap = new Map(earned.map(e => [e.badge_code, e.earned_at]));

  return BADGE_DEFINITIONS.map(badge => ({
    ...badge,
    unlocked: earnedMap.has(badge.code),
    earnedAt: earnedMap.get(badge.code) || null,
  }));
}

// 各项成就的检查逻辑
const ACHIEVEMENT_CHECKS = {
  async checkRegularStar({ userId, pool }) {
    const [rows] = await pool.execute(
      `SELECT diary_date, bed_time, wake_up_time FROM sleep_diaries
       WHERE user_id = ? ORDER BY diary_date DESC LIMIT 7`,
      [userId]
    );
    if (rows.length < 7) return false;
    // 检查时间差不超过1小时
    const bedTimes = rows.map(r => timeToMin(r.bed_time));
    const wakeTimes = rows.map(r => timeToMin(r.wake_up_time));
    const bedRange = Math.max(...bedTimes) - Math.min(...bedTimes);
    const wakeRange = Math.max(...wakeTimes) - Math.min(...wakeTimes);
    return bedRange <= 60 && wakeRange <= 60;
  },

  async checkEarlyBird({ userId, pool }) {
    const [rows] = await pool.execute(
      `SELECT diary_date, wake_up_time FROM sleep_diaries
       WHERE user_id = ? ORDER BY diary_date DESC LIMIT 5`,
      [userId]
    );
    if (rows.length < 5) return false;
    return rows.every(r => {
      const min = timeToMin(r.wake_up_time);
      return min <= 7 * 60 && min >= 4 * 60; // 4:00-7:00
    });
  },

  async checkBedExperiment({ userId, pool }) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM daily_tasks
       WHERE user_id = ? AND task_type = 'stimulus_control' AND is_completed = 1`,
      [userId]
    );
    return rows[0].cnt >= 3;
  },

  async checkEfficiencyMaster({ userId, pool }) {
    const [rows] = await pool.execute(
      `SELECT diary_date, sleep_efficiency FROM sleep_diaries
       WHERE user_id = ? AND sleep_efficiency IS NOT NULL
       ORDER BY diary_date DESC LIMIT 3`,
      [userId]
    );
    if (rows.length < 3) return false;
    return rows.every(r => parseFloat(r.sleep_efficiency) >= 90);
  },

  async checkDiaryKeeper({ userId, pool }) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as cnt FROM sleep_diaries WHERE user_id = ?',
      [userId]
    );
    return rows[0].cnt >= 14;
  },

  async checkHygieneChampion({ userId, pool }) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM daily_tasks
       WHERE user_id = ? AND is_completed = 1
       AND task_type NOT IN ('stimulus_control', 'cognitive_restructure')`,
      [userId]
    );
    return rows[0].cnt >= 20;
  },

  async checkCognitiveWarrior({ userId, pool }) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM daily_tasks
       WHERE user_id = ? AND task_type = 'cognitive_restructure' AND is_completed = 1`,
      [userId]
    );
    return rows[0].cnt >= 7;
  },

  async checkRelaxationLover({ userId, pool }) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM daily_tasks
       WHERE user_id = ? AND task_type LIKE 'relax_%' AND is_completed = 1`,
      [userId]
    );
    return rows[0].cnt >= 5;
  },

  async checkStimulusControlMaster({ userId, pool }) {
    const [rows] = await pool.execute(
      `SELECT COUNT(DISTINCT task_date) as cnt FROM daily_tasks
       WHERE user_id = ? AND task_type = 'stimulus_control' AND is_completed = 1
       ORDER BY task_date DESC LIMIT 7`,
      [userId]
    );
    return rows[0].cnt >= 7;
  },

  async checkOneMonthVeteran({ userId, pool }) {
    const [rows] = await pool.execute(
      `SELECT MIN(diary_date) as first_date FROM sleep_diaries WHERE user_id = ?`,
      [userId]
    );
    if (!rows[0].first_date) return false;
    const first = new Date(rows[0].first_date);
    const days = Math.floor((Date.now() - first.getTime()) / (1000 * 60 * 60 * 24));
    return days >= 30;
  },

  async checkNoMedication({ userId, pool }) {
    // 通过 PSQI 条目7检查是否使用药物
    const [rows] = await pool.execute(
      `SELECT answers FROM assessments
       WHERE user_id = ? AND scale_type = 'PSQI'
       ORDER BY completed_at DESC LIMIT 1`,
      [userId]
    );
    if (rows.length === 0) return false;
    const answers = JSON.parse(rows[0].answers || '{}');
    // q7: 0 = 无药物使用
    return parseInt(answers.q7 || '0') === 0;
  },

  async checkMorningPerson({ userId, pool }) {
    const [rows] = await pool.execute(
      `SELECT diary_date, wake_up_time FROM sleep_diaries
       WHERE user_id = ? ORDER BY diary_date DESC LIMIT 7`,
      [userId]
    );
    if (rows.length < 7) return false;
    return rows.every(r => {
      const min = timeToMin(r.wake_up_time);
      return min <= 6 * 60 + 30 && min >= 4 * 60;
    });
  },
};

function timeToMin(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.toString().split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function round2(val) {
  return Math.round(val * 10) / 10;
}

function formatDateCN(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

module.exports = {
  generateWeeklyReport,
  checkAndUnlockAchievements,
  getAllAchievements,
  BADGE_DEFINITIONS,
};
