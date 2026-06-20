/**
 * 量表计分服务测试
 */
const {
  calculatePSQI,
  calculateSHPS,
  calculateDBAS16,
  generateRadarData,
  matchInterventions,
} = require('../src/services/scaleService');

describe('PSQI 计分', () => {
  // 模拟一个"睡眠良好者"的答案
  const goodSleeper = {
    q1: '23:00', q2: '10', q3: '07:00', q4: '7.5',
    q5a: '0', q5b: '0', q5c: '0', q5d: '0', q5e: '0',
    q5f: '0', q5g: '0', q5h: '0', q5i: '0', q5j: '0',
    q6: '0', q7: '0', q8: '0', q9: '0',
  };

  // 模拟一个"失眠者"的答案
  const poorSleeper = {
    q1: '01:00', q2: '90', q3: '06:00', q4: '3.5',
    q5a: '3', q5b: '2', q5c: '1', q5d: '0', q5e: '0',
    q5f: '0', q5g: '0', q5h: '1', q5i: '0', q5j: '1',
    q6: '3', q7: '1', q8: '2', q9: '3',
  };

  test('良好睡眠者总分应在0-5分之间', () => {
    const result = calculatePSQI(goodSleeper);
    expect(result.totalScore).toBeLessThanOrEqual(5);
    expect(result.level).toBe('睡眠质量很好');
  });

  test('失眠者总分应>10分', () => {
    const result = calculatePSQI(poorSleeper);
    expect(result.totalScore).toBeGreaterThan(10);
  });

  test('应正确计算7个成分', () => {
    const result = calculatePSQI(goodSleeper);
    expect(result.components).toHaveProperty('A');
    expect(result.components).toHaveProperty('B');
    expect(result.components).toHaveProperty('C');
    expect(result.components).toHaveProperty('D');
    expect(result.components).toHaveProperty('E');
    expect(result.components).toHaveProperty('F');
    expect(result.components).toHaveProperty('G');
  });

  test('成分A：主观睡眠质量等于条目6', () => {
    const result = calculatePSQI(goodSleeper);
    expect(result.components.A.score).toBe(0);
  });

  test('成分C：睡眠时间>7h应得0分', () => {
    const result = calculatePSQI(goodSleeper);
    expect(result.components.C.score).toBe(0);
  });

  test('应计算睡眠效率', () => {
    const result = calculatePSQI(goodSleeper);
    expect(result.components.D.efficiency).toBeGreaterThan(85);
  });

  test('总分范围应在0-21之间', () => {
    const result1 = calculatePSQI(goodSleeper);
    const result2 = calculatePSQI(poorSleeper);
    expect(result1.totalScore).toBeGreaterThanOrEqual(0);
    expect(result1.totalScore).toBeLessThanOrEqual(21);
    expect(result2.totalScore).toBeGreaterThanOrEqual(0);
    expect(result2.totalScore).toBeLessThanOrEqual(21);
  });

  test('isInsomniaRisk 应在>5分时为true', () => {
    const good = calculatePSQI(goodSleeper);
    const poor = calculatePSQI(poorSleeper);
    expect(good.isInsomniaRisk).toBe(false);
    expect(poor.isInsomniaRisk).toBe(true);
  });
});

describe('SHPS 计分', () => {
  const goodHabits = {
    q1: '1', q2: '1', q3: '0', q4: '1',
    q5: '1', q6: '2', q7: '1', q8: '2', q9: '1',
    q10: '0', q11: '0', q12: '0', q13: '1', q14: '0',
    q15: '2', q16: '6', q17: '6', q18: '6', q19: '6',
  };

  test('总分范围应在0-133之间', () => {
    const result = calculateSHPS(goodHabits);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(133);
  });

  test('应正确返回4个维度', () => {
    const result = calculateSHPS(goodHabits);
    expect(result.dimensions).toHaveProperty('schedule');
    expect(result.dimensions).toHaveProperty('arousal');
    expect(result.dimensions).toHaveProperty('eating');
    expect(result.dimensions).toHaveProperty('environment');
  });

  test('反向计分项（q16-q19）应被正确处理', () => {
    const result = calculateSHPS(goodHabits);
    // q16=6 反向后变为1（健康行为→低分）
    // 说明环境维度得分不会异常高
    expect(result.dimensions.environment.score).toBeLessThanOrEqual(result.dimensions.environment.max);
  });
});

describe('DBAS-16 计分', () => {
  const healthyBeliefs = {
    q1: '2', q2: '3', q3: '2', q4: '1', q5: '2',
    q6: '0', q7: '2', q8: '1', q9: '2', q10: '3',
    q11: '2', q12: '2', q13: '1', q14: '1', q15: '0', q16: '1',
  };

  const unhealthyBeliefs = {
    q1: '9', q2: '8', q3: '9', q4: '8', q5: '9',
    q6: '7', q7: '8', q8: '9', q9: '8', q10: '9',
    q11: '7', q12: '8', q13: '6', q14: '9', q15: '8', q16: '7',
  };

  test('平均分应在0-10之间', () => {
    const result = calculateDBAS16(healthyBeliefs);
    expect(result.averageScore).toBeGreaterThanOrEqual(0);
    expect(result.averageScore).toBeLessThanOrEqual(10);
  });

  test('健康信念应<3.5分', () => {
    const result = calculateDBAS16(healthyBeliefs);
    expect(result.averageScore).toBeLessThan(3.5);
  });

  test('不合理信念应≥4.0分', () => {
    const result = calculateDBAS16(unhealthyBeliefs);
    expect(result.averageScore).toBeGreaterThanOrEqual(4.0);
    expect(result.needsCognitiveRestructure).toBe(true);
  });

  test('应正确返回4个维度', () => {
    const result = calculateDBAS16(healthyBeliefs);
    expect(result.dimensions).toHaveProperty('consequences');
    expect(result.dimensions).toHaveProperty('worry');
    expect(result.dimensions).toHaveProperty('expectations');
    expect(result.dimensions).toHaveProperty('medication');
  });
});

describe('睡眠六维图生成', () => {
  test('应返回6个维度（0-100分制）', () => {
    const psqiResult = { components: { B: { score: 1 }, C: { score: 1 }, D: { efficiency: 90 }, E: { score: 0 }, G: { score: 0 } } };
    const shpsResult = {
      totalScore: 30,
      maxScore: 133,
      dimensions: { arousal: { score: 10, max: 35 } },
    };
    const dbas16Result = { averageScore: 2.5, maxScore: 10 };

    const radar = generateRadarData(psqiResult, shpsResult, dbas16Result);
    expect(radar).toHaveLength(6);
    radar.forEach(dim => {
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.score).toBeLessThanOrEqual(100);
      expect(dim).toHaveProperty('name');
      expect(dim).toHaveProperty('key');
    });
  });
});

describe('干预策略匹配', () => {
  test('应至少返回1个建议', () => {
    const psqiResult = { components: { B: { score: 1 }, D: { efficiency: 90 } } };
    const shpsResult = { totalScore: 30, dimensions: { arousal: { score: 10 } } };
    const dbas16Result = { averageScore: 2.5, needsCognitiveRestructure: false };

    const interventions = matchInterventions(psqiResult, shpsResult, dbas16Result);
    expect(interventions.length).toBeGreaterThanOrEqual(1);
  });

  test('低睡眠效率应推荐睡眠限制疗法', () => {
    const psqiResult = { components: { B: { score: 1 }, D: { efficiency: 70 } } };
    const shpsResult = { totalScore: 30, dimensions: { arousal: { score: 10 } } };
    const dbas16Result = { averageScore: 2.5, needsCognitiveRestructure: false };

    const interventions = matchInterventions(psqiResult, shpsResult, dbas16Result);
    expect(interventions.some(i => i.type === 'sleep_restriction')).toBe(true);
  });
});
