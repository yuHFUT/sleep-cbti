/**
 * 认证服务测试（单元测试，不连数据库）
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../src/services/authService');

describe('密码加密', () => {
  test('bcrypt 应正确加密和验证', async () => {
    const password = 'test123456';
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
    expect(hash).toHaveLength(60);

    const valid = await bcrypt.compare(password, hash);
    expect(valid).toBe(true);

    const invalid = await bcrypt.compare('wrongpassword', hash);
    expect(invalid).toBe(false);
  });
});

describe('JWT Token', () => {
  test('应正确签发和验证 token', () => {
    const user = { id: 1, username: 'testuser', role: 'user' };
    const token = jwt.sign(user, process.env.JWT_SECRET || 'sleep-cbti-jwt-secret-key', { expiresIn: '7d' });

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyToken(token);
    expect(decoded).toBeTruthy();
    expect(decoded.id).toBe(1);
    expect(decoded.username).toBe('testuser');
    expect(decoded.role).toBe('user');
  });

  test('无效 token 应返回 null', () => {
    const decoded = verifyToken('invalid.token.here');
    expect(decoded).toBeNull();
  });

  test('过期 token 应返回 null', () => {
    const expiredToken = jwt.sign(
      { id: 1 }, process.env.JWT_SECRET || 'sleep-cbti-jwt-secret-key',
      { expiresIn: '0s' }
    );
    const decoded = verifyToken(expiredToken);
    expect(decoded).toBeNull();
  });
});

describe('用户名验证逻辑', () => {
  const validUsernames = ['testuser', 'user_123', 'abc123', 'Hello_World', 'test'];
  const invalidUsernames = ['ab', 'a', 'user@name', 'user name', '中文名'];

  test('合法用户名应通过', () => {
    const pattern = /^[a-zA-Z0-9_]+$/;
    validUsernames.forEach(name => {
      expect(name.length >= 3).toBe(true);
      expect(pattern.test(name)).toBe(true);
    });
  });

  test('非法用户名应被拒绝', () => {
    const pattern = /^[a-zA-Z0-9_]+$/;
    invalidUsernames.forEach(name => {
      const valid = name.length >= 3 && pattern.test(name);
      expect(valid).toBe(false);
    });
  });
});

describe('密码强度验证', () => {
  test('少于6个字符应拒绝', () => {
    const shortPasswords = ['', '1', '12345'];
    shortPasswords.forEach(pw => {
      expect(pw.length >= 6).toBe(false);
    });
  });
});
