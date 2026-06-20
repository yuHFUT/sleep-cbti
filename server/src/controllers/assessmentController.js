const { pool } = require('../config/db');
const {
  calculatePSQI,
  calculateSHPS,
  calculateDBAS16,
  generateRadarData,
  matchInterventions,
} = require('../services/scaleService');

/**
 * 提交 PSQI 评估
 */
async function submitPSQI(req, res) {
  try {
    const { userId, answers } = req.body;
    if (!userId || !answers) {
      return res.status(400).json({ code: 400, message: '缺少必要参数 userId 或 answers' });
    }

    const result = calculatePSQI(answers);

    // 保存到数据库
    const [dbResult] = await pool.execute(
      `INSERT INTO assessments (user_id, scale_type, total_score, dimension_scores, answers)
       VALUES (?, 'PSQI', ?, ?, ?)`,
      [userId, result.totalScore, JSON.stringify(result.components), JSON.stringify(answers)]
    );

    res.json({
      code: 200,
      message: 'PSQI 评估完成',
      data: {
        id: dbResult.insertId,
        scaleType: 'PSQI',
        ...result,
      },
    });
  } catch (error) {
    console.error('PSQI 评估失败:', error);
    res.status(500).json({ code: 500, message: '评估失败' });
  }
}

/**
 * 提交 SHPS 评估
 */
async function submitSHPS(req, res) {
  try {
    const { userId, answers } = req.body;
    if (!userId || !answers) {
      return res.status(400).json({ code: 400, message: '缺少必要参数 userId 或 answers' });
    }

    const result = calculateSHPS(answers);

    const [dbResult] = await pool.execute(
      `INSERT INTO assessments (user_id, scale_type, total_score, dimension_scores, answers)
       VALUES (?, 'SHPS', ?, ?, ?)`,
      [userId, result.totalScore, JSON.stringify(result.dimensions), JSON.stringify(answers)]
    );

    res.json({
      code: 200,
      message: 'SHPS 评估完成',
      data: { id: dbResult.insertId, scaleType: 'SHPS', ...result },
    });
  } catch (error) {
    console.error('SHPS 评估失败:', error);
    res.status(500).json({ code: 500, message: '评估失败' });
  }
}

/**
 * 提交 DBAS-16 评估
 */
async function submitDBAS16(req, res) {
  try {
    const { userId, answers } = req.body;
    if (!userId || !answers) {
      return res.status(400).json({ code: 400, message: '缺少必要参数 userId 或 answers' });
    }

    const result = calculateDBAS16(answers);

    const [dbResult] = await pool.execute(
      `INSERT INTO assessments (user_id, scale_type, total_score, dimension_scores, answers)
       VALUES (?, 'DBAS-16', ?, ?, ?)`,
      [userId, result.averageScore, JSON.stringify(result.dimensions), JSON.stringify(answers)]
    );

    res.json({
      code: 200,
      message: 'DBAS-16 评估完成',
      data: { id: dbResult.insertId, scaleType: 'DBAS-16', ...result },
    });
  } catch (error) {
    console.error('DBAS-16 评估失败:', error);
    res.status(500).json({ code: 500, message: '评估失败' });
  }
}

/**
 * 获取综合评估报告（含雷达图 + 干预建议）
 */
async function getReport(req, res) {
  try {
    const { userId } = req.params;

    // 获取最近一次各量表结果
    const [psqiRows] = await pool.execute(
      `SELECT * FROM assessments WHERE user_id = ? AND scale_type = 'PSQI' ORDER BY completed_at DESC LIMIT 1`,
      [userId]
    );
    const [shpsRows] = await pool.execute(
      `SELECT * FROM assessments WHERE user_id = ? AND scale_type = 'SHPS' ORDER BY completed_at DESC LIMIT 1`,
      [userId]
    );
    const [dbas16Rows] = await pool.execute(
      `SELECT * FROM assessments WHERE user_id = ? AND scale_type = 'DBAS-16' ORDER BY completed_at DESC LIMIT 1`,
      [userId]
    );

    if (!psqiRows.length || !shpsRows.length || !dbas16Rows.length) {
      return res.json({
        code: 200,
        data: {
          complete: false,
          missing: [
            !psqiRows.length && 'PSQI',
            !shpsRows.length && 'SHPS',
            !dbas16Rows.length && 'DBAS-16',
          ].filter(Boolean),
          message: '请完成全部三个量表以获取综合报告',
        },
      });
    }

    const psqiResult = {
      components: JSON.parse(psqiRows[0].dimension_scores),
      totalScore: psqiRows[0].total_score,
      efficiency: JSON.parse(psqiRows[0].dimension_scores).D?.efficiency || 0,
    };
    const shpsResult = {
      dimensions: JSON.parse(shpsRows[0].dimension_scores),
      totalScore: shpsRows[0].total_score,
      maxScore: 133,
    };
    const dbas16Result = {
      dimensions: JSON.parse(dbas16Rows[0].dimension_scores),
      averageScore: dbas16Rows[0].total_score,
      maxScore: 10,
      needsCognitiveRestructure: dbas16Rows[0].total_score >= 4.0,
    };

    const radarData = generateRadarData(psqiResult, shpsResult, dbas16Result);
    const interventions = matchInterventions(psqiResult, shpsResult, dbas16Result);

    res.json({
      code: 200,
      data: {
        complete: true,
        radarData,
        interventions,
        psqi: { totalScore: psqiResult.totalScore, components: psqiResult.components },
        shps: { totalScore: shpsResult.totalScore, dimensions: shpsResult.dimensions },
        dbas16: { averageScore: dbas16Result.averageScore, dimensions: dbas16Result.dimensions },
        summary: generateSummary(psqiResult.totalScore, shpsResult.totalScore, dbas16Result.averageScore, interventions),
      },
    });
  } catch (error) {
    console.error('获取报告失败:', error);
    res.status(500).json({ code: 500, message: '获取报告失败' });
  }
}

/**
 * 统一保存（H5测评结果）
 */
async function saveUnified(req, res) {
  try {
    const { userId, scores } = req.body;
    if (!userId || !scores) {
      return res.status(400).json({ code: 400, message: '缺少参数' });
    }

    await pool.execute(
      `INSERT INTO assessments (user_id, scale_type, total_score, dimension_scores, answers)
       VALUES (?, 'UNIFIED', ?, ?, ?)`,
      [userId, scores.total, JSON.stringify(scores), JSON.stringify(scores)]
    );

    res.json({ code: 200, message: '保存成功' });
  } catch (error) {
    console.error('保存失败:', error);
    res.status(500).json({ code: 500, message: '保存失败' });
  }
}

/**
 * 获取用户评估历史
 */
async function getHistory(req, res) {
  try {
    const { userId } = req.params;

    const [rows] = await pool.execute(
      `SELECT id, scale_type, total_score, dimension_scores, completed_at
       FROM assessments WHERE user_id = ? AND scale_type = 'UNIFIED'
       ORDER BY completed_at DESC LIMIT 20`,
      [userId]
    );

    const list = rows.map(r => {
      const dims = typeof r.dimension_scores === 'string'
        ? JSON.parse(r.dimension_scores) : (r.dimension_scores || {});
      return {
        id: r.id,
        total_score: r.total_score,
        sleep_quality: dims.sleepQuality,
        duration: dims.duration,
        habit: dims.habit,
        cognition: dims.cognition,
        completed_at: r.completed_at,
      };
    });

    res.json({ code: 200, data: list });
  } catch (error) {
    console.error('获取历史失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

// ===== 旧版 getHistory 保留为 getHistoryOld =====
async function getHistoryOld(req, res) {
  try {
    const { userId } = req.params;
    const { scaleType } = req.query;

    let sql = 'SELECT id, scale_type, total_score, completed_at FROM assessments WHERE user_id = ?';
    const params = [userId];

    if (scaleType) {
      sql += ' AND scale_type = ?';
      params.push(scaleType);
    }

    sql += ' ORDER BY completed_at DESC';

    const [rows] = await pool.execute(sql, params);

    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error('获取评估历史失败:', error);
    res.status(500).json({ code: 500, message: '获取历史失败' });
  }
}

function generateSummary(psqiTotal, shpsTotal, dbas16Avg, interventions) {
  const issues = [];
  if (psqiTotal > 5) issues.push('主观睡眠质量偏差');
  if (shpsTotal > 66) issues.push('存在不良睡眠卫生习惯');
  if (dbas16Avg >= 4.0) issues.push('存在不合理睡眠信念');

  if (issues.length === 0) {
    return '您的综合睡眠状况良好。建议保持当前健康习惯，关注睡眠规律性。';
  }

  const topIntervention = interventions[0]?.name || '综合干预';
  return `评估发现：${issues.join('、')}。已为您生成「${topIntervention}」为主的个性化干预方案，请在"干预处方"模块查看详情。`;
}

module.exports = { submitPSQI, submitSHPS, submitDBAS16, saveUnified, getReport, getHistory };
