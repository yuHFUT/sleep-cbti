import request from './request';

/**
 * 获取量表元信息列表
 */
export function getScalesList() {
  return request.get('/scales');
}

/**
 * 获取指定量表完整题目配置
 * @param {'psqi'|'shps'|'dbas16'} scaleKey
 */
export function getScaleConfig(scaleKey) {
  return request.get(`/scales/${scaleKey}`);
}

/**
 * 提交 PSQI 评估
 */
export function submitPSQI(userId, answers) {
  return request.post('/assessment/psqi', { userId, answers });
}

/**
 * 提交 SHPS 评估
 */
export function submitSHPS(userId, answers) {
  return request.post('/assessment/shps', { userId, answers });
}

/**
 * 提交 DBAS-16 评估
 */
export function submitDBAS16(userId, answers) {
  return request.post('/assessment/dbas16', { userId, answers });
}

/**
 * 获取综合评估报告（含雷达图 + 干预建议）
 */
export function getAssessmentReport(userId) {
  return request.get(`/assessment/report/${userId}`);
}

/**
 * 获取评估历史
 */
export function getAssessmentHistory(userId, scaleType) {
  return request.get(`/assessment/history/${userId}`, { params: { scaleType } });
}
