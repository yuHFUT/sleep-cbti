const { generateWeeklyReport, BADGE_DEFINITIONS } = require('../src/services/reportService');

describe('周报生成', () => {
  const sampleDiaries = [
    { diary_date: '2026-06-15', bed_time: '23:00', wake_up_time: '07:00', sleep_latency: 20, night_awakenings: 1, daytime_energy: 7, sleep_efficiency: 85 },
    { diary_date: '2026-06-16', bed_time: '23:00', wake_up_time: '06:30', sleep_latency: 15, night_awakenings: 0, daytime_energy: 8, sleep_efficiency: 90 },
    { diary_date: '2026-06-17', bed_time: '23:30', wake_up_time: '07:00', sleep_latency: 25, night_awakenings: 1, daytime_energy: 6, sleep_efficiency: 80 },
    { diary_date: '2026-06-18', bed_time: '23:00', wake_up_time: '07:00', sleep_latency: 10, night_awakenings: 0, daytime_energy: 9, sleep_efficiency: 92 },
    { diary_date: '2026-06-19', bed_time: '23:00', wake_up_time: '06:30', sleep_latency: 20, night_awakenings: 2, daytime_energy: 7, sleep_efficiency: 82 },
  ];

  const prevDiaries = [
    { diary_date: '2026-06-08', bed_time: '01:00', wake_up_time: '07:00', sleep_latency: 60, night_awakenings: 3, daytime_energy: 4, sleep_efficiency: 60 },
    { diary_date: '2026-06-09', bed_time: '00:30', wake_up_time: '07:00', sleep_latency: 45, night_awakenings: 2, daytime_energy: 5, sleep_efficiency: 68 },
    { diary_date: '2026-06-10', bed_time: '00:00', wake_up_time: '06:30', sleep_latency: 50, night_awakenings: 2, daytime_energy: 5, sleep_efficiency: 65 },
    { diary_date: '2026-06-11', bed_time: '23:30', wake_up_time: '07:00', sleep_latency: 30, night_awakenings: 1, daytime_energy: 6, sleep_efficiency: 75 },
  ];

  test('有日记时应返回就绪报告', () => {
    const report = generateWeeklyReport(sampleDiaries, [], { weekStart: '2026-06-15', weekEnd: '2026-06-19' });
    expect(report.ready).toBe(true);
    expect(report.current.diaryCount).toBe(5);
    expect(report.current.avgEfficiency).toBeGreaterThan(0);
  });

  test('无日记时应返回未就绪', () => {
    const report = generateWeeklyReport([]);
    expect(report.ready).toBe(false);
  });

  test('应有与上周的对比数据', () => {
    const report = generateWeeklyReport(sampleDiaries, prevDiaries, { weekStart: '2026-06-15', weekEnd: '2026-06-19' });
    expect(report.changes).toBeTruthy();
    expect(report.changes.efficiency).toBeGreaterThan(0); // 本周效率应高于上周
    expect(report.changes.latency).toBeLessThan(0); // 入睡时间应缩短
  });

  test('应包含评级信息', () => {
    const report = generateWeeklyReport(sampleDiaries, prevDiaries, { weekStart: '2026-06-15', weekEnd: '2026-06-19' });
    expect(report.rating).toHaveProperty('level');
    expect(report.rating).toHaveProperty('score');
    expect(report.rating).toHaveProperty('emoji');
  });

  test('应包含建议和亮点', () => {
    const report = generateWeeklyReport(sampleDiaries, [], { weekStart: '2026-06-15', weekEnd: '2026-06-19' });
    expect(report.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(report.highlights.length).toBeGreaterThanOrEqual(1);
  });

  test('应包含日趋势图表数据', () => {
    const report = generateWeeklyReport(sampleDiaries, [], { weekStart: '2026-06-15', weekEnd: '2026-06-19' });
    expect(report.chart.daily).toHaveLength(5);
    report.chart.daily.forEach(d => {
      expect(d).toHaveProperty('efficiency');
      expect(d).toHaveProperty('latency');
    });
  });

  test('良好睡眠应评高分', () => {
    const perfectDiaries = sampleDiaries.map(d => ({ ...d, sleep_efficiency: 95, sleep_latency: 5 }));
    const report = generateWeeklyReport(perfectDiaries, [], { weekStart: '2026-06-15', weekEnd: '2026-06-19' });
    expect(report.rating.score).toBeGreaterThanOrEqual(70);
  });
});

describe('成就徽章定义', () => {
  test('应有至少10个徽章', () => {
    expect(BADGE_DEFINITIONS.length).toBeGreaterThanOrEqual(10);
  });

  test('每个徽章应有必要字段', () => {
    BADGE_DEFINITIONS.forEach(badge => {
      expect(badge).toHaveProperty('code');
      expect(badge).toHaveProperty('name');
      expect(badge).toHaveProperty('icon');
      expect(badge).toHaveProperty('description');
      expect(badge).toHaveProperty('condition');
    });
  });

  test('徽章代码应唯一', () => {
    const codes = BADGE_DEFINITIONS.map(b => b.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
