const {
  calculateSleepWindow,
  getStimulusControlCard,
  getCognitiveExercise,
  validateCognitiveExercise,
  RELAXATION_EXERCISES,
  SLEEP_HYGIENE_TASKS,
  getDailyTasks,
} = require('../src/services/interventionService');

describe('睡眠限制处方 - calculateSleepWindow', () => {
  test('日记少于3天时应返回未就绪', () => {
    const result = calculateSleepWindow([]);
    expect(result.ready).toBe(false);
    expect(result.message).toContain('3天');
  });

  test('有效日记≥3时应生成时间窗', () => {
    const diaries = [
      { diary_date: '2026-06-17', bed_time: '23:00', wake_up_time: '07:00', sleep_latency: 20, night_awakenings: 1, sleep_efficiency: 80 },
      { diary_date: '2026-06-18', bed_time: '23:30', wake_up_time: '06:30', sleep_latency: 30, night_awakenings: 2, sleep_efficiency: 70 },
      { diary_date: '2026-06-19', bed_time: '23:00', wake_up_time: '07:00', sleep_latency: 15, night_awakenings: 0, sleep_efficiency: 90 },
    ];
    const result = calculateSleepWindow(diaries);
    expect(result.ready).toBe(true);
    expect(result.suggestedWindow).toHaveProperty('bedTime');
    expect(result.suggestedWindow).toHaveProperty('wakeTime');
    expect(result.efficiencyTrend).toHaveLength(3);
  });

  test('睡眠效率<85%时应给出压缩建议', () => {
    const diaries = [
      { diary_date: '2026-06-17', bed_time: '23:00', wake_up_time: '07:00', sleep_latency: 60, night_awakenings: 3, sleep_efficiency: 60 },
      { diary_date: '2026-06-18', bed_time: '23:00', wake_up_time: '07:00', sleep_latency: 45, night_awakenings: 2, sleep_efficiency: 65 },
      { diary_date: '2026-06-19', bed_time: '23:00', wake_up_time: '07:00', sleep_latency: 50, night_awakenings: 2, sleep_efficiency: 62 },
    ];
    const result = calculateSleepWindow(diaries);
    expect(result.avgEfficiency).toBeLessThan(85);
    expect(result.suggestedWindow.tip).toContain('压缩');
  });
});

describe('刺激控制卡片', () => {
  test('应返回有效卡片', () => {
    const card = getStimulusControlCard(0);
    expect(card).toHaveProperty('title');
    expect(card).toHaveProperty('content');
    expect(card).toHaveProperty('icon');
    expect(card).toHaveProperty('challenge');
  });

  test('dayIndex 超出时应循环', () => {
    const card0 = getStimulusControlCard(0);
    const card6 = getStimulusControlCard(6);
    expect(card0.id).toBe(card6.id); // 6张卡片，索引6应对应卡片0
  });
});

describe('认知重塑练习', () => {
  test('应返回有效练习', () => {
    const exercise = getCognitiveExercise(0);
    expect(exercise).toHaveProperty('thought');
    expect(exercise).toHaveProperty('fact');
    expect(exercise).toHaveProperty('instruction');
  });

  test('填空验证 - 空内容应无效', () => {
    const result = validateCognitiveExercise('ce1', { thoughtRecord: '', factCheck: '' });
    expect(result.valid).toBe(false);
  });

  test('填空验证 - 有内容应通过', () => {
    const result = validateCognitiveExercise('ce1', {
      thoughtRecord: '我确实有过这种想法',
      factCheck: '现在我知道这不一定是对的',
    });
    expect(result.valid).toBe(true);
  });
});

describe('放松训练库', () => {
  test('应包含至少3种放松训练', () => {
    expect(RELAXATION_EXERCISES.length).toBeGreaterThanOrEqual(3);
  });

  test('每个训练应有必要字段', () => {
    RELAXATION_EXERCISES.forEach(ex => {
      expect(ex).toHaveProperty('id');
      expect(ex).toHaveProperty('title');
      expect(ex).toHaveProperty('description');
      expect(ex).toHaveProperty('duration');
      expect(ex).toHaveProperty('icon');
    });
  });
});

describe('睡眠卫生任务', () => {
  test('任务库应包含至少10个任务', () => {
    expect(SLEEP_HYGIENE_TASKS.length).toBeGreaterThanOrEqual(10);
  });

  test('每日推荐应有3个任务', () => {
    const tasks = getDailyTasks();
    expect(tasks).toHaveLength(3);
  });

  test('每个任务应有必要字段', () => {
    SLEEP_HYGIENE_TASKS.forEach(t => {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('task');
      expect(t).toHaveProperty('category');
      expect(t).toHaveProperty('points');
    });
  });
});
