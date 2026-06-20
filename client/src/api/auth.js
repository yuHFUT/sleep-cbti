import request from './request';

/** 登录 */
export function login(username, password) {
  return request.post('/auth/login', { username, password });
}

/** 注册 */
export function register(username, password, nickname) {
  return request.post('/auth/register', { username, password, nickname });
}

/** 获取当前用户信息 */
export function getProfile() {
  return request.get('/auth/profile');
}

/** 修改密码 */
export function changePassword(oldPassword, newPassword) {
  return request.post('/auth/change-password', { oldPassword, newPassword });
}
