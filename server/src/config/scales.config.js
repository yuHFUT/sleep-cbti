/**
 * 三大量表题目配置
 * 前端根据此配置渲染问卷页面
 */

module.exports = {
  // ==========================================
  // PSQI：匹兹堡睡眠质量指数（19个自评条目）
  // ==========================================
  PSQI: {
    title: '匹兹堡睡眠质量指数（PSQI）',
    instruction: '下面一些问题是关于您最近1个月的睡眠情况，请选择或填写最符合您近1个月实际情况的答案。',
    estimatedTime: '5~10分钟',
    sections: [
      {
        title: '睡眠时间',
        questions: [
          { id: 'q1', type: 'time', label: '近1个月，晚上上床睡觉通常是几点钟？', hint: '请选择通常的上床时间' },
          { id: 'q2', type: 'number', label: '近1个月，从上床到入睡通常需要多少分钟？', unit: '分钟', min: 0, max: 300 },
          { id: 'q3', type: 'time', label: '近1个月，通常早上几点起床？', hint: '请选择通常的起床时间' },
          { id: 'q4', type: 'number', label: '近1个月，每夜通常实际睡眠多少小时？（不等于卧床时间）', unit: '小时', min: 0, max: 24, step: 0.5 },
        ],
      },
      {
        title: '睡眠干扰因素',
        description: '近1个月，因以下原因影响睡眠的频率：',
        questions: [
          { id: 'q5a', type: 'scale4', label: '入睡困难（30分钟内不能入睡）' },
          { id: 'q5b', type: 'scale4', label: '夜间易醒或早醒' },
          { id: 'q5c', type: 'scale4', label: '夜间去厕所' },
          { id: 'q5d', type: 'scale4', label: '呼吸不畅' },
          { id: 'q5e', type: 'scale4', label: '咳嗽或鼾声高' },
          { id: 'q5f', type: 'scale4', label: '感觉冷' },
          { id: 'q5g', type: 'scale4', label: '感觉热' },
          { id: 'q5h', type: 'scale4', label: '做噩梦' },
          { id: 'q5i', type: 'scale4', label: '疼痛不适' },
          { id: 'q5j', type: 'scale4', label: '其他原因', optional: true },
        ],
        scaleType: 'frequency4',
        scaleLabels: ['无', '<1次/周', '1~2次/周', '≥3次/周'],
      },
      {
        title: '整体评价',
        questions: [
          { id: 'q6', type: 'scale4', label: '近1个月，总的来说，您认为自己的睡眠质量如何？', scaleLabels: ['很好', '较好', '较差', '很差'] },
          { id: 'q7', type: 'scale4', label: '近1个月，您使用催眠药物（处方或非处方）的情况？', scaleLabels: ['无', '<1次/周', '1~2次/周', '≥3次/周'] },
          { id: 'q8', type: 'scale4', label: '近1个月，您在开车、用餐或社交活动中难以保持清醒的情况？', scaleLabels: ['无', '<1次/周', '1~2次/周', '≥3次/周'] },
          { id: 'q9', type: 'scale4', label: '近1个月，您做事情时精力不足的程度？', scaleLabels: ['没有', '偶尔有', '有时有', '经常有'] },
        ],
      },
    ],
  },

  // ==========================================
  // SHPS：睡眠卫生习惯量表（19题版，0-7分）
  // ==========================================
  SHPS: {
    title: '睡眠卫生习惯量表（SHPS）',
    instruction: '以下题目描述与睡眠相关的行为与习惯，请根据您近期的实际情况，选择最符合的频率。',
    estimatedTime: '5~10分钟',
    scaleLabels: [
      { value: 0, label: '从不' },
      { value: 1, label: '很少' },
      { value: 2, label: '偶尔' },
      { value: 3, label: '有时' },
      { value: 4, label: '半数时间' },
      { value: 5, label: '经常' },
      { value: 6, label: '几乎总是' },
      { value: 7, label: '总是' },
    ],
    sections: [
      {
        title: '一、睡眠规律性（Schedule）',
        questions: [
          { id: 'q1', label: '每天上床睡觉的时间不固定（相差超过2小时）' },
          { id: 'q2', label: '每天起床的时间不固定（相差超过2小时）' },
          { id: 'q3', label: '午睡时间超过30分钟' },
          { id: 'q4', label: '周末与工作日的睡眠时间差异很大' },
        ],
      },
      {
        title: '二、睡前觉醒行为（Arousal）',
        questions: [
          { id: 'q5', label: '睡前1-2小时进行工作、学习或剧烈运动' },
          { id: 'q6', label: '睡前使用手机、电脑或平板等电子设备' },
          { id: 'q7', label: '睡前处理令自己焦虑或紧张的事务' },
          { id: 'q8', label: '躺在床上时脑子还在想各种事情，难以放松' },
          { id: 'q9', label: '睡到一半醒来后，很难再次入睡' },
        ],
      },
      {
        title: '三、睡前饮食与物质使用（Eating/Substances）',
        questions: [
          { id: 'q10', label: '睡前一小时内喝茶、咖啡或含咖啡因的饮料' },
          { id: 'q11', label: '睡前抽烟或使用尼古丁产品' },
          { id: 'q12', label: '睡前一小时内饮用含酒精饮品' },
          { id: 'q13', label: '睡前吃大量食物（夜宵）' },
          { id: 'q14', label: '傍晚（17点）后摄入咖啡因（咖啡、茶、可乐等）' },
        ],
      },
      {
        title: '四、睡眠环境（Environment）',
        questions: [
          { id: 'q15', label: '卧室温度不舒适（太热或太冷，理想18-22℃）' },
          { id: 'q16', label: '卧室保持安静、无干扰噪音', reverse: true },
          { id: 'q17', label: '卧室在睡眠时保持黑暗或仅使用微弱的夜灯', reverse: true },
          { id: 'q18', label: '床垫和枕头舒适、有支撑力', reverse: true },
          { id: 'q19', label: '只在感到困倦时才上床睡觉', reverse: true },
        ],
      },
    ],
  },

  // ==========================================
  // DBAS-16：睡眠信念与态度量表（16题，0-10分）
  // ==========================================
  DBAS16: {
    title: '睡眠信念与态度量表（DBAS-16）',
    instruction: '以下列出人们对睡眠的一些看法和信念。请根据您自己的认同程度，从0（完全不同意）到10（完全同意）给出评分。',
    estimatedTime: '约5分钟',
    scaleType: 'likert10',
    scaleLabels: [
      { value: 0, label: '完全不同意' },
      { value: 5, label: '中立' },
      { value: 10, label: '完全同意' },
    ],
    sections: [
      {
        title: '一、对睡眠的期望',
        questions: [
          { id: 'q1', label: '我需要睡足8小时，白天才能够精力充沛和活动良好' },
          { id: 'q2', label: '当我一个晚上没有睡到足够的时间，我需要在第二天午睡或打盹，或晚上睡更长的时间' },
        ],
      },
      {
        title: '二、对失眠的担忧与无助感',
        questions: [
          { id: 'q3', label: '我担心长期失眠会影响我的健康' },
          { id: 'q4', label: '我担心自己失去控制睡眠的能力' },
          { id: 'q8', label: '如果某个晚上我睡得不好，我知道整个星期的睡眠时间就会被打乱' },
          { id: 'q10', label: '我始终没法预测自己的睡眠状况是好或是不好' },
          { id: 'q11', label: '我只有一点点能力可以处理睡眠困扰所产生的负面影响' },
          { id: 'q14', label: '我觉得失眠摧毁自己享受生命的能力，而且让我不能随心所欲地做想做的事' },
        ],
      },
      {
        title: '三、失眠所致后果',
        questions: [
          { id: 'q5', label: '当前一晚睡得不好，我知道隔天的活动一定会受到影响' },
          { id: 'q7', label: '如果我在白天感到焦躁、抑郁、焦虑，大部分是因为前一晚没睡好' },
          { id: 'q9', label: '如果晚上没有适当的睡眠，隔天我简直没办法做事情' },
          { id: 'q12', label: '如果我在白天感到累、没有精力、或是表现不好，通常是因为前一晚睡得不好' },
          { id: 'q16', label: '如果我前一夜无法入眠，隔天会逃避或取消自己应该做的事（社会、家庭）' },
        ],
      },
      {
        title: '四、药物使用信念',
        questions: [
          { id: 'q6', label: '为了保持白天清醒的工作状态，我认为比较好的方式是吃助眠药物，而不是让自己一整晚睡不好' },
          { id: 'q13', label: '我相信失眠是因为体内化学物质不平衡所致' },
          { id: 'q15', label: '药物是解决失眠问题的唯一方式' },
        ],
      },
    ],
  },
};
