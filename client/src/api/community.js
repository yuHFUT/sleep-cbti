import request from './request';

/** 获取挑战营列表 */
export function getCampList() {
  return request.get('/community/camps');
}

/** 获取我的挑战营 */
export function getMyCamp(userId) {
  return request.get(`/community/camps/${userId}/my`);
}

/** 加入挑战营 */
export function joinCamp(userId, campId) {
  return request.post(`/community/camps/${userId}/join`, { campId });
}

/** 打卡 */
export function checkInCamp(userId) {
  return request.post(`/community/camps/${userId}/checkin`);
}

/** 获取营地统计 */
export function getCampStats(campId) {
  return request.get(`/community/camps/${campId}/stats`);
}

/** 退出挑战营 */
export function leaveCamp(userId) {
  return request.post(`/community/camps/${userId}/leave`);
}

/** 获取话题帖子列表 */
export function getPostList(page = 1, limit = 20) {
  return request.get('/community/posts', { params: { page, limit } });
}

/** 发布帖子 */
export function createPost(userId, content) {
  return request.post(`/community/posts/${userId}`, { content });
}

/** 点赞 */
export function likePost(postId) {
  return request.post(`/community/posts/${postId}/like`);
}
