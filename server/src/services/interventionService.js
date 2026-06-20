/**
 * 干预策略服务
 * 睡眠限制 / 刺激控制 / 认知重塑 / 放松训练 / 睡眠卫生
 */

// ============================================================
// 一、睡眠限制处方 - 计算建议卧床时间窗
// ============================================================

/**
 * 根据最近N天睡眠日记计算平均睡眠效率和建议时间窗
 * @param {Array} diaries - 睡眠日记列表
 * @returns {Object} 时间窗建议
 */
function calculateSleepWindow(diaries) {
  if (!diaries || diaries.length < 3) {
    return {
      ready: false,
      message: '需要至少3天睡眠日记数据才能生成睡眠限制处方。请先记录睡眠日记。',
    };
  }

  // 计算平均数据
  const validDiaries = diaries.filter(d => d.sleep_efficiency !== null && d.sleep_latency !== null);
  if (validDiaries.length < 3) {
    return { ready: false, message: '有效日记不足3天，请继续记录。' };
  }

  const avgEfficiency = validDiaries.reduce((s, d) => s + parseFloat(d.sleep_efficiency || 0), 0) / validDiaries.length;
  const avgLatency = validDiaries.reduce((s, d) => s + (d.sleep_latency || 0), 0) / validDiaries.length;
  const avgSleepDuration = validDiaries.reduce((s, d) => {
    if (d.bed_time && d.wake_up_time) {
      const bed = timeToMin(d.bed_time);
      const wake = timeToMin(d.wake_up_time);
      const inBed = wake > bed ? wake - bed : wake + 1440 - bed;
      const latency = d.sleep_latency || 0;
      const awakenings = (d.night_awakenings || 0) * 5;
      return s + (inBed - latency - awakenings);
    }
    return s;
  }, 0) / validDiaries.length;

  // 取中位数上床时间和起床时间
  const bedTimes = validDiaries.map(d => timeToMin(d.bed_time || '23:00')).sort((a, b) => a - b);
  const wakeTimes = validDiaries.map(d => timeToMin(d.wake_up_time || '07:00')).sort((a, b) => a - b);
  const medianBed = bedTimes[Math.floor(bedTimes.length / 2)];
  const medianWake = wakeTimes[Math.floor(wakeTimes.length / 2)];

  // 平均卧床时间（分钟）
  let avgTimeInBed = medianWake - medianBed;
  if (avgTimeInBed <= 0) avgTimeInBed += 1440;

  // 目标：将睡眠效率提升到 85%+
  // 建议卧床时间 = 平均实际睡眠时间 / 目标效率
  const targetEfficiency = 0.85;
  const suggestedTimeInBed = Math.round(avgSleepDuration / targetEfficiency);

  // 确保最少5小时卧床
  const finalTimeInBed = Math.max(300, Math.min(suggestedTimeInBed, avgTimeInBed));

  // 建议时间窗（固定起床时间，往前推）
  const suggestedWakeTime = Math.round(medianWake / 5) * 5; // 取整到5分钟
  const suggestedBedTime = suggestedWakeTime - finalTimeInBed;
  const normalizedBedTime = suggestedBedTime < 0 ? suggestedBedTime + 1440 : suggestedBedTime;

  // 睡眠效率评级
  let efficiencyLevel;
  if (avgEfficiency >= 85) efficiencyLevel = '良好';
  else if (avgEfficiency >= 75) efficiencyLevel = '一般';
  else if (avgEfficiency >= 65) efficiencyLevel = '偏低';
  else efficiencyLevel = '很差';

  return {
    ready: true,
    avgEfficiency: Math.round(avgEfficiency * 10) / 10,
    avgLatency: Math.round(avgLatency),
    avgSleepDuration: Math.round(avgSleepDuration),
    avgTimeInBed: Math.round(avgTimeInBed),
    efficiencyLevel,
    currentWindow: {
      bedTime: minToTimeStr(medianBed),
      wakeTime: minToTimeStr(medianWake),
      timeInBed: `${Math.floor(avgTimeInBed / 60)}小时${Math.round(avgTimeInBed % 60)}分钟`,
    },
    suggestedWindow: {
      bedTime: minToTimeStr(normalizedBedTime),
      wakeTime: minToTimeStr(suggestedWakeTime),
      timeInBed: `${Math.floor(finalTimeInBed / 60)}小时${Math.round(finalTimeInBed % 60)}分钟`,
      tip: avgEfficiency < 85
        ? `建议将卧床时间从 ${Math.round(avgTimeInBed / 60)}小时 压缩到 ${Math.floor(finalTimeInBed / 60)}小时，以提高睡眠效率。`
        : '当前睡眠效率良好，保持现有作息即可。',
    },
    efficiencyTrend: validDiaries.map(d => ({
      date: d.diary_date,
      efficiency: parseFloat(d.sleep_efficiency) || 0,
    })),
  };
}

// ============================================================
// 二、刺激控制指导 - 每日指令卡片
// ============================================================

const STIMULUS_CONTROL_CARDS = [
  {
    id: 'sc1',
    title: '只有困倦时才上床',
    content: '等到眼皮沉重、身体放松、确实感到困意时再上床。不要因为"时间到了"就强迫自己躺下。',
    icon: '😴',
  },
  {
    id: 'sc2',
    title: '床只用于睡眠和亲密关系',
    content: '不要在床上玩手机、看书、吃东西或想事情。让大脑把"床"和"睡眠"紧密联系在一起。',
    icon: '🛌',
  },
  {
    id: 'sc3',
    title: '20分钟睡不着就离开床',
    content: '如果在床上躺了约20分钟还睡不着，就起床到另一个房间，做一些安静放松的事情，直到感到困倦再回到床上。',
    icon: '🚶',
  },
  {
    id: 'sc4',
    title: '每天固定时间起床',
    content: '无论前一晚睡了多久，每天都在同一时间起床。这能帮助身体建立稳定的睡眠-觉醒节律。',
    icon: '⏰',
  },
  {
    id: 'sc5',
    title: '避免白天长时间午睡',
    content: '如果白天需要午睡，控制在20分钟以内，且在下午3点前完成。长时间的午睡会削弱晚上的睡眠驱动力。',
    icon: '☀️',
  },
  {
    id: 'sc6',
    title: '不要"努力"去睡觉',
    content: '越是努力想睡着，越是睡不着。接受"暂时醒着也没关系"的态度，让睡眠自然到来。',
    icon: '🧘',
  },
];

/**
 * 获取刺激控制卡片列表
 * @param {number} dayIndex - 第几天（从0开始）
 * @returns {Object} 当天指令卡片
 */
function getStimulusControlCard(dayIndex = 0) {
  const card = STIMULUS_CONTROL_CARDS[dayIndex % STIMULUS_CONTROL_CARDS.length];
  return {
    ...card,
    dayIndex,
    totalCards: STIMULUS_CONTROL_CARDS.length,
    challenge: `挑战：今天尝试执行「${card.title}」，完成后打卡！`,
  };
}

// ============================================================
// 三、认知重塑练习
// ============================================================

const COGNITIVE_EXERCISES = [
  {
    id: 'ce1',
    thought: '昨晚只睡了5小时，今天肯定废了。',
    fact: '研究显示，偶尔的短睡眠对大多数人的日间认知功能影响有限。人体有代偿机制，即使睡眠不足，仍可在重要任务中保持专注。关键是不要陷入"我肯定不行了"的自我暗示。',
    dimension: 'consequences',
  },
  {
    id: 'ce2',
    thought: '我必须睡满8小时才算合格的睡眠。',
    fact: '睡眠需求因人而异，成人推荐7-9小时，但有些人天生就是"短睡眠者"（6小时足矣）。睡眠质量比时长更重要——6小时高质量睡眠好过8小时浅碎睡眠。',
    dimension: 'expectations',
  },
  {
    id: 'ce3',
    thought: '如果今晚睡不好，这一整周就毁了。',
    fact: '一两个晚上睡不好并不会导致"整周崩塌"。大脑有自我修复能力，第二晚通常会自然补回部分深睡眠。这种"全或无"的想法本身就是维持失眠的因素。',
    dimension: 'worry',
  },
  {
    id: 'ce4',
    thought: '躺在床上越久，总睡着的时间就越多。',
    fact: '恰恰相反。长时间卧床会导致睡眠变浅、变碎。CBT-I 的核心策略之一就是"睡眠限制"——适度压缩卧床时间反而提升睡眠效率和质量。',
    dimension: 'expectations',
  },
  {
    id: 'ce5',
    thought: '失眠会严重毁掉我的健康。',
    fact: '虽然长期严重失眠与部分健康风险相关，但关联不等于因果。许多失眠者身体指标完全正常。过度担忧失眠后果造成的焦虑，往往比失眠本身对健康的影响更大。',
    dimension: 'consequences',
  },
  {
    id: 'ce6',
    thought: '睡不着的时候我应该继续躺着，总会睡着的。',
    fact: '在失眠认知行为治疗中，躺着超过20分钟睡不着反而会强化"床=焦虑"的连接。建议起床做放松的事，等有困意再回床——这叫"刺激控制"，是CBT-I的核心技术。',
    dimension: 'worry',
  },
  {
    id: 'ce7',
    thought: '只有吃药才能让我睡着。',
    fact: '助眠药物短期有效，但长期使用会产生耐受性和依赖性。CBT-I 被国际指南推荐为失眠的一线治疗，其效果比药物更持久，且无副作用。药物可以是短期过渡，但不应是唯一方案。',
    dimension: 'medication',
  },
  {
    id: 'ce8',
    thought: '白天累了应该多睡一会儿补回来。',
    fact: '白天长时间补觉会减少晚上的"睡眠驱动力"，让当晚更难入睡。如果白天实在很累，限制在20分钟以内的"能量小憩"，且尽量在下午3点前。',
    dimension: 'expectations',
  },
];

/**
 * 获取认知重塑练习
 * @param {number} dayIndex - 第几天
 * @returns {Object} 当天的认知练习
 */
function getCognitiveExercise(dayIndex = 0) {
  const exercise = COGNITIVE_EXERCISES[dayIndex % COGNITIVE_EXERCISES.length];
  return {
    ...exercise,
    dayIndex,
    totalExercises: COGNITIVE_EXERCISES.length,
    instruction: '请仔细阅读左边的"常见想法"和右边的"科学事实"，然后完成下表：\n\n1. 我是否有过类似的想法？\n2. 看到科学事实后，我的想法有什么变化？',
  };
}

/**
 * 验证认知重塑练习的填空
 */
function validateCognitiveExercise(exerciseId, userResponse) {
  // 简单验证：有填写内容即算完成
  const valid = !!(userResponse && userResponse.thoughtRecord && userResponse.thoughtRecord.trim().length > 0
    && userResponse.factCheck && userResponse.factCheck.trim().length > 0);

  return {
    valid,
    message: valid ? '✅ 认知练习完成！你已经迈出了改变睡眠信念的重要一步。' : '请完成"想法记录"和"事实检验"两个填空。',
  };
}

// ============================================================
// 四、放松训练库
// ============================================================

const RELAXATION_EXERCISES = [
  {
    id: 'relax1',
    type: 'breathing',
    title: '腹式呼吸引导',
    description: '通过深而缓慢的腹式呼吸，激活副交感神经系统，降低睡前身体紧张和心率。',
    duration: 300, // 5分钟（秒）
    icon: '🫁',
    steps: [
      { type: 'guide', text: '找一个舒适的姿势躺好，一只手放在腹部。' },
      { type: 'breathe_in', text: '用鼻子缓缓吸气，感受腹部像气球一样鼓起...', seconds: 4 },
      { type: 'hold', text: '屏住呼吸...', seconds: 2 },
      { type: 'breathe_out', text: '用嘴巴缓缓呼气，感受腹部回落...', seconds: 6 },
    ],
    repeat: 15,
  },
  {
    id: 'relax2',
    type: 'pmr',
    title: '渐进式肌肉放松',
    description: '从头到脚逐个肌群"先绷紧再放松"，体会身体从紧张到松弛的感觉变化，适合睡前身体紧绷者。',
    duration: 600, // 10分钟
    icon: '💪',
    muscleGroups: [
      { name: '双手和前臂', instruction: '握紧拳头，感受手和前臂的紧张...保持5秒...慢慢放松...' },
      { name: '上臂', instruction: '弯曲手肘，绷紧肱二头肌...感受紧张...放松...' },
      { name: '面部', instruction: '皱起眉头，紧闭双眼，咬紧牙关...感受面部紧张...慢慢放松...' },
      { name: '颈部和肩膀', instruction: '耸肩到耳朵的位置，感受颈肩的紧张...保持...慢慢放下...' },
      { name: '胸部和腹部', instruction: '深吸一口气，收紧胸腹肌肉...保持...慢慢呼出放松...' },
      { name: '臀部和腿部', instruction: '绷紧臀部和大腿...保持...放松...' },
      { name: '小腿和脚', instruction: '脚趾向下弯曲，感受小腿和脚的拉伸...保持...放松...' },
      { name: '全身放松', instruction: '扫描全身，从头顶到脚趾，检查还有哪里在紧张...让紧张的部位都放松下来...' },
    ],
  },
  {
    id: 'relax3',
    type: 'mindfulness',
    title: '睡前正念冥想',
    description: '将注意力温和地放在当下——呼吸、身体感觉、声音，接纳任何出现的念头而不评判，让思绪安静下来。',
    duration: 480, // 8分钟
    icon: '🧘',
    guideScript: [
      '闭上眼睛，做三次深长的呼吸...',
      '把注意力轻轻放在呼吸上，感受空气进入和离开鼻腔...',
      '如果脑海中有念头冒出来，没关系，注意到它，然后温和地把注意力带回到呼吸...',
      '现在把注意力移到身体上——从脚趾开始，向上扫描。感受每个部位的温度、重量、与床面的接触...',
      '如果有任何情绪浮现，不评判它们，只是看着它们像云一样飘过...',
      '将注意力回到呼吸，感受吸气...呼气...',
      '慢慢地把意识带回到房间，活动一下手指和脚趾...',
      '当你准备好时，睁开双眼。',
    ],
  },
  {
    id: 'relax4',
    type: 'imagery',
    title: '睡眠意象引导',
    description: '引导你想象一个宁静、安全的场景，用丰富的感官细节帮助大脑从日常思绪中"切换频道"。',
    duration: 360, // 6分钟
    icon: '🏖️',
    scenes: [
      {
        name: '海滩日落',
        guide: '想象你正站在一片安静的海滩上...太阳正慢慢落下，天空被染成橙红色...海风轻轻拂过你的脸庞...你听到海浪有节奏地拍打沙滩的声音...脚下的沙子柔软而温暖...每一次呼吸，你都感觉身体更放松、更沉重...',
      },
    ],
  },
];

// ============================================================
// 五、睡眠卫生任务库
// ============================================================

const SLEEP_HYGIENE_TASKS = [
  { id: 'sh1', category: '午睡', task: '今天午睡不超过20分钟', icon: '☀️', difficulty: 'easy', points: 10 },
  { id: 'sh2', category: '电子设备', task: '睡前1小时放下手机/平板/电脑', icon: '📱', difficulty: 'medium', points: 15 },
  { id: 'sh3', category: '咖啡因', task: '17点后不摄入咖啡因（咖啡/茶/可乐）', icon: '☕', difficulty: 'medium', points: 15 },
  { id: 'sh4', category: '运动', task: '今天进行30分钟有氧运动（但不在睡前2小时内）', icon: '🏃', difficulty: 'medium', points: 20 },
  { id: 'sh5', category: '酒精', task: '今晚不饮酒助眠', icon: '🍷', difficulty: 'easy', points: 10 },
  { id: 'sh6', category: '卧室环境', task: '调整卧室温度到18-22℃，保持通风', icon: '🌡️', difficulty: 'easy', points: 10 },
  { id: 'sh7', category: '放松', task: '睡前做10分钟放松活动（冥想/深呼吸/温水澡）', icon: '🛀', difficulty: 'medium', points: 15 },
  { id: 'sh8', category: '规律作息', task: '今晚和明早按计划时间上床和起床', icon: '⏰', difficulty: 'hard', points: 25 },
  { id: 'sh9', category: '饮食', task: '睡前三小时内不吃大量食物', icon: '🍽️', difficulty: 'easy', points: 10 },
  { id: 'sh10', category: '光线', task: '睡前一小时调暗室内灯光，减少蓝光暴露', icon: '💡', difficulty: 'easy', points: 10 },
  { id: 'sh11', category: '床的使用', task: '白天不在床上做与睡眠无关的事', icon: '🛌', difficulty: 'medium', points: 15 },
  { id: 'sh12', category: '水分', task: '睡前2小时减少液体摄入（减少夜醒上厕所）', icon: '💧', difficulty: 'easy', points: 10 },
];

/**
 * 生成每日推荐任务（3个）
 */
function getDailyTasks(interventionTypes = []) {
  // 根据干预类型调整任务权重
  const pool = [...SLEEP_HYGIENE_TASKS];
  // 随机选3个（实际中根据用户干预类型调整）
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((t, i) => ({
    ...t,
    order: i + 1,
  }));
}

// ============================================================
// 工具函数
// ============================================================

function timeToMin(timeStr) {
  if (!timeStr) return 0;
  // 处理 MySQL TIME 格式 (HH:MM:SS 或 HH:MM)
  const parts = timeStr.toString().split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function minToTimeStr(minutes) {
  let m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

module.exports = {
  calculateSleepWindow,
  getStimulusControlCard,
  STIMULUS_CONTROL_CARDS,
  getCognitiveExercise,
  validateCognitiveExercise,
  COGNITIVE_EXERCISES,
  RELAXATION_EXERCISES,
  SLEEP_HYGIENE_TASKS,
  getDailyTasks,
  timeToMin,
  minToTimeStr,
};
