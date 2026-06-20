-- ============================================
-- 睡益良方 - 数据库初始化脚本
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS sleep_cbti
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sleep_cbti;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openid VARCHAR(64) UNIQUE COMMENT '微信OpenID',
  nickname VARCHAR(100) DEFAULT '匿名用户',
  avatar_url VARCHAR(500),
  gender TINYINT DEFAULT 0 COMMENT '0未知 1男 2女',
  age TINYINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 评估记录表（PSQI / SHPS / DBAS-16）
CREATE TABLE IF NOT EXISTS assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  scale_type ENUM('PSQI','SHPS','DBAS-16') NOT NULL COMMENT '量表类型',
  total_score DECIMAL(5,2) COMMENT '总分',
  dimension_scores JSON COMMENT '各维度得分（JSON）',
  answers JSON COMMENT '答题详情（JSON）',
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评估记录表';

-- 睡眠日记表
CREATE TABLE IF NOT EXISTS sleep_diaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  diary_date DATE NOT NULL COMMENT '记录日期',
  bed_time TIME COMMENT '上床时间',
  lights_off_time TIME COMMENT '熄灯时间',
  sleep_latency INT COMMENT '入睡耗时（分钟）',
  night_awakenings INT DEFAULT 0 COMMENT '夜醒次数',
  wake_up_time TIME COMMENT '起床时间',
  daytime_energy TINYINT COMMENT '日间精力评分(1-10)',
  sleep_efficiency DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN TIME_TO_SEC(TIMEDIFF(wake_up_time, lights_off_time)) > 0
      THEN ROUND(
        (TIME_TO_SEC(TIMEDIFF(wake_up_time, lights_off_time)) / 60 - sleep_latency - night_awakenings * 5)
        / (TIME_TO_SEC(TIMEDIFF(wake_up_time, lights_off_time)) / 60)
        * 100, 2
      )
      ELSE NULL
    END
  ) STORED COMMENT '睡眠效率（自动计算）',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_date (user_id, diary_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='睡眠日记表';

-- 干预方案表
CREATE TABLE IF NOT EXISTS intervention_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_type ENUM('sleep_restriction','stimulus_control','cognitive_restructure','relaxation','sleep_hygiene') COMMENT '干预类型',
  plan_config JSON COMMENT '干预配置（JSON）',
  is_active TINYINT(1) DEFAULT 1,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='干预方案表';

-- 每日任务表
CREATE TABLE IF NOT EXISTS daily_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT,
  task_type VARCHAR(50) COMMENT '任务类型',
  task_content TEXT COMMENT '任务内容',
  is_completed TINYINT(1) DEFAULT 0,
  task_date DATE NOT NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES intervention_plans(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日任务表';

-- 成就徽章表
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  badge_code VARCHAR(50) NOT NULL COMMENT '徽章编码',
  badge_name VARCHAR(100) NOT NULL COMMENT '徽章名称',
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_badge (user_id, badge_code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成就徽章表';

-- 周报表
CREATE TABLE IF NOT EXISTS weekly_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  avg_sleep_efficiency DECIMAL(5,2),
  avg_sleep_latency DECIMAL(5,2),
  confidence_score TINYINT COMMENT '信心评分',
  report_data JSON COMMENT '报告详情（JSON）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_week (user_id, week_start),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='周报表';
