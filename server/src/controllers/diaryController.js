const { pool } = require('../config/db');

/**
 * 创建/更新睡眠日记
 */
async function saveDiary(req, res) {
  try {
    const { userId } = req.params;
    const {
      diaryDate,
      bedTime,
      lightsOffTime,
      sleepLatency,
      nightAwakenings,
      wakeUpTime,
      daytimeEnergy,
      notes,
    } = req.body;

    if (!diaryDate) {
      return res.status(400).json({ code: 400, message: '缺少日期' });
    }

    // 计算睡眠效率
    const efficiency = calcEfficiency(lightsOffTime, wakeUpTime, sleepLatency, nightAwakenings);

    // UPSERT: 同一天只能有一条记录
    const [result] = await pool.execute(
      `INSERT INTO sleep_diaries
        (user_id, diary_date, bed_time, lights_off_time, sleep_latency, night_awakenings, wake_up_time, daytime_energy, sleep_efficiency, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        bed_time = VALUES(bed_time),
        lights_off_time = VALUES(lights_off_time),
        sleep_latency = VALUES(sleep_latency),
        night_awakenings = VALUES(night_awakenings),
        wake_up_time = VALUES(wake_up_time),
        daytime_energy = VALUES(daytime_energy),
        sleep_efficiency = VALUES(sleep_efficiency),
        notes = VALUES(notes)`,
      [userId, diaryDate, bedTime, lightsOffTime, sleepLatency, nightAwakenings, wakeUpTime, daytimeEnergy, efficiency, notes || null]
    );

    // 返回刚保存的日记（含自动计算的睡眠效率）
    const [rows] = await pool.execute(
      'SELECT * FROM sleep_diaries WHERE user_id = ? AND diary_date = ?',
      [userId, diaryDate]
    );

    res.json({
      code: 200,
      message: result.affectedRows > 0 ? '日记保存成功' : '保存失败',
      data: rows[0] || null,
    });
  } catch (error) {
    console.error('保存日记失败:', error);
    res.status(500).json({ code: 500, message: '保存失败' });
  }
}

/**
 * 获取指定日期日记
 */
async function getDiary(req, res) {
  try {
    const { userId, date } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM sleep_diaries WHERE user_id = ? AND diary_date = ?',
      [userId, date]
    );

    res.json({
      code: 200,
      data: rows[0] || null,
    });
  } catch (error) {
    console.error('获取日记失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
}

/**
 * 获取日记列表（按日期范围）
 */
async function getDiaryList(req, res) {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;

    let sql = 'SELECT * FROM sleep_diaries WHERE user_id = ?';
    const params = [userId];

    if (startDate) {
      sql += ' AND diary_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND diary_date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY diary_date DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await pool.execute(sql, params);

    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error('获取日记列表失败:', error);
    res.status(500).json({ code: 500, message: '获取列表失败' });
  }
}

/**
 * 获取睡眠效率趋势（最近N天）
 */
async function getEfficiencyTrend(req, res) {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const [rows] = await pool.execute(
      `SELECT diary_date, sleep_efficiency, sleep_latency, daytime_energy
       FROM sleep_diaries
       WHERE user_id = ? AND sleep_efficiency IS NOT NULL
       ORDER BY diary_date DESC
       LIMIT ?`,
      [userId, parseInt(days)]
    );

    res.json({
      code: 200,
      data: rows.reverse(), // 按时间升序返回
    });
  } catch (error) {
    console.error('获取趋势失败:', error);
    res.status(500).json({ code: 500, message: '获取趋势失败' });
  }
}

function calcEfficiency(lightsOff, wakeUp, latency, awakenings) {
  if (!lightsOff || !wakeUp) return null;
  const bed = timeToMin(lightsOff);
  const wake = timeToMin(wakeUp);
  let timeInBed = wake - bed;
  if (timeInBed <= 0) timeInBed += 1440; // 跨天
  if (timeInBed <= 0) return null;
  // 只扣入睡耗时（夜醒只有次数没有时长，不猜）
  const awakeTime = parseInt(latency) || 0;
  const sleepTime = timeInBed - awakeTime;
  if (sleepTime <= 0) return 0;
  return Math.round((sleepTime / timeInBed) * 10000) / 100;
}

function timeToMin(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.toString().split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

module.exports = { saveDiary, getDiary, getDiaryList, getEfficiencyTrend };
