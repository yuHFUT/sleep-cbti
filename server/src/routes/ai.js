const express = require('express');
const router = express.Router();
const { chat } = require('../services/aiService');

router.post('/chat', async (req, res) => {
  try {
    const { userId, messages } = req.body;
    if (!userId || !messages?.length) {
      return res.status(400).json({ code: 400, message: '缺少参数' });
    }

    const reply = await chat(userId, messages);
    res.json({ code: 200, data: { role: 'assistant', content: reply } });
  } catch (error) {
    console.error('AI 调用失败:', error.message);
    res.status(500).json({ code: 500, message: error.message });
  }
});

module.exports = router;
