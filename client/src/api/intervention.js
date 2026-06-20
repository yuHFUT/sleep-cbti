import request from './request';

/** 获取睡眠限制处方 */
export function getSleepRestriction(userId, days = 7) {
  return request.get(`/intervention/sleep-restriction/${userId}`, { params: { days } });
}

/** 获取刺激控制卡片 */
export function getStimulusCard(userId) {
  return request.get(`/intervention/stimulus-control/${userId}`);
}

/** 刺激控制打卡 */
export function checkInStimulus(userId) {
  return request.post(`/intervention/stimulus-control/${userId}/checkin`);
}

/** 获取认知重塑练习 */
export function getCognitiveTask(userId) {
  return request.get(`/intervention/cognitive/${userId}`);
}

/** 提交认知重塑练习 */
export function submitCognitiveTask(userId, data) {
  return request.post(`/intervention/cognitive/${userId}`, data);
}

/** 获取放松训练列表 */
export function getRelaxationList() {
  return request.get('/intervention/relaxation');
}

/** 获取放松训练详情 */
export function getRelaxationDetail(exerciseId) {
  return request.get(`/intervention/relaxation/${exerciseId}`);
}

/** 获取每日睡眠卫生任务 */
export function getDailyHygiene(userId) {
  return request.get(`/intervention/hygiene/${userId}`);
}

/** 完成/取消睡眠卫生任务 */
export function toggleHygieneTask(userId, taskId, completed) {
  return request.post(`/intervention/hygiene/${userId}/${taskId}`, { completed });
}
