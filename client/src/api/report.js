import request from './request';

/** 获取指定周报 */
export function getWeeklyReport(userId, weekStart, weekEnd) {
  return request.get(`/report/weekly/${userId}`, { params: { weekStart, weekEnd } });
}

/** 获取周报历史列表 */
export function getReportHistory(userId, limit = 10) {
  return request.get(`/report/history/${userId}`, { params: { limit } });
}

/** 获取成就列表 */
export function getAchievements(userId) {
  return request.get(`/report/achievements/${userId}`);
}

/** 手动检查成就 */
export function checkAchievements(userId) {
  return request.post(`/report/achievements/${userId}/check`);
}
