/**
 * AI 助手服务 - DeepSeek
 */
const { pool } = require('../config/db');

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

async function chat(userId, messages) {
  if (!API_KEY) throw new Error('AI 服务未配置 API Key');

  // 收集用户睡眠数据作为上下文
  const context = await buildContext(userId);

  const systemMsg = {
    role: 'system',
    content: `你是「睡益良方」CBT-I 数字疗法助手的 AI 睡眠顾问。请根据以下用户的真实睡眠数据提供个性化建议。

## 用户睡眠数据
${context}

## 你的职责
- 基于上述数据，用温暖、专业的语气分析用户的睡眠状况
- 给出 CBT-I 相关的具体建议（睡眠限制、刺激控制、认知重塑、放松技巧、睡眠卫生）
- 回答控制在 200 字以内，简洁实用
- 不要建议用户服用药物
- 语气像一位耐心的睡眠教练`,
  };

  const body = {
    model: 'deepseek-chat',
    messages: [systemMsg, ...messages],
    temperature: 0.7,
    max_tokens: 600,
  };

  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`AI 调用失败: ${resp.status} ${err}`);
  }

  const data = await resp.json();
  return data.choices[0].message.content;
}

async function buildContext(userId) {
  const parts = [];

  // 最新评估得分
  const [assess] = await pool.execute(
    `SELECT total_score, dimension_scores, completed_at FROM assessments
     WHERE user_id = ? AND scale_type = 'UNIFIED' ORDER BY completed_at DESC LIMIT 1`,
    [userId]
  );
  if (assess.length > 0) {
    const dims = JSON.parse(assess[0].dimension_scores || '{}');
    parts.push(`- 最新综合睡眠得分：${assess[0].total_score}/100（${dimToText(dims)}）`);
  }

  // 近7天日记统计
  const [diary] = await pool.execute(
    `SELECT AVG(sleep_efficiency) as eff, AVG(sleep_latency) as lat,
            AVG(daytime_energy) as ene, COUNT(*) as cnt
     FROM sleep_diaries WHERE user_id = ? AND diary_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
    [userId]
  );
  if (diary[0].cnt > 0) {
    parts.push(`- 近7天记录${diary[0].cnt}天，平均效率${r(diary[0].eff)}%，平均入睡${r(diary[0].lat)}分钟，平均日间精力${r(diary[0].ene)}/10`);
  } else {
    parts.push('- 暂无睡眠日记数据');
  }

  // 最近的日记片段
  const [recent] = await pool.execute(
    `SELECT diary_date, bed_time, lights_off_time, sleep_latency, night_awakenings, wake_up_time, sleep_efficiency
     FROM sleep_diaries WHERE user_id = ? ORDER BY diary_date DESC LIMIT 3`,
    [userId]
  );
  if (recent.length > 0) {
    const list = recent.map(d =>
      `${d.diary_date?.toISOString?.()?.slice(0, 10) || d.diary_date}: ${fmtT(d.lights_off_time)}→${fmtT(d.wake_up_time)}, 入睡${d.sleep_latency}分钟, 效率${r(d.sleep_efficiency)}%`
    ).join('\n  ');
    parts.push(`- 最近日记：\n  ${list}`);
  }

  // 干预情况
  const [tasks] = await pool.execute(
    `SELECT task_type, COUNT(*) as cnt FROM daily_tasks
     WHERE user_id = ? AND is_completed = 1 GROUP BY task_type`,
    [userId]
  );
  if (tasks.length > 0) {
    const names = { stimulus_control: '刺激控制', cognitive_restructure: '认知重塑', sleep_hygiene: '睡眠卫生' };
    const tList = tasks.map(t => `${names[t.task_type] || t.task_type}: ${t.cnt}次`).join(', ');
    parts.push(`- 干预任务完成：${tList}`);
  }

  return parts.join('\n');
}

function dimToText(d) {
  return ['睡眠质量', '习惯', '认知', '时长']
    .map(k => `${k}${d[k] || '?'}`).join('/');
}

function r(v) { return v != null ? Math.round(v * 10) / 10 : '?'; }
function fmtT(t) { return t ? String(t).slice(0, 5) : '?'; }

module.exports = { chat };
