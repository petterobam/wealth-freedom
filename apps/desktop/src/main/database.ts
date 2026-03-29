/**
 * SQLite 数据库初始化
 * 财富自由之路 - 数据层
 */

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

// 数据库文件路径
const getDataPath = (): string => {
  const userDataPath = app.getPath('userData');
  const dataPath = path.join(userDataPath, 'wealth-freedom');
  
  // 确保目录存在
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
  
  return dataPath;
};

const getDbPath = (): string => {
  return path.join(getDataPath(), 'data.db');
};

// 初始化数据库
export const initDatabase = (): Database.Database => {
  const dbPath = getDbPath();
  const db = new Database(dbPath);
  
  // 启用外键约束
  db.pragma('journal_mode = WAL');
  
  // 创建表
  createTables(db);
  
  return db;
};

// 创建所有表
const createTables = (db: Database.Database): void => {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      avatar TEXT,
      currency TEXT DEFAULT 'CNY',
      guarantee_months INTEGER DEFAULT 6,
      expected_return_rate REAL DEFAULT 8.0,
      settings TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 账户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'CNY',
      institution TEXT,
      notes TEXT,
      is_reserved INTEGER DEFAULT 0,
      include_in_net_worth INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 负债表
  db.exec(`
    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      total_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      remaining_amount REAL NOT NULL,
      monthly_payment REAL,
      interest_rate REAL,
      priority INTEGER DEFAULT 3,
      due_date DATE,
      notes TEXT,
      is_paid_off INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 交易记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      note TEXT,
      description TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
  `);

  // 目标表
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      target_date DATE,
      notes TEXT,
      status TEXT DEFAULT 'in_progress',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 梦想表
  db.exec(`
    CREATE TABLE IF NOT EXISTS dreams (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      estimated_cost REAL,
      monthly_cost REAL DEFAULT 0,
      priority INTEGER DEFAULT 3,
      is_achieved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 收入来源表
  db.exec(`
    CREATE TABLE IF NOT EXISTS income_sources (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      source TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      currency TEXT DEFAULT 'CNY',
      stability INTEGER DEFAULT 3,
      growth_rate REAL DEFAULT 0,
      start_date DATE,
      end_date DATE,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 收入记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS income_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      frequency TEXT NOT NULL,
      currency TEXT DEFAULT 'CNY',
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (source_id) REFERENCES income_sources(id)
    )
  `);

  // 收入目标表
  db.exec(`
    CREATE TABLE IF NOT EXISTS income_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      target_percentage REAL,
      current_percentage REAL DEFAULT 0,
      target_date DATE,
      status TEXT DEFAULT 'in_progress',
      priority INTEGER DEFAULT 3,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 收入策略表
  db.exec(`
    CREATE TABLE IF NOT EXISTS income_strategies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      steps TEXT,
      expected_income REAL,
      time_frame INTEGER,
      difficulty INTEGER DEFAULT 3,
      priority INTEGER DEFAULT 3,
      is_recommended INTEGER DEFAULT 0,
      applied INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 收入行动计划表
  db.exec(`
    CREATE TABLE IF NOT EXISTS income_actions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      strategy_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      priority INTEGER DEFAULT 3,
      status TEXT DEFAULT 'pending',
      due_date DATE,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (strategy_id) REFERENCES income_strategies(id)
    )
  `);

  // 收入模拟方案表
  db.exec(`
    CREATE TABLE IF NOT EXISTS income_simulations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      current_monthly_income REAL NOT NULL,
      current_annual_income REAL NOT NULL,
      active_growth_rate REAL,
      passive_growth_rate REAL,
      new_income_sources TEXT,
      simulation_years INTEGER DEFAULT 10,
      results TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_dreams_user ON dreams(user_id);
    CREATE INDEX IF NOT EXISTS idx_income_sources_user ON income_sources(user_id);
    CREATE INDEX IF NOT EXISTS idx_income_records_user_date ON income_records(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_income_records_source ON income_records(source_id);
    CREATE INDEX IF NOT EXISTS idx_income_goals_user ON income_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_income_strategies_user ON income_strategies(user_id);
    CREATE INDEX IF NOT EXISTS idx_income_actions_user ON income_actions(user_id);
    CREATE INDEX IF NOT EXISTS idx_income_actions_strategy ON income_actions(strategy_id);
    CREATE INDEX IF NOT EXISTS idx_income_simulations_user ON income_simulations(user_id);
  `);
};

// 关闭数据库连接
export const closeDatabase = (db: Database.Database): void => {
  db.close();
};

export default initDatabase;
