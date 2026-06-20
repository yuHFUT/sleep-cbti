# 睡益良方 API 接口文档

> Base URL: `http://localhost:3000/api`

## 一、认证

### POST /auth/register
注册新用户
```
Body: { username, password, nickname? }
→ { code:200, data: { user, token } }
```

### POST /auth/login
登录
```
Body: { username, password }
→ { code:200, data: { user, token } }
```

### GET /auth/profile
获取当前用户信息（需 Bearer token）

---

## 二、睡眠评估

### POST /assessment/save
保存 H5 测评结果
```
Body: { userId, scores: { total, sleepQuality, duration, habit, cognition } }
→ { code:200, message: "保存成功" }
```

### GET /assessment/history/:userId
获取测评历史
```
→ { code:200, data: [{ id, total_score, sleep_quality, duration, habit, cognition, completed_at }] }
```

### GET /scales
获取量表列表
```
→ { code:200, data: [{ key, title, questionCount }] }
```

### GET /scales/:key
获取量表题目（key: PSQI | SHPS | DBAS16）

---

## 三、睡眠日记

### POST /diary/:userId
保存/更新日记
```
Body: { diaryDate, bedTime, lightsOffTime, sleepLatency, nightAwakenings, wakeUpTime, daytimeEnergy, notes? }
→ { code:200, data: { ...diary, sleep_efficiency } }
```

### GET /diary/:userId/:date
获取指定日期日记

### GET /diary/:userId
获取日记列表 `?startDate=&endDate=&limit=`

### GET /diary/:userId/trend/efficiency
获取效率趋势 `?days=7`

---

## 四、干预处方

### GET /intervention/sleep-restriction/:userId
睡眠限制处方 `?days=7`

### GET /intervention/stimulus-control/:userId
刺激控制卡片

### POST /intervention/stimulus-control/:userId/checkin
刺激控制打卡

### GET /intervention/cognitive/:userId
认知重塑练习

### POST /intervention/cognitive/:userId
提交认知练习 `{ exerciseId, thoughtRecord, factCheck }`

### GET /intervention/relaxation
放松训练列表

### GET /intervention/relaxation/:exerciseId
放松训练详情

### GET /intervention/hygiene/:userId
每日睡眠卫生任务

### POST /intervention/hygiene/:userId/:taskId
完成/取消卫生任务 `{ completed: true/false }`

---

## 五、数据追踪

### GET /report/weekly/:userId
周报生成 `?weekStart=&weekEnd=`

### GET /report/achievements/:userId
成就徽章列表

### POST /report/achievements/:userId/check
检查新成就

### GET /dashboard/:userId
首页数据汇总（最新得分/平均时长/平均效率）

---

## 六、社区

### GET /community/camps
挑战营列表

### POST /community/camps/:userId/join
加入营地 `{ campId }`

### GET /community/camps/:userId/my
我的营地状态

### POST /community/camps/:userId/checkin
打卡

### GET /community/camps/:campId/stats
营地统计

### GET /community/posts
话题帖子列表 `?page=&limit=`

### POST /community/posts/:userId
发布帖子 `{ content }`

### POST /community/posts/:postId/like
点赞

---

## 七、AI 助手

### POST /ai/chat
AI 对话
```
Body: { userId, messages: [{ role: "user", content: "..." }] }
→ { code:200, data: { role: "assistant", content: "..." } }
```

---

## 通用说明

- **认证**：需登录的接口在 Header 中传 `Authorization: Bearer <token>`
- **错误格式**：`{ code: 4xx/5xx, message: "错误描述" }`
- **JWT 有效期**：7 天
