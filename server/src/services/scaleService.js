/**
 * 三大量表计分服务
 * PSQI（匹兹堡睡眠质量指数）、SHPS（睡眠卫生习惯量表）、DBAS-16（睡眠信念与态度量表）
 */

// ============================================================
// 一、PSQI 计分
// ============================================================

/**
 * 计算 PSQI 各成分得分和总分
 * @param {Object} answers - 用户答案
 * @returns {Object} { components, totalScore, level }
 */
function calculatePSQI(answers) {
  // 提取各条目
  const item1 = answers.q1;   // 上床时间 (HH:mm)
  const item2 = parseInt(answers.q2);   // 入睡耗时（分钟）
  const item3 = answers.q3;   // 起床时间 (HH:mm)
  const item4 = parseFloat(answers.q4); // 实际睡眠小时数
  const item5a = parseInt(answers.q5a); // 入睡困难
  const item5b = parseInt(answers.q5b); // 夜间易醒或早醒
  const item5c = parseInt(answers.q5c); // 夜间去厕所
  const item5d = parseInt(answers.q5d); // 呼吸不畅
  const item5e = parseInt(answers.q5e); // 咳嗽或鼾声高
  const item5f = parseInt(answers.q5f); // 感觉冷
  const item5g = parseInt(answers.q5g); // 感觉热
  const item5h = parseInt(answers.q5h); // 做噩梦
  const item5i = parseInt(answers.q5i); // 疼痛不适
  const item5j = parseInt(answers.q5j || 0); // 其他原因
  const item6 = parseInt(answers.q6);    // 主观睡眠质量
  const item7 = parseInt(answers.q7);    // 催眠药物
  const item8 = parseInt(answers.q8);    // 难以保持清醒
  const item9 = parseInt(answers.q9);    // 精力不足

  // 成分A：主观睡眠质量（条目6）
  const compA = item6;

  // 成分B：入睡时间（条目2 + 条目5a）
  let item2Score;
  if (item2 <= 15) item2Score = 0;
  else if (item2 <= 30) item2Score = 1;
  else if (item2 <= 60) item2Score = 2;
  else item2Score = 3;
  const compBRaw = item2Score + item5a;
  let compB;
  if (compBRaw === 0) compB = 0;
  else if (compBRaw <= 2) compB = 1;
  else if (compBRaw <= 4) compB = 2;
  else compB = 3;

  // 成分C：睡眠时间（条目4）
  let compC;
  if (item4 > 7) compC = 0;
  else if (item4 >= 6) compC = 1;
  else if (item4 >= 5) compC = 2;
  else compC = 3;

  // 成分D：睡眠效率
  const bedTime = timeToMinutes(item1);
  const wakeTime = timeToMinutes(item3);
  let timeInBed = wakeTime - bedTime;
  if (timeInBed <= 0) timeInBed = 480; // 如果跨天或异常，默认8小时卧床
  const efficiency = (item4 * 60) / timeInBed * 100;
  let compD;
  if (efficiency > 85) compD = 0;
  else if (efficiency >= 75) compD = 1;
  else if (efficiency >= 65) compD = 2;
  else compD = 3;

  // 成分E：睡眠障碍（条目5b~5j）
  const compERaw = item5b + item5c + item5d + item5e + item5f + item5g + item5h + item5i + item5j;
  let compE;
  if (compERaw === 0) compE = 0;
  else if (compERaw <= 9) compE = 1;
  else if (compERaw <= 18) compE = 2;
  else compE = 3;

  // 成分F：催眠药物使用（条目7）
  const compF = item7;

  // 成分G：日间功能障碍（条目8 + 条目9）
  const compGRaw = item8 + item9;
  let compG;
  if (compGRaw === 0) compG = 0;
  else if (compGRaw <= 2) compG = 1;
  else if (compGRaw <= 4) compG = 2;
  else compG = 3;

  const totalScore = compA + compB + compC + compD + compE + compF + compG;

  // 等级判定
  let level;
  if (totalScore <= 5) level = '睡眠质量很好';
  else if (totalScore <= 10) level = '睡眠质量还行';
  else if (totalScore <= 15) level = '睡眠质量一般';
  else level = '睡眠质量很差';

  return {
    components: {
      A: { name: '主观睡眠质量', score: compA },
      B: { name: '入睡时间', score: compB },
      C: { name: '睡眠时间', score: compC },
      D: { name: '睡眠效率', score: compD, efficiency: Math.round(efficiency) },
      E: { name: '睡眠障碍', score: compE },
      F: { name: '催眠药物使用', score: compF },
      G: { name: '日间功能障碍', score: compG },
    },
    totalScore,
    maxScore: 21,
    level,
    isInsomniaRisk: totalScore > 5,
    efficiency,
  };
}

// ============================================================
// 二、SHPS 计分（19题版，0-7分 Likert）
// ============================================================

/**
 * 计算 SHPS 各维度得分和总分
 * @param {Object} answers - 用户答案（q1~q19，每题0-7分）
 * @returns {Object} { dimensions, totalScore, level }
 */
function calculateSHPS(answers) {
  // 维度映射
  const dimSchedule = ['q1', 'q2', 'q3', 'q4'];        // 睡眠规律性
  const dimArousal = ['q5', 'q6', 'q7', 'q8', 'q9'];   // 睡前觉醒
  const dimEating = ['q10', 'q11', 'q12', 'q13', 'q14']; // 睡前饮食
  const dimEnvironment = ['q15', 'q16', 'q17', 'q18', 'q19']; // 睡眠环境

  // 反向计分题号（16-19 是健康行为，需要反向）
  const reverseItems = ['q16', 'q17', 'q18', 'q19'];

  function getScore(key) {
    const raw = parseInt(answers[key]) || 0;
    return reverseItems.includes(key) ? (7 - raw) : raw;
  }

  function sumDim(items) {
    return items.reduce((sum, k) => sum + getScore(k), 0);
  }

  const scheduleScore = sumDim(dimSchedule);
  const arousalScore = sumDim(dimArousal);
  const eatingScore = sumDim(dimEating);
  const environmentScore = sumDim(dimEnvironment);
  const totalScore = scheduleScore + arousalScore + eatingScore + environmentScore;

  // 等级判定
  let level;
  if (totalScore <= 33) level = '睡眠卫生习惯良好';
  else if (totalScore <= 66) level = '睡眠卫生习惯一般';
  else if (totalScore <= 99) level = '睡眠卫生习惯较差';
  else level = '睡眠卫生习惯很差';

  return {
    dimensions: {
      schedule: { name: '睡眠规律性', score: scheduleScore, max: 28 },
      arousal: { name: '睡前觉醒行为', score: arousalScore, max: 35 },
      eating: { name: '睡前饮食与物质使用', score: eatingScore, max: 35 },
      environment: { name: '睡眠环境', score: environmentScore, max: 35 },
    },
    totalScore,
    maxScore: 133,
    level,
  };
}

// ============================================================
// 三、DBAS-16 计分（0-10分 Likert）
// ============================================================

/**
 * 计算 DBAS-16 各维度得分和平均分
 * @param {Object} answers - 用户答案（q1~q16，每题0-10分）
 * @returns {Object} { dimensions, averageScore, level }
 */
function calculateDBAS16(answers) {
  const dimConsequences = ['q5', 'q7', 'q9', 'q12', 'q16'];
  const dimWorry = ['q3', 'q4', 'q8', 'q10', 'q11', 'q14'];
  const dimExpectations = ['q1', 'q2'];
  const dimMedication = ['q6', 'q13', 'q15'];

  function getScore(key) {
    return parseInt(answers[key]) || 0;
  }

  function avgDim(items) {
    const sum = items.reduce((s, k) => s + getScore(k), 0);
    return parseFloat((sum / items.length).toFixed(2));
  }

  const consequencesAvg = avgDim(dimConsequences);
  const worryAvg = avgDim(dimWorry);
  const expectationsAvg = avgDim(dimExpectations);
  const medicationAvg = avgDim(dimMedication);

  // 总分是16题平均
  const allKeys = [...dimConsequences, ...dimWorry, ...dimExpectations, ...dimMedication];
  const totalSum = allKeys.reduce((s, k) => s + getScore(k), 0);
  const averageScore = parseFloat((totalSum / 16).toFixed(2));

  // 等级判定
  let level;
  if (averageScore < 3.5) level = '睡眠信念基本健康';
  else if (averageScore < 4.0) level = '存在轻度不合理信念';
  else if (averageScore <= 5.0) level = '存在临床显著不合理信念';
  else level = '不合理信念较严重';

  return {
    dimensions: {
      consequences: { name: '失眠所致后果', score: consequencesAvg },
      worry: { name: '对睡眠的担忧/无助感', score: worryAvg },
      expectations: { name: '对睡眠的期望', score: expectationsAvg },
      medication: { name: '药物使用信念', score: medicationAvg },
    },
    averageScore,
    maxScore: 10,
    level,
    needsCognitiveRestructure: averageScore >= 4.0,
  };
}

// ============================================================
// 四、睡眠六维图数据生成（综合三个量表）
// ============================================================

/**
 * 综合三个量表结果，生成"睡眠六维图"数据
 * @param {Object} psqiResult
 * @param {Object} shpsResult
 * @param {Object} dbas16Result
 * @returns {Array} 六个维度的评分（0-100）
 */
function generateRadarData(psqiResult, shpsResult, dbas16Result) {
  return [
    {
      key: 'sleep_onset',
      name: '入睡时间',
      // 来自 PSQI 成分B + SHPS 觉醒维度
      score: normalizeScore(
        (psqiResult.components.B.score / 3) * 50 +
        (shpsResult.dimensions.arousal.score / shpsResult.dimensions.arousal.max) * 50
      ),
      source: 'PSQI + SHPS',
    },
    {
      key: 'sleep_continuity',
      name: '睡眠连续性',
      // 来自 PSQI 成分E（睡眠障碍）
      score: normalizeScore((1 - psqiResult.components.E.score / 3) * 100),
      source: 'PSQI',
    },
    {
      key: 'duration',
      name: '睡眠时长',
      // 来自 PSQI 成分C + 成分D
      score: normalizeScore(
        (1 - psqiResult.components.C.score / 3) * 60 +
        (psqiResult.components.D.efficiency || 0) * 0.4
      ),
      source: 'PSQI',
    },
    {
      key: 'daytime_function',
      name: '日间功能',
      // 来自 PSQI 成分G
      score: normalizeScore((1 - psqiResult.components.G.score / 3) * 100),
      source: 'PSQI',
    },
    {
      key: 'habit_risk',
      name: '习惯风险',
      // 来自 SHPS 总分
      score: normalizeScore((1 - shpsResult.totalScore / shpsResult.maxScore) * 100),
      source: 'SHPS',
    },
    {
      key: 'dysfunctional_beliefs',
      name: '错误信念',
      // 来自 DBAS-16 平均分
      score: normalizeScore((1 - dbas16Result.averageScore / dbas16Result.maxScore) * 100),
      source: 'DBAS-16',
    },
  ];
}

// ============================================================
// 五、干预策略匹配
// ============================================================

/**
 * 根据评估结果匹配干预策略包
 * @param {Object} psqiResult
 * @param {Object} shpsResult
 * @param {Object} dbas16Result
 * @returns {Array} 推荐的干预策略列表
 */
function matchInterventions(psqiResult, shpsResult, dbas16Result) {
  const interventions = [];

  // 睡眠限制疗法：PSQI 成分D 睡眠效率 < 85%
  if (psqiResult.components.D.efficiency && psqiResult.components.D.efficiency < 85) {
    interventions.push({
      type: 'sleep_restriction',
      name: '睡眠限制疗法',
      priority: 'high',
      reason: `当前睡眠效率约 ${Math.round(psqiResult.components.D.efficiency)}%，低于85%，建议压缩卧床时间以提高睡眠效率`,
    });
  }

  // 刺激控制：PSQI 成分B 入睡困难
  if (psqiResult.components.B.score >= 2) {
    interventions.push({
      type: 'stimulus_control',
      name: '刺激控制疗法',
      priority: 'high',
      reason: '入睡时间较长，建议重建"床=睡眠"的条件反射',
    });
  }

  // 认知重构：DBAS-16 平均分 ≥ 4.0
  if (dbas16Result.needsCognitiveRestructure) {
    interventions.push({
      type: 'cognitive_restructure',
      name: '认知重塑练习',
      priority: 'high',
      reason: '存在对睡眠的不合理信念，建议进行认知重构训练',
    });
  }

  // 放松训练：PSQI 成分B 或 SHPS 觉醒维度
  if (psqiResult.components.B.score >= 2 || shpsResult.dimensions.arousal.score > 20) {
    interventions.push({
      type: 'relaxation',
      name: '放松训练',
      priority: 'medium',
      reason: '睡前觉醒水平较高，建议学习放松技巧',
    });
  }

  // 睡眠卫生教育：SHPS 总分高
  if (shpsResult.totalScore > 50) {
    interventions.push({
      type: 'sleep_hygiene',
      name: '睡眠卫生任务',
      priority: 'medium',
      reason: '存在不健康的睡眠卫生习惯，建议逐步改善',
    });
  }

  // 至少给一个基础建议
  if (interventions.length === 0) {
    interventions.push({
      type: 'sleep_hygiene',
      name: '睡眠卫生保持',
      priority: 'low',
      reason: '整体评估尚可，建议维持良好睡眠习惯',
    });
  }

  return interventions;
}

// ============================================================
// 工具函数
// ============================================================

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function normalizeScore(val) {
  return Math.max(0, Math.min(100, Math.round(val)));
}

module.exports = {
  calculatePSQI,
  calculateSHPS,
  calculateDBAS16,
  generateRadarData,
  matchInterventions,
};
