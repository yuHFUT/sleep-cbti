const { pool } = require('../config/db');
const {
  calculateSleepWindow,
  getStimulusControlCard,
  getCognitiveExercise,
  validateCognitiveExercise,
  RELAXATION_EXERCISES,
  SLEEP_HYGIENE_TASKS,
  getDailyTasks,
} = require('../services/interventionService');

/**
 * 获取睡眠限制处方（时间窗建议）
 */
async function getSleepRestriction(req, res) {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const [diaries] = await pool.execute(
      `SELECT diary_date, bed_time, wake_up_time, sleep_latency, night_awakenings, sleep_efficiency
       FROM sleep_diaries WHERE user_id = ?
       ORDER BY diary_date DESC LIMIT ?`,
      [userId, parseInt(days)]
    );

    const result = calculateSleepWindow(diaries.reverse()); // 按时间升序
    res.json({ code: 200, data: result });
  } catch (error) {
    console.error('睡眠限制计算失败:', error);
    res.status(500).json({ code: 500, message: '计算失败' });
  }
}

/**
 * 获取当日刺激控制卡片
 */
async function getStimulusCard(req, res) {
  try {
    const { userId } = req.params;

    // 根据用户干预天数获取卡片
    const [plans] = await pool.execute(
      `SELECT started_at FROM intervention_plans
       WHERE user_id = ? AND plan_type = 'stimulus_control' AND is_active = 1
       ORDER BY started_at DESC LIMIT 1`,
      [userId]
    );

    let dayIndex = 0;
    if (plans.length > 0) {
      const startDate = new Date(plans[0].started_at);
      dayIndex = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const card = getStimulusControlCard(dayIndex);

    // 查询今日是否已打卡
    const today = new Date().toISOString().slice(0, 10);
    const [tasks] = await pool.execute(
      `SELECT * FROM daily_tasks WHERE user_id = ? AND task_type = 'stimulus_control' AND task_date = ?`,
      [userId, today]
    );

    res.json({
      code: 200,
      data: {
        ...card,
        isCheckedIn: tasks.some(t => t.is_completed),
        today,
      },
    });
  } catch (error) {
    console.error('获取刺激控制卡片失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

/**
 * 刺激控制打卡
 */
async function checkInStimulus(req, res) {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().slice(0, 10);

    // 获取或创建干预方案
    let [plans] = await pool.execute(
      `SELECT id FROM intervention_plans
       WHERE user_id = ? AND plan_type = 'stimulus_control' AND is_active = 1`,
      [userId]
    );

    if (plans.length === 0) {
      const [insertPlan] = await pool.execute(
        `INSERT INTO intervention_plans (user_id, plan_type, plan_config) VALUES (?, 'stimulus_control', '{}')`,
        [userId]
      );
      plans = [{ id: insertPlan.insertId }];
    }

    // UPSERT 打卡记录
    await pool.execute(
      `INSERT INTO daily_tasks (user_id, plan_id, task_type, task_content, is_completed, task_date, completed_at)
       VALUES (?, ?, 'stimulus_control', '完成刺激控制挑战', 1, ?, NOW())
       ON DUPLICATE KEY UPDATE is_completed = 1, completed_at = NOW()`,
      [userId, plans[0].id, today]
    );

    res.json({ code: 200, message: '✅ 打卡成功！坚持刺激控制，重建健康的床-睡眠连接。' });
  } catch (error) {
    console.error('打卡失败:', error);
    res.status(500).json({ code: 500, message: '打卡失败' });
  }
}

/**
 * 获取当日认知重塑练习
 */
async function getCognitiveTask(req, res) {
  try {
    const { userId } = req.params;

    const [plans] = await pool.execute(
      `SELECT started_at FROM intervention_plans
       WHERE user_id = ? AND plan_type = 'cognitive_restructure' AND is_active = 1
       ORDER BY started_at DESC LIMIT 1`,
      [userId]
    );

    let dayIndex = 0;
    if (plans.length > 0) {
      const startDate = new Date(plans[0].started_at);
      dayIndex = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const exercise = getCognitiveExercise(dayIndex);

    // 查询今日是否已完成
    const today = new Date().toISOString().slice(0, 10);
    const [tasks] = await pool.execute(
      `SELECT * FROM daily_tasks WHERE user_id = ? AND task_type = 'cognitive_restructure' AND task_date = ?`,
      [userId, today]
    );

    res.json({
      code: 200,
      data: {
        ...exercise,
        isCompleted: tasks.some(t => t.is_completed),
        today,
      },
    });
  } catch (error) {
    console.error('获取认知练习失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

/**
 * 提交认知重塑练习
 */
async function submitCognitiveTask(req, res) {
  try {
    const { userId } = req.params;
    const { exerciseId, thoughtRecord, factCheck } = req.body;

    const validation = validateCognitiveExercise(exerciseId, { thoughtRecord, factCheck });

    if (!validation.valid) {
      return res.status(400).json({ code: 400, message: validation.message });
    }

    const today = new Date().toISOString().slice(0, 10);

    let [plans] = await pool.execute(
      `SELECT id FROM intervention_plans
       WHERE user_id = ? AND plan_type = 'cognitive_restructure' AND is_active = 1`,
      [userId]
    );

    if (plans.length === 0) {
      const [insertPlan] = await pool.execute(
        `INSERT INTO intervention_plans (user_id, plan_type, plan_config) VALUES (?, 'cognitive_restructure', ?)`,
        [userId, JSON.stringify({ exerciseId })]
      );
      plans = [{ id: insertPlan.insertId }];
    }

    await pool.execute(
      `INSERT INTO daily_tasks (user_id, plan_id, task_type, task_content, is_completed, task_date, completed_at)
       VALUES (?, ?, 'cognitive_restructure', ?, 1, ?, NOW())
       ON DUPLICATE KEY UPDATE task_content = VALUES(task_content), is_completed = 1, completed_at = NOW()`,
      [userId, plans[0].id, JSON.stringify({ exerciseId, thoughtRecord, factCheck }), today]
    );

    res.json({ code: 200, message: '✅ 认知练习完成！你已经迈出了改变睡眠信念的重要一步。' });
  } catch (error) {
    console.error('提交认知练习失败:', error);
    res.status(500).json({ code: 500, message: '提交失败' });
  }
}

/**
 * 获取放松训练列表
 */
async function getRelaxationList(req, res) {
  try {
    const list = RELAXATION_EXERCISES.map(e => ({
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      duration: e.duration,
      icon: e.icon,
    }));

    res.json({ code: 200, data: list });
  } catch (error) {
    console.error('获取放松训练失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

/**
 * 获取单个放松训练详情
 */
async function getRelaxationDetail(req, res) {
  try {
    const { exerciseId } = req.params;
    const exercise = RELAXATION_EXERCISES.find(e => e.id === exerciseId);

    if (!exercise) {
      return res.status(404).json({ code: 404, message: '放松训练不存在' });
    }

    res.json({ code: 200, data: exercise });
  } catch (error) {
    console.error('获取放松训练详情失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

/**
 * 获取每日睡眠卫生任务
 */
async function getDailySleepHygiene(req, res) {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().slice(0, 10);

    // 获取用户干预类型
    const [plans] = await pool.execute(
      `SELECT plan_type FROM intervention_plans WHERE user_id = ? AND is_active = 1`,
      [userId]
    );
    const interventionTypes = plans.map(p => p.plan_type);

    const tasks = getDailyTasks(interventionTypes);

    // 检查哪些已完成
    const [completed] = await pool.execute(
      `SELECT task_type FROM daily_tasks WHERE user_id = ? AND task_date = ? AND is_completed = 1`,
      [userId, today]
    );
    const completedIds = new Set(completed.map(c => c.task_type));

    const tasksWithStatus = tasks.map(t => ({
      ...t,
      isCompleted: completedIds.has(t.id),
    }));

    res.json({ code: 200, data: { today, tasks: tasksWithStatus } });
  } catch (error) {
    console.error('获取卫生任务失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

/**
 * 完成/取消睡眠卫生任务
 */
async function toggleSleepHygieneTask(req, res) {
  try {
    const { userId, taskId } = req.params;
    const { completed } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    const taskDef = SLEEP_HYGIENE_TASKS.find(t => t.id === taskId);
    if (!taskDef) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }

    if (completed) {
      // 创建/更新完成记录（不需要关联 plan，卫生任务独立）
      await pool.execute(
        `INSERT INTO daily_tasks (user_id, plan_id, task_type, task_content, is_completed, task_date, completed_at)
         VALUES (?, NULL, ?, ?, 1, ?, NOW())
         ON DUPLICATE KEY UPDATE is_completed = 1, completed_at = NOW()`,
        [userId, taskId, taskDef.task, today]
      );
      res.json({ code: 200, message: `✅ 「${taskDef.task}」已完成！+${taskDef.points}分` });
    } else {
      await pool.execute(
        `DELETE FROM daily_tasks WHERE user_id = ? AND task_type = ? AND task_date = ?`,
        [userId, taskId, today]
      );
      res.json({ code: 200, message: '已取消完成' });
    }
  } catch (error) {
    console.error('任务操作失败:', error);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
}

module.exports = {
  getSleepRestriction,
  getStimulusCard,
  checkInStimulus,
  getCognitiveTask,
  submitCognitiveTask,
  getRelaxationList,
  getRelaxationDetail,
  getDailySleepHygiene,
  toggleSleepHygieneTask,
};
