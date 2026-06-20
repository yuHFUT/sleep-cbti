/* ==========================================
   H5 睡眠健康测评 — 主逻辑
   ========================================== */

// ──────────────── 全局状态 ────────────────
const STATE = {
  currentScreen: 'landing',
  consentGiven: false,
  // 三关答题数据
  stage1: { current: 0, answers: {} },
  stage2: { current: 0, answers: {} },
  stage3: { current: 0, answers: {} },
  // 冷知识（Stage2 每题一条）
  coldTips: [],
  // 最终分数
  scores: null
};

// ──────────────── 冷知识库（Stage2 用） ────────────────
const COLD_KNOWLEDGE = [
  '🧊 冷知识：午睡超过1小时，痴呆风险增加40%（《Alzheimer\'s & Dementia》2023）。建议控制在20-30分钟。',
  '🧊 冷知识：睡前刷手机8分钟，平均延迟入睡1小时——屏幕蓝光抑制褪黑素分泌达50%以上。',
  '🧊 冷知识：周末补觉并不能完全抵消工作日的睡眠债。研究发现，"社交时差"每增加1小时，心血管风险升高11%。',
  '🧊 冷知识：睡前饮酒虽然能加速入睡，但会严重破坏后半夜的REM睡眠（快速眼动睡眠），导致次日疲惫不堪。',
  '🧊 冷知识：人体核心体温下降是入睡的关键信号。睡前1-2小时洗热水澡，出浴后体温骤降，可缩短入睡时间约10分钟。',
  '🧊 冷知识：下午2点后摄入咖啡因，其半衰期约5-6小时，到晚上10点仍有50%残留在体内。下午茶请控制在14:00前。',
  '🧊 冷知识：床只用来睡觉（和亲密关系），不在床上工作/刷剧——这是CBT-I中最核心的"刺激控制疗法"。',
  '🧊 冷知识：睡眠不足时，大脑对高热量食物的反应增强45%，这就是为什么熬夜晚睡容易胖。'
];

// ──────────────── 题目定义 ────────────────

// 第一关：PSQI 简化版（8题）
const STAGE1_QUESTIONS = [
  {
    id: 'q1_bedtime',
    question: '近1个月，你通常晚上几点上床睡觉？',
    illustration: '🛏️',
    type: 'select',
    options: [
      { label: '22:00前', value: 0 },
      { label: '22:00 - 23:00', value: 1 },
      { label: '23:00 - 24:00', value: 2 },
      { label: '24:00 - 凌晨1:00', value: 3 },
      { label: '凌晨1:00以后', value: 4 }
    ]
  },
  {
    id: 'q2_latency',
    question: '近1个月，从上床到入睡通常需要多久？',
    illustration: '🐑',
    type: 'select',
    options: [
      { label: '≤15分钟', value: 0 },
      { label: '16-30分钟', value: 1 },
      { label: '31-60分钟', value: 2 },
      { label: '>60分钟', value: 3 }
    ]
  },
  {
    id: 'q3_waketime',
    question: '近1个月，你通常早上几点起床？',
    illustration: '⏰',
    type: 'select',
    options: [
      { label: '6:00前', value: 0 },
      { label: '6:00 - 7:30', value: 1 },
      { label: '7:30 - 9:00', value: 2 },
      { label: '9:00以后', value: 3 }
    ]
  },
  {
    id: 'q4_duration',
    question: '近1个月，每夜实际睡眠时间大约多少小时？',
    illustration: '😴',
    type: 'select',
    options: [
      { label: '>7小时', value: 0 },
      { label: '6-7小时', value: 1 },
      { label: '5-6小时', value: 2 },
      { label: '<5小时', value: 3 }
    ]
  },
  {
    id: 'q5_quality',
    question: '近1个月，你如何评价自己的整体睡眠质量？',
    illustration: '🌟',
    type: 'select',
    options: [
      { label: '很好', value: 0 },
      { label: '较好', value: 1 },
      { label: '较差', value: 2 },
      { label: '很差', value: 3 }
    ]
  },
  {
    id: 'q6_disturbance',
    question: '近1个月，你有多频繁因各种原因（如夜醒、上厕所、温度不适、疼痛等）影响睡眠？',
    illustration: '🌙',
    type: 'select',
    options: [
      { label: '从不', value: 0 },
      { label: '<1次/周', value: 1 },
      { label: '1-2次/周', value: 2 },
      { label: '≥3次/周', value: 3 }
    ]
  },
  {
    id: 'q7_medication',
    question: '近1个月，你使用催眠药物（含处方、非处方助眠药）的频率？',
    illustration: '💊',
    type: 'select',
    options: [
      { label: '从不使用', value: 0 },
      { label: '<1次/周', value: 1 },
      { label: '1-2次/周', value: 2 },
      { label: '≥3次/周', value: 3 }
    ]
  },
  {
    id: 'q8_daytime',
    question: '近1个月，你在白天感到精力不足、难以保持清醒的程度？',
    illustration: '☕',
    type: 'select',
    options: [
      { label: '没有影响', value: 0 },
      { label: '偶尔影响', value: 1 },
      { label: '有时影响', value: 2 },
      { label: '经常严重影响', value: 3 }
    ]
  }
];

// 第二关：SHPS（8题，每题对应一条冷知识）
const STAGE2_QUESTIONS = [
  {
    id: 'shps_nap',
    question: '你午睡的习惯是？',
    illustration: '😪',
    type: 'select',
    options: [
      { label: '从不午睡', value: 0 },
      { label: '偶尔（<2次/周），≤30分钟', value: 1 },
      { label: '经常，30-60分钟', value: 2 },
      { label: '几乎每天，1-2小时', value: 3 },
      { label: '每天午睡超过2小时', value: 4 }
    ],
    coldTip: 0
  },
  {
    id: 'shps_screen',
    question: '睡前1小时内，你使用手机/电脑/平板的情况？',
    illustration: '📱',
    type: 'select',
    options: [
      { label: '从不使用电子设备', value: 0 },
      { label: '偶尔看几分钟', value: 1 },
      { label: '经常刷到困为止', value: 2 },
      { label: '几乎每晚都在床上刷手机入睡', value: 3 },
      { label: '睡前必刷且因此入睡困难', value: 4 }
    ],
    coldTip: 1
  },
  {
    id: 'shps_weekend',
    question: '周末/假日与工作日的睡眠时间差异（"社交时差"）？',
    illustration: '📅',
    type: 'select',
    options: [
      { label: '相差≤30分钟', value: 0 },
      { label: '相差30分钟-1小时', value: 1 },
      { label: '相差1-2小时', value: 2 },
      { label: '相差2-4小时', value: 3 },
      { label: '相差>4小时 / 昼夜颠倒', value: 4 }
    ],
    coldTip: 2
  },
  {
    id: 'shps_alcohol',
    question: '你睡前饮酒助眠的频率？',
    illustration: '🍷',
    type: 'select',
    options: [
      { label: '从不', value: 0 },
      { label: '偶尔（每月1-2次）', value: 1 },
      { label: '有时（每周1-2次）', value: 2 },
      { label: '经常（每周≥3次）', value: 3 },
      { label: '几乎每晚都饮酒助眠', value: 4 }
    ],
    coldTip: 3
  },
  {
    id: 'shps_bath',
    question: '睡前1-2小时，你有洗热水澡/泡脚等放松习惯吗？',
    illustration: '🛀',
    type: 'select',
    options: [
      { label: '几乎每晚都有', value: 0 },
      { label: '经常有', value: 1 },
      { label: '有时有', value: 2 },
      { label: '偶尔有', value: 3 },
      { label: '从不', value: 4 }
    ],
    coldTip: 4
  },
  {
    id: 'shps_caffeine',
    question: '下午2点后，你喝茶/咖啡/可乐等含咖啡因饮品吗？',
    illustration: '🍵',
    type: 'select',
    options: [
      { label: '从不', value: 0 },
      { label: '偶尔', value: 1 },
      { label: '经常（每周3-4次）', value: 2 },
      { label: '几乎每天下午/晚上都喝', value: 3 },
      { label: '每天下午和晚上都大量喝', value: 4 }
    ],
    coldTip: 5
  },
  {
    id: 'shps_bed_use',
    question: '除了睡觉，你是否在床上做其他事（看手机、吃东西、工作/学习等）？',
    illustration: '🛌',
    type: 'select',
    options: [
      { label: '从不，床只用来睡觉', value: 0 },
      { label: '偶尔看手机/回消息', value: 1 },
      { label: '经常在床上看剧/刷手机', value: 2 },
      { label: '床就是我的第二办公桌/餐桌', value: 3 },
      { label: '几乎所有活动都在床上', value: 4 }
    ],
    coldTip: 6
  },
  {
    id: 'shps_eating',
    question: '熬夜时，你是否更容易想吃高热量食物（炸鸡、泡面、甜食等）？',
    illustration: '🍔',
    type: 'select',
    options: [
      { label: '从不熬夜 / 熬夜也不吃东西', value: 0 },
      { label: '偶尔会想吃', value: 1 },
      { label: '经常会想吃并会去吃', value: 2 },
      { label: '熬夜必吃，控制不住', value: 3 },
      { label: '不熬夜也控制不住吃高热量', value: 4 }
    ],
    coldTip: 7
  }
];

// 第三关：DBAS-16 简版（8题，覆盖4维度各2题）
const STAGE3_QUESTIONS = [
  {
    id: 'dbas_consequence1',
    question: '当前一晚睡得不好，我知道隔天的活动一定会受到影响。',
    dimension: 'consequences',
    type: 'likert',
    labels: ['完全不同意', '完全同意']
  },
  {
    id: 'dbas_consequence2',
    question: '如果没有适当的睡眠，隔天我简直没办法做事情。',
    dimension: 'consequences',
    type: 'likert',
    labels: ['完全不同意', '完全同意']
  },
  {
    id: 'dbas_worry1',
    question: '我担心自己失去控制睡眠的能力。',
    dimension: 'worry',
    type: 'likert',
    labels: ['完全不同意', '完全同意']
  },
  {
    id: 'dbas_worry2',
    question: '如果某个晚上我睡得不好，我知道整个星期的睡眠都会被扰乱。',
    dimension: 'worry',
    type: 'likert',
    labels: ['完全不同意', '完全同意']
  },
  {
    id: 'dbas_expect1',
    question: '我需要睡足8小时，白天才能精力充沛。',
    dimension: 'expectations',
    type: 'likert',
    labels: ['完全不同意', '完全同意']
  },
  {
    id: 'dbas_expect2',
    question: '没睡够的觉，必须在第二天午睡或第二天晚上补回来。',
    dimension: 'expectations',
    type: 'likert',
    labels: ['完全不同意', '完全同意']
  },
  {
    id: 'dbas_med1',
    question: '为了保持白天清醒，吃助眠药物比忍受一整晚睡不好更好。',
    dimension: 'medication',
    type: 'likert',
    labels: ['完全不同意', '完全同意']
  },
  {
    id: 'dbas_med2',
    question: '药物可能是解决失眠问题的唯一方式。',
    dimension: 'medication',
    type: 'likert',
    labels: ['完全不同意', '完全同意']
  }
];

// ──────────────── 屏幕切换 ────────────────
function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + screenId);
  if (target) {
    target.classList.add('active');
  }
  STATE.currentScreen = screenId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ──────────────── 星空动画 ────────────────
function initStars() {
  const canvas = document.getElementById('starCanvas');
  const ctx = canvas.getContext('2d');
  const stars = [];
  const STAR_COUNT = 120;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.3,
      alpha: Math.random(),
      speed: Math.random() * 0.015 + 0.005,
      phase: Math.random() * Math.PI * 2
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.alpha += s.speed * Math.sin(Date.now() * 0.001 + s.phase) > 0 ? 0.008 : -0.008;
      s.alpha = Math.max(0.2, Math.min(1, s.alpha));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,210,255,${s.alpha})`;
      ctx.fill();
      // 偶尔闪烁
      if (Math.random() < 0.002) s.alpha = 1;
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ──────────────── 知情同意 ────────────────
function toggleConsent() {
  STATE.consentGiven = !STATE.consentGiven;
  const check = document.getElementById('consentCheck');
  const btn = document.getElementById('btnStart');
  if (STATE.consentGiven) {
    check.textContent = '☑';
    check.classList.add('checked');
    btn.disabled = false;
  } else {
    check.textContent = '☐';
    check.classList.remove('checked');
    btn.disabled = true;
  }
}
window.toggleConsent = toggleConsent;

// ──────────────── 开始测评 ────────────────
function startAssessment() {
  if (!STATE.consentGiven) return;
  switchScreen('stage1');
  STATE.stage1.current = 0;
  STATE.stage1.answers = {};
  renderQuiz(1);
}
window.startAssessment = startAssessment;

// ──────────────── 渲染题目 ────────────────
function renderQuiz(stage) {
  const qData = stage === 1 ? STAGE1_QUESTIONS : stage === 2 ? STAGE2_QUESTIONS : STAGE3_QUESTIONS;
  const state = stage === 1 ? STATE.stage1 : stage === 2 ? STATE.stage2 : STATE.stage3;
  const idx = state.current;
  const container = document.getElementById('quizStage' + stage);

  if (idx >= qData.length) {
    // 本关完成，进入下一关或结果页
    if (stage === 1) {
      switchScreen('stage2');
      STATE.stage2.current = 0;
      STATE.stage2.answers = {};
      renderQuiz(2);
    } else if (stage === 2) {
      switchScreen('stage3');
      STATE.stage3.current = 0;
      STATE.stage3.answers = {};
      renderQuiz(3);
    } else {
      calcAndShowResults();
    }
    return;
  }

  const q = qData[idx];
  let html = '<div class="quiz-item">';
  if (q.illustration) {
    html += `<div class="quiz-illustration">${q.illustration}</div>`;
  }
  html += `<p class="quiz-question">${idx + 1}/${qData.length}. ${q.question}</p>`;

  if (q.type === 'select') {
    html += '<div class="options-group">';
    const curVal = state.answers[q.id];
    for (const opt of q.options) {
      const sel = curVal === opt.value ? ' selected' : '';
      html += `<button class="option-btn${sel}" onclick="selectOption(${stage}, '${q.id}', ${opt.value})">${opt.label}</button>`;
    }
    html += '</div>';
  } else if (q.type === 'likert') {
    // 未作答时预设默认值 2，用户可直接点下一题
    if (state.answers[q.id] === undefined) {
      state.answers[q.id] = 2;
    }
    const curVal = state.answers[q.id];
    html += '<div class="option-slider-wrap">';
    html += `<input type="range" min="0" max="4" step="1" value="${curVal}" oninput="sliderChange(${stage}, '${q.id}', this.value)">`;
    html += `<div class="range-labels"><span>${q.labels[0]}</span><span>${q.labels[1]}</span></div>`;
    html += `<div style="text-align:center;font-size:.85rem;font-weight:700;color:var(--accent2)">当前：${curVal} 分</div>`;
    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;

  // 更新进度条
  updateProgress(stage, idx, qData.length);

  // 更新导航按钮
  const btnPrev = document.querySelector(`#screen-stage${stage} .btn-prev`);
  const btnNext = document.querySelector(`#screen-stage${stage} .btn-next`);
  if (btnPrev) btnPrev.style.display = idx === 0 ? 'none' : 'block';
  if (btnNext) {
    btnNext.textContent = idx === qData.length - 1 ? (stage === 3 ? '查看报告 →' : '进入下一关 →') : '下一题';
  }

  // 更新趣味插图
  updateIllustration(stage, q);

  // Stage3 最后一题回答后显示雷达图
  if (stage === 3 && idx === qData.length - 1) {
    updateRadarChart();
  }
}

function updateProgress(stage, idx, total) {
  const pct = Math.round((idx / total) * 100);
  const fill = document.getElementById('progress' + stage);
  const text = document.getElementById('progressText' + stage);
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = pct;
}

function updateIllustration(stage, q) {
  const el = document.getElementById('illust1');
  if (!el || stage !== 1) return;
  const map = {
    'q1_bedtime': '🛏️💤',
    'q2_latency': '🐑🐑🐑',
    'q3_waketime': '⏰😫',
    'q4_duration': '😴💤',
    'q5_quality': '⭐🌙',
    'q6_disturbance': '🌙💤',
    'q7_medication': '💊❌',
    'q8_daytime': '☕😪'
  };
  el.textContent = map[q.id] || q.illustration || '';
}

// ──────────────── 选项交互 ────────────────
function selectOption(stage, qId, value) {
  const state = stage === 1 ? STATE.stage1 : stage === 2 ? STATE.stage2 : STATE.stage3;
  state.answers[qId] = value;
  // 重新渲染当前题（更新选中态）
  renderQuiz(stage);
}
window.selectOption = selectOption;

function sliderChange(stage, qId, value) {
  const state = stage === 1 ? STATE.stage1 : stage === 2 ? STATE.stage2 : STATE.stage3;
  state.answers[qId] = parseInt(value);
  renderQuiz(stage);
}
window.sliderChange = sliderChange;

// ──────────────── 导航 ────────────────
function nextQuestion(stage) {
  const qData = stage === 1 ? STAGE1_QUESTIONS : stage === 2 ? STAGE2_QUESTIONS : STAGE3_QUESTIONS;
  const state = stage === 1 ? STATE.stage1 : stage === 2 ? STATE.stage2 : STATE.stage3;
  const q = qData[state.current];
  const hasAnswer = state.answers[q.id] !== undefined;

  if (!hasAnswer) {
    // 轻提示
    shakeElement(document.querySelector(`#screen-stage${stage} .quiz-item`));
    return;
  }

  state.current++;
  renderQuiz(stage);
}
window.nextQuestion = nextQuestion;

function prevQuestion(stage) {
  const state = stage === 1 ? STATE.stage1 : stage === 2 ? STATE.stage2 : STATE.stage3;
  if (state.current > 0) {
    state.current--;
    renderQuiz(stage);
  }
}
window.prevQuestion = prevQuestion;

function shakeElement(el) {
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake .4s ease';
}
// 注入 shake 动画
const shakeStyle = document.createElement('style');
shakeStyle.textContent = '@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 50%{transform:translateX(8px)} 75%{transform:translateX(-4px)} }';
document.head.appendChild(shakeStyle);

// ──────────────── 雷达图 ────────────────
function updateRadarChart() {
  const preview = document.getElementById('radarPreview');
  if (!preview) return;
  preview.style.display = 'block';

  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const r = 100;

  // 收集各维度得分
  const dims = { consequences: [], worry: [], expectations: [], medication: [] };
  const answers = STATE.stage3.answers;
  for (const q of STAGE3_QUESTIONS) {
    if (answers[q.id] !== undefined) {
      dims[q.dimension].push(answers[q.id]);
    }
  }
  const scores = {};
  for (const [key, vals] of Object.entries(dims)) {
    scores[key] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length / 4 : 0;
  }

  // 保存供结果计算
  STATE._radarScores = scores;

  const axes = ['consequences', 'worry', 'expectations', 'medication'];
  const labels = ['后果夸大', '失控担忧', '僵化期望', '药物依赖'];
  const colors = ['#f7a641', '#e0556a', '#a78bfa', '#4ec9e0'];

  ctx.clearRect(0, 0, w, h);

  // 背景网格
  for (let level = 1; level <= 4; level++) {
    ctx.beginPath();
    const lr = r * (level / 4);
    for (let i = 0; i < 4; i++) {
      const angle = -Math.PI / 2 + (Math.PI * 2 / 4) * i;
      const px = cx + lr * Math.cos(angle);
      const py = cy + lr * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.stroke();
  }

  // 轴线
  for (let i = 0; i < 4; i++) {
    const angle = -Math.PI / 2 + (Math.PI * 2 / 4) * i;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.stroke();
  }

  // 数据多边形
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const key = axes[i];
    const val = scores[key] || 0;
    const angle = -Math.PI / 2 + (Math.PI * 2 / 4) * i;
    const px = cx + r * val * Math.cos(angle);
    const py = cy + r * val * Math.sin(angle);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(124,92,231,0.3)';
  ctx.fill();
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 数据点
  for (let i = 0; i < 4; i++) {
    const key = axes[i];
    const val = scores[key] || 0;
    const angle = -Math.PI / 2 + (Math.PI * 2 / 4) * i;
    const px = cx + r * val * Math.cos(angle);
    const py = cy + r * val * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = colors[i];
    ctx.fill();
    // 标签
    const lx = cx + (r + 24) * Math.cos(angle);
    const ly = cy + (r + 24) * Math.sin(angle);
    ctx.fillStyle = colors[i];
    ctx.font = '11px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], lx, ly);
  }
}

// ──────────────── 计算总分 ────────────────
function calcAndShowResults() {
  // --- PSQI 分数（0-24 -> 映射到百分制）---
  const a1 = STATE.stage1.answers;
  let psqiRaw = 0;
  for (const key in a1) {
    psqiRaw += (a1[key] || 0);
  }
  // 动态计算各题最大值之和，避免选项 value 调整后上限不准
  const psqiMax = STAGE1_QUESTIONS.reduce((sum, q) => sum + Math.max(...q.options.map(o => o.value)), 0);
  const sleepQuality = Math.round((1 - psqiRaw / psqiMax) * 100); // 越高越好

  // --- SHPS 分数 ---
  const a2 = STATE.stage2.answers;
  let shpsRaw = 0;
  for (const key in a2) {
    shpsRaw += (a2[key] || 0);
  }
  const shpsMax = STAGE2_QUESTIONS.length * 4;
  const habitScore = Math.round((1 - shpsRaw / shpsMax) * 100);

  // --- DBAS-16 分数 ---
  const a3 = STATE.stage3.answers;
  let dbasRaw = 0;
  let dbasCount = 0;
  for (const key in a3) {
    dbasRaw += (a3[key] || 0);
    dbasCount++;
  }
  const dbasAvg = dbasCount > 0 ? dbasRaw / dbasCount : 2; // 0-4
  const cognitionScore = Math.round((1 - dbasAvg / 4) * 100);

  // --- 综合总分 ---
  const totalScore = Math.round(
    sleepQuality * 0.35 + habitScore * 0.30 + cognitionScore * 0.25 + 10
  );
  const finalScore = Math.max(5, Math.min(100, totalScore));

  // 入睡效率（来自PSQI q2 + q4）
  const latency = a1['q2_latency'] !== undefined ? a1['q2_latency'] : 0;
  const duration = a1['q4_duration'] !== undefined ? a1['q4_duration'] : 0;
  const sleepEff = Math.round((1 - (latency + duration) / 6) * 100);
  const durationScore = Math.round((1 - duration / 3) * 100);

  STATE.scores = {
    total: finalScore,
    sleepEfficiency: Math.max(0, Math.min(100, sleepEff)),
    duration: Math.max(0, Math.min(100, durationScore)),
    habit: habitScore,
    cognition: cognitionScore,
    psqiRaw,
    shpsRaw,
    dbasAvg
  };

  switchScreen('result');
  renderResults();

  // 向父窗口发送分数（iframe嵌入时使用）
  try { window.parent.postMessage({ type:'sleepAssessmentResult', scores:STATE.scores, detail:STATE }, '*'); } catch(e) {}

  // 保存测评状态，从量表参考页返回时可恢复
  sessionStorage.setItem('sleepState', JSON.stringify({
    stage1: STATE.stage1,
    stage2: STATE.stage2,
    stage3: STATE.stage3,
    scores: STATE.scores,
    _radarScores: STATE._radarScores,
    currentScreen: 'result'
  }));
}

// ──────────────── 结果渲染 ────────────────
function renderResults() {
  const s = STATE.scores;
  if (!s) return;

  // 日期
  const now = new Date();
  document.getElementById('resultDate').textContent =
    `测评时间：${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;

  // 总分圆环
  document.getElementById('scoreNumber').textContent = s.total;
  const circle = document.getElementById('scoreCircle');
  circle.style.setProperty('--score-pct', s.total);

  // 评级
  let label, color;
  if (s.total >= 80) { label = '🏆 睡眠健康达人！你的睡眠债基本还清'; color = 'var(--success)'; }
  else if (s.total >= 60) { label = '👍 还不错，但还有一些"睡眠利息"需要关注'; color = 'var(--accent2)'; }
  else if (s.total >= 40) { label = '⚠️ 你的睡眠债开始累积了，是时候调整了'; color = 'var(--accent3)'; }
  else { label = '🚨 睡眠赤字严重！建议认真还债，长期欠债伤身'; color = 'var(--danger)'; }
  document.getElementById('scoreLabel').textContent = label;
  circle.style.background = `conic-gradient(${color} calc(${s.total} * 1%), rgba(255,255,255,.06) 0)`;

  // 分项
  setSubScore('subSleep', 'barSleep', 'valSleep', s.sleepEfficiency);
  setSubScore('subDuration', 'barDuration', 'valDuration', s.duration);
  setSubScore('subHabit', 'barHabit', 'valHabit', s.habit);
  setSubScore('subCognition', 'barCognition', 'valCognition', s.cognition);

  // 存钱罐
  const coinsStack = document.getElementById('coinsStack');
  const jarDesc = document.getElementById('jarDesc');
  const totalCoins = 10;
  const visibleCoins = Math.max(1, Math.round(s.total / 100 * totalCoins));
  const coins = coinsStack.querySelectorAll('.coin');
  coins.forEach((coin, i) => {
    coin.style.opacity = i < visibleCoins ? '1' : '0.15';
  });
  if (s.total >= 80) jarDesc.textContent = '💰 储蓄罐满满当当！你的睡眠银行很健康';
  else if (s.total >= 60) jarDesc.textContent = '🪙 罐子里还有些金币，但漏了不少——睡眠债在悄悄扣款';
  else if (s.total >= 40) jarDesc.textContent = '💸 金币所剩不多，睡眠赤字正在透支你的健康账户';
  else jarDesc.textContent = '🆘 罐子几乎空了！长期睡眠负债，身体已经开始"催收"';

  // 指导卡片
  renderGuidance(s);
}

function setSubScore(itemId, barId, valId, score) {
  const el = document.getElementById(itemId);
  if (!el) return;
  const bar = document.getElementById(barId);
  const val = document.getElementById(valId);
  setTimeout(() => {
    if (bar) bar.style.width = score + '%';
    if (val) val.textContent = score;
  }, 300);
}

// ──────────────── 个性化指导卡片 ────────────────
function renderGuidance(s) {
  const container = document.getElementById('guidanceCards');
  let cards = [];

  // 基于 PSQI 入睡困难/卧床时间
  const a1 = STATE.stage1.answers;
  const latencyVal = a1['q2_latency'] !== undefined ? a1['q2_latency'] : 0;
  const durationVal = a1['q4_duration'] !== undefined ? a1['q4_duration'] : 0;

  if (latencyVal >= 2 || durationVal >= 2) {
    cards.push({
      title: '🛏️ 刺激控制："床 = 睡眠"训练',
      text: '只有困倦时才上床。如果躺下20分钟仍睡不着，起床离开卧室，做一些放松的事（如听轻音乐、阅读），直到感到困倦再回床。坚持1-2周，大脑会重新建立"床=睡眠"的条件反射。',
      cls: 'card-warn'
    });
    cards.push({
      title: '⏰ 固定作息表',
      text: '每天同一时间起床（包括周末），误差不超过30分钟。即使前一晚睡得不好也坚持起床——这比赖床更能帮助调整生物钟。连续坚持7天可见初步效果。',
      cls: ''
    });
  }

  // 基于 SHPS 不良习惯
  const a2 = STATE.stage2.answers;
  const screenVal = a2['shps_screen'] !== undefined ? a2['shps_screen'] : 0;
  const caffeineVal = a2['shps_caffeine'] !== undefined ? a2['shps_caffeine'] : 0;
  const napVal = a2['shps_nap'] !== undefined ? a2['shps_nap'] : 0;
  const bedUseVal = a2['shps_bed_use'] !== undefined ? a2['shps_bed_use'] : 0;

  if (screenVal >= 2 || bedUseVal >= 2) {
    cards.push({
      title: '📵 睡前1小时远离屏幕',
      text: '电子屏幕的蓝光会抑制褪黑素分泌达50%以上。设定"数字宵禁"——睡前1小时关闭手机/电脑，改为纸质书阅读或听播客。如果必须用手机，开启"夜间模式"并佩戴防蓝光眼镜。',
      cls: 'card-warn'
    });
  }

  if (caffeineVal >= 2) {
    cards.push({
      title: '☕ 下午2点后告别咖啡因',
      text: '咖啡因的半衰期约5-6小时，下午喝一杯咖啡/茶，到晚上10点体内仍有50%残留。将咖啡/茶限制在上午，下午换为白开水、柠檬水或无咖啡因花茶（如洋甘菊茶）。',
      cls: 'card-warn'
    });
  }

  if (napVal >= 2) {
    cards.push({
      title: '😴 科学午睡：20-30分钟黄金法则',
      text: '午睡超过30分钟会进入深睡眠，醒来后更困（睡眠惯性），且会削弱晚上的睡眠驱动力。设置闹钟，午睡控制在20-30分钟，最好在下午2点前完成。',
      cls: ''
    });
  }

  // 基于 DBAS 认知偏差
  const a3 = STATE.stage3.answers;
  const expectVal1 = a3['dbas_expect1'] !== undefined ? a3['dbas_expect1'] : 0;
  const expectVal2 = a3['dbas_expect2'] !== undefined ? a3['dbas_expect2'] : 0;
  const medVal1 = a3['dbas_med1'] !== undefined ? a3['dbas_med1'] : 0;
  const medVal2 = a3['dbas_med2'] !== undefined ? a3['dbas_med2'] : 0;
  const consequenceAvg = (
    (a3['dbas_consequence1'] || 0) + (a3['dbas_consequence2'] || 0)
  ) / 2;

  if (expectVal1 >= 3 || expectVal2 >= 3) {
    cards.push({
      title: '🧠 认知纠正：7小时最延寿',
      text: '研究显示，每晚睡7小时与最低的全因死亡率相关（《JAMA Network Open》2021）。"必须睡8小时"是一个僵化认知。每个人对睡眠的需求不同，只要白天精力充沛，6.5-7.5小时也可以是非常健康的睡眠。',
      cls: 'card-cog'
    });
  }

  if (consequenceAvg >= 3) {
    cards.push({
      title: '🔄 认知纠正：一晚没睡好≠一天都崩了',
      text: '大脑有很强的补偿能力——偶尔一晚睡眠不佳，前额叶皮层会调动备用资源。研究发现，人们往往高估了失眠的后果。告诉自己："就算睡得不好，我也能应对今天。"这种自我对话本身就降低了焦虑。',
      cls: 'card-cog'
    });
  }

  if (medVal1 >= 3 || medVal2 >= 3) {
    cards.push({
      title: '💊 认知纠正：药物不是唯一出路',
      text: 'CBT-I（失眠认知行为治疗）被美国医师学会推荐为慢性失眠的**一线治疗**，效果优于药物且无副作用。助眠药物的长期使用存在依赖风险和认知副作用。建议在医生指导下逐步减药。',
      cls: 'card-cog'
    });
  }

  // ── 冷知识针对性展示（基于第二关作答情况）──
  const coldCards = [];
  for (const q of STAGE2_QUESTIONS) {
    const val = a2[q.id] !== undefined ? a2[q.id] : 0;
    // 值≥2 表示存在明显的不良睡眠卫生习惯，触发冷知识提醒
    const threshold = 2;
    if (val >= threshold && q.coldTip !== undefined) {
      const tip = COLD_KNOWLEDGE[q.coldTip];
      if (tip) {
        coldCards.push({
          title: '🧊 冷知识',
          text: tip.replace('🧊 冷知识：', ''),
          cls: 'card-cog'
        });
      }
    }
  }
  if (coldCards.length > 0) {
    cards.push({
      title: '📚 基于你的睡眠习惯，下面是你需要知道的冷知识',
      text: '',
      cls: 'section-header'
    });
    cards.push(...coldCards);
  }

  // 渲染
  container.innerHTML = cards.map((c, i) => `
    <div class="guide-card ${c.cls}" style="animation: fadeSlideIn .4s ease ${i * 0.1}s both;">
      <h4>${c.title}</h4>
      <p>${c.text}</p>
    </div>
  `).join('');
}

// ──────────────── 海报生成 ────────────────
function generatePoster() {
  const s = STATE.scores;
  if (!s) return;
  document.getElementById('posterScore').textContent = s.total;
  const adviceEl = document.getElementById('posterAdvice');
  if (s.total >= 80) adviceEl.textContent = '建议：保持当前良好习惯，继续"零负债"睡眠！';
  else if (s.total >= 60) adviceEl.textContent = '建议：调整作息规律，减少睡前屏幕时间。';
  else if (s.total >= 40) adviceEl.textContent = '建议：固定起床时间，下午不碰咖啡因，练习腹式呼吸。';
  else adviceEl.textContent = '建议：尽快建立规律作息，减少卧床清醒时间，必要时寻求专业帮助。';
  document.getElementById('posterOverlay').style.display = 'flex';
}
window.generatePoster = generatePoster;

function closePoster() {
  document.getElementById('posterOverlay').style.display = 'none';
}
window.closePoster = closePoster;

function savePoster() {
  const posterCard = document.getElementById('posterCard');
  if (!posterCard) return;

  // 隐藏保存/关闭按钮
  const closeBtn = posterCard.querySelector('.btn-close-poster');
  const saveBtn = posterCard.querySelector('.btn-save-poster');
  if (closeBtn) closeBtn.style.display = 'none';
  if (saveBtn) saveBtn.style.display = 'none';

  // 修复 html2canvas 对 webkit 渐变文字的兼容问题：
  // CSS 里用了 -webkit-background-clip:text + transparent fill → html2canvas
  // 无法裁剪背景，会把渐变矩形整个画出来，文字本身反而不可见
  const scoreEl = posterCard.querySelector('.poster-score');
  const styleFixes = [];
  if (scoreEl) {
    // 强制覆盖 CSS 样式表规则（不能用 '' 清除，否则样式表规则又生效）
    const overrides = [
      ['-webkit-text-fill-color', '#ffffff'],
      ['-webkit-background-clip', 'border-box'],
      ['background', 'none'],
      ['text-shadow', '0 0 16px rgba(78,201,224,.5)'],
      ['color', '#ffffff']
    ];
    for (const [prop, val] of overrides) {
      styleFixes.push([prop, scoreEl.style.getPropertyValue(prop)]);
      scoreEl.style.setProperty(prop, val, 'important');
    }
  }

  html2canvas(posterCard, {
    backgroundColor: '#0f1245',
    scale: 2,
    useCORS: true,
    logging: false
  }).then(canvas => {
    // 恢复按钮
    if (closeBtn) closeBtn.style.display = '';
    if (saveBtn) saveBtn.style.display = '';

    // 恢复文字样式
    if (scoreEl) {
      for (const [prop, origVal] of styleFixes) {
        if (origVal) scoreEl.style.setProperty(prop, origVal);
        else scoreEl.style.removeProperty(prop);
      }
    }

    // 触发下载
    const link = document.createElement('a');
    link.download = '我的睡眠健康报告.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    // 恢复按钮
    if (closeBtn) closeBtn.style.display = '';
    if (saveBtn) saveBtn.style.display = '';

    // 恢复文字样式
    if (scoreEl) {
      for (const [prop, origVal] of styleFixes) {
        if (origVal) scoreEl.style.setProperty(prop, origVal);
        else scoreEl.style.removeProperty(prop);
      }
    }

    console.error('海报生成失败:', err);
    alert('图片保存失败，请尝试截图保存。');
  });
}
window.savePoster = savePoster;

// ──────────────── 重新测评 ────────────────
function restartAll() {
  STATE.stage1 = { current: 0, answers: {} };
  STATE.stage2 = { current: 0, answers: {} };
  STATE.stage3 = { current: 0, answers: {} };
  STATE.scores = null;
  STATE._radarScores = null;
  sessionStorage.removeItem('sleepState');
  switchScreen('landing');
}
window.restartAll = restartAll;

// ──────────────── 验证码已移除 ────────────────
function initCaptcha() {
  sessionStorage.setItem('captchaVerified', '1');
  var overlay = document.getElementById('captchaOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ──────────────── 初始化 ────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCaptcha();
  initStars();

  // 从量表参考页返回时恢复测评结果
  const saved = sessionStorage.getItem('sleepState');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      STATE.stage1 = data.stage1;
      STATE.stage2 = data.stage2;
      STATE.stage3 = data.stage3;
      STATE.scores = data.scores;
      STATE._radarScores = data._radarScores;
      switchScreen('result');
      renderResults();
    } catch (e) {
      sessionStorage.removeItem('sleepState');
    }
  }
});
