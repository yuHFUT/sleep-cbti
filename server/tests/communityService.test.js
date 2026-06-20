const {
  CAMP_SCHEDULES,
  moderateContent,
  calcGroupEfficiency,
  calcCampStats,
} = require('../src/services/communityService');

describe('内容审核', () => {
  test('空内容应被拦截', () => {
    const result = moderateContent('');
    expect(result.approved).toBe(false);
  });

  test('正常内容应通过', () => {
    const result = moderateContent('今天坚持了刺激控制，感觉还不错！');
    expect(result.approved).toBe(true);
    expect(result.risk).toBe('low');
  });

  test('高风险词应被拦截', () => {
    const result = moderateContent('失眠让我想自杀');
    expect(result.approved).toBe(false);
    expect(result.risk).toBe('high');
  });

  test('负面表达应被温和处理', () => {
    const result = moderateContent('昨晚又失眠了，太痛苦了');
    expect(result.sanitized).not.toContain('太痛苦了');
  });

  test('温和内容不改变原意', () => {
    const result = moderateContent('昨晚睡得很好，今天精力充沛！');
    expect(result.sanitized).toBe('昨晚睡得很好，今天精力充沛！');
  });
});

describe('挑战营', () => {
  test('应有至少3个挑战营方案', () => {
    expect(CAMP_SCHEDULES.length).toBeGreaterThanOrEqual(3);
  });

  test('每个营地应有完整信息', () => {
    CAMP_SCHEDULES.forEach(camp => {
      expect(camp).toHaveProperty('id');
      expect(camp).toHaveProperty('name');
      expect(camp).toHaveProperty('bedTime');
      expect(camp).toHaveProperty('wakeTime');
      expect(camp).toHaveProperty('description');
      expect(camp).toHaveProperty('icon');
    });
  });
});

describe('群体效率计算', () => {
  test('无数据时应返回友好提示', () => {
    const result = calcGroupEfficiency([]);
    expect(result.participantCount).toBe(0);
    expect(result.message).toContain('第一个');
  });

  test('应正确计算平均效率', () => {
    const checkins = [
      { sleep_efficiency: 85 },
      { sleep_efficiency: 90 },
      { sleep_efficiency: 80 },
    ];
    const result = calcGroupEfficiency(checkins);
    expect(result.avgEfficiency).toBe(85);
    expect(result.message).toContain('优秀');
  });

  test('低效率时应保持积极引导', () => {
    const checkins = [
      { sleep_efficiency: 60 },
      { sleep_efficiency: 65 },
    ];
    const result = calcGroupEfficiency(checkins);
    expect(result.message).not.toContain('差');
    expect(result.message).not.toContain('焦虑');
  });
});

describe('挑战营统计', () => {
  const recentCheckins = [
    { user_id: '1', checkin_date: new Date().toISOString().slice(0, 10), sleep_efficiency: 85 },
    { user_id: '2', checkin_date: new Date().toISOString().slice(0, 10), sleep_efficiency: 90 },
  ];

  test('应返回成员数和打卡率', () => {
    const stats = calcCampStats(10, recentCheckins);
    expect(stats.memberCount).toBe(10);
    expect(stats.todayCheckinCount).toBe(2);
    expect(stats.checkinRate).toBe(20);
  });

  test('群体消息应积极正面', () => {
    const stats = calcCampStats(10, recentCheckins);
    expect(stats.groupMessage).toBeTruthy();
    expect(stats.groupMessage).not.toContain('差');
  });
});
