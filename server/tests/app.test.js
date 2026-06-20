const request = require('supertest');
const app = require('../src/app');

describe('API 基础测试', () => {
  test('健康检查接口应该返回 ok 状态', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('CBT-I');
  });

  test('不存在的接口应该返回 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
    expect(res.body.code).toBe(404);
  });
});
