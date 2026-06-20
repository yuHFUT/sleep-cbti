import request from './request';

/**
 * 保存/更新睡眠日记
 */
export function saveDiary(userId, data) {
  return request.post(`/diary/${userId}`, data);
}

/**
 * 获取指定日期日记
 */
export function getDiary(userId, date) {
  return request.get(`/diary/${userId}/${date}`);
}

/**
 * 获取日记列表
 */
export function getDiaryList(userId, params = {}) {
  return request.get(`/diary/${userId}`, { params });
}

/**
 * 获取睡眠效率趋势
 */
export function getEfficiencyTrend(userId, days = 7) {
  return request.get(`/diary/${userId}/trend/efficiency`, { params: { days } });
}
