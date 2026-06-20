const express = require('express');
const router = express.Router();
const scalesConfig = require('../config/scales.config');

// 获取所有量表元信息
router.get('/', (req, res) => {
  const meta = Object.entries(scalesConfig).map(([key, scale]) => ({
    key,
    title: scale.title,
    instruction: scale.instruction,
    estimatedTime: scale.estimatedTime,
    questionCount: scale.sections.reduce((sum, s) => sum + s.questions.length, 0),
    sections: scale.sections.map(s => ({
      title: s.title,
      count: s.questions.length,
    })),
  }));
  res.json({ code: 200, data: meta });
});

// 获取指定量表完整题目
router.get('/:scaleKey', (req, res) => {
  const { scaleKey } = req.params;
  const key = scaleKey.toUpperCase();
  const config = scalesConfig[key];

  if (!config) {
    return res.status(404).json({ code: 404, message: `量表 ${scaleKey} 不存在` });
  }

  res.json({ code: 200, data: { key, ...config } });
});

module.exports = router;
