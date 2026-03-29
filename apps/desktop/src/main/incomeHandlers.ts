/**
 * 收入规划相关 IPC 处理程序
 */

import { ipcMain } from 'electron';
import {
  calculateMonthlyIncome,
  calculateAnnualIncome,
  calculateIncomeStructure,
  generateIncomeAnalysisReport,
  generateIncomeDashboard,
  predictFinancialFreedom,
  simulateIncomeGrowth,
  convertToMonthly,
} from '@wealth-freedom/shared';
import type { Database } from 'better-sqlite3';

let db: Database.Database;

/**
 * 初始化收入规划 IPC 处理程序
 */
export function initIncomeHandlers(database: Database.Database) {
  db = database;

  // ==================== 收入来源相关 ====================
  ipcMain.handle('incomeSource:getAll', handleIncomeSourceGetAll);
  ipcMain.handle('incomeSource:getById', handleIncomeSourceGetById);
  ipcMain.handle('incomeSource:create', handleIncomeSourceCreate);
  ipcMain.handle('incomeSource:update', handleIncomeSourceUpdate);
  ipcMain.handle('incomeSource:delete', handleIncomeSourceDelete);

  // ==================== 收入记录相关 ====================
  ipcMain.handle('incomeRecord:getAll', handleIncomeRecordGetAll);
  ipcMain.handle('incomeRecord:getById', handleIncomeRecordGetById);
  ipcMain.handle('incomeRecord:create', handleIncomeRecordCreate);
  ipcMain.handle('incomeRecord:update', handleIncomeRecordUpdate);
  ipcMain.handle('incomeRecord:delete', handleIncomeRecordDelete);

  // ==================== 收入目标相关 ====================
  ipcMain.handle('incomeGoal:getAll', handleIncomeGoalGetAll);
  ipcMain.handle('incomeGoal:getById', handleIncomeGoalGetById);
  ipcMain.handle('incomeGoal:create', handleIncomeGoalCreate);
  ipcMain.handle('incomeGoal:update', handleIncomeGoalUpdate);
  ipcMain.handle('incomeGoal:delete', handleIncomeGoalDelete);

  // ==================== 收入策略相关 ====================
  ipcMain.handle('incomeStrategy:getAll', handleIncomeStrategyGetAll);
  ipcMain.handle('incomeStrategy:getRecommended', handleIncomeStrategyGetRecommended);
  ipcMain.handle('incomeStrategy:create', handleIncomeStrategyCreate);
  ipcMain.handle('incomeStrategy:update', handleIncomeStrategyUpdate);
  ipcMain.handle('incomeStrategy:delete', handleIncomeStrategyDelete);
  ipcMain.handle('incomeStrategy:apply', handleIncomeStrategyApply);

  // ==================== 收入行动计划相关 ====================
  ipcMain.handle('incomeAction:getAll', handleIncomeActionGetAll);
  ipcMain.handle('incomeAction:getById', handleIncomeActionGetById);
  ipcMain.handle('incomeAction:create', handleIncomeActionCreate);
  ipcMain.handle('incomeAction:update', handleIncomeActionUpdate);
  ipcMain.handle('incomeAction:delete', handleIncomeActionDelete);

  // ==================== 收入分析相关 ====================
  ipcMain.handle('income:getDashboard', handleIncomeGetDashboard);
  ipcMain.handle('income:getAnalysis', handleIncomeGetAnalysis);
  ipcMain.handle('income:getStructure', handleIncomeGetStructure);

  // ==================== 收入模拟相关 ====================
  ipcMain.handle('income:simulate', handleIncomeSimulate);
  ipcMain.handle('incomeSimulation:getAll', handleIncomeSimulationGetAll);
  ipcMain.handle('incomeSimulation:create', handleIncomeSimulationCreate);
  ipcMain.handle('incomeSimulation:delete', handleIncomeSimulationDelete);

  // ==================== 财务自由预测 ====================
  ipcMain.handle('income:predictFinancialFreedom', handlePredictFinancialFreedom);
}

// ==================== 收入来源处理函数 ====================

async function handleIncomeSourceGetAll() {
  const stmt = db.prepare('SELECT * FROM income_sources ORDER BY created_at DESC');
  return stmt.all();
}

async function handleIncomeSourceGetById(_event: any, id: string) {
  const stmt = db.prepare('SELECT * FROM income_sources WHERE id = ?');
  return stmt.get(id);
}

async function handleIncomeSourceCreate(_event: any, data: any) {
  const id = `income-source-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO income_sources (
      id, user_id, name, type, category, source, amount, frequency,
      currency, stability, growth_rate, start_date, end_date, notes, is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.userId || data.user_id,
    data.name,
    data.type,
    data.category,
    data.source,
    data.amount,
    data.frequency,
    data.currency || 'CNY',
    data.stability || 3,
    data.growthRate || data.growth_rate || 0,
    data.startDate || data.start_date || null,
    data.endDate || data.end_date || null,
    data.notes || null,
    data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1
  );

  return { id, ...data };
}

async function handleIncomeSourceUpdate(_event: any, id: string, data: any) {
  const stmt = db.prepare(`
    UPDATE income_sources
    SET name = ?, type = ?, category = ?, source = ?, amount = ?, frequency = ?,
        currency = ?, stability = ?, growth_rate = ?, start_date = ?, end_date = ?,
        notes = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(
    data.name,
    data.type,
    data.category,
    data.source,
    data.amount,
    data.frequency,
    data.currency,
    data.stability,
    data.growthRate || data.growth_rate,
    data.startDate || data.start_date,
    data.endDate || data.end_date,
    data.notes,
    data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
    id
  );

  return { id, ...data };
}

async function handleIncomeSourceDelete(_event: any, id: string) {
  const stmt = db.prepare('DELETE FROM income_sources WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 收入记录处理函数 ====================

async function handleIncomeRecordGetAll(_event: any, filters?: any) {
  let sql = 'SELECT * FROM income_records WHERE 1=1';
  const params: any[] = [];

  if (filters?.month) {
    sql += " AND strftime('%Y-%m', date) = ?";
    params.push(filters.month);
  }

  if (filters?.sourceId || filters?.source_id) {
    sql += ' AND source_id = ?';
    params.push(filters.sourceId || filters.source_id);
  }

  sql += ' ORDER BY date DESC, created_at DESC';

  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

async function handleIncomeRecordGetById(_event: any, id: string) {
  const stmt = db.prepare('SELECT * FROM income_records WHERE id = ?');
  return stmt.get(id);
}

async function handleIncomeRecordCreate(_event: any, data: any) {
  const id = `income-record-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO income_records (id, user_id, source_id, amount, date, frequency, currency, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.userId || data.user_id,
    data.sourceId || data.source_id,
    data.amount,
    data.date,
    data.frequency,
    data.currency || 'CNY',
    data.note || null
  );

  return { id, ...data };
}

async function handleIncomeRecordUpdate(_event: any, id: string, data: any) {
  const stmt = db.prepare(`
    UPDATE income_records
    SET source_id = ?, amount = ?, date = ?, frequency = ?, currency = ?, note = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(
    data.sourceId || data.source_id,
    data.amount,
    data.date,
    data.frequency,
    data.currency,
    data.note,
    id
  );

  return { id, ...data };
}

async function handleIncomeRecordDelete(_event: any, id: string) {
  const stmt = db.prepare('DELETE FROM income_records WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 收入目标处理函数 ====================

async function handleIncomeGoalGetAll() {
  const stmt = db.prepare('SELECT * FROM income_goals ORDER BY priority DESC, created_at DESC');
  return stmt.all();
}

async function handleIncomeGoalGetById(_event: any, id: string) {
  const stmt = db.prepare('SELECT * FROM income_goals WHERE id = ?');
  return stmt.get(id);
}

async function handleIncomeGoalCreate(_event: any, data: any) {
  const id = `income-goal-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO income_goals (
      id, user_id, type, title, description, target_amount, current_amount,
      target_percentage, current_percentage, target_date, status, priority
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.userId || data.user_id,
    data.type,
    data.title,
    data.description || null,
    data.targetAmount || data.target_amount,
    data.currentAmount || data.current_amount || 0,
    data.targetPercentage || data.target_percentage || null,
    data.currentPercentage || data.current_percentage || 0,
    data.targetDate || data.target_date || null,
    data.status || 'in_progress',
    data.priority || 3
  );

  return { id, ...data };
}

async function handleIncomeGoalUpdate(_event: any, id: string, data: any) {
  const stmt = db.prepare(`
    UPDATE income_goals
    SET title = ?, description = ?, target_amount = ?, current_amount = ?,
        target_percentage = ?, current_percentage = ?, target_date = ?, status = ?, priority = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(
    data.title,
    data.description,
    data.targetAmount || data.target_amount,
    data.currentAmount || data.current_amount,
    data.targetPercentage || data.target_percentage,
    data.currentPercentage || data.current_percentage,
    data.targetDate || data.target_date,
    data.status,
    data.priority,
    id
  );

  return { id, ...data };
}

async function handleIncomeGoalDelete(_event: any, id: string) {
  const stmt = db.prepare('DELETE FROM income_goals WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 收入策略处理函数 ====================

async function handleIncomeStrategyGetAll() {
  const stmt = db.prepare('SELECT * FROM income_strategies ORDER BY priority DESC, created_at DESC');
  return stmt.all();
}

async function handleIncomeStrategyGetRecommended() {
  const stmt = db.prepare('SELECT * FROM income_strategies WHERE is_recommended = 1 ORDER BY priority DESC');
  return stmt.all();
}

async function handleIncomeStrategyCreate(_event: any, data: any) {
  const id = `income-strategy-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO income_strategies (
      id, user_id, type, title, description, steps, expected_income, time_frame,
      difficulty, priority, is_recommended, applied
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.userId || data.user_id,
    data.type,
    data.title,
    data.description,
    JSON.stringify(data.steps || []),
    data.expectedIncome || data.expected_income || 0,
    data.timeFrame || data.time_frame || 0,
    data.difficulty || 3,
    data.priority || 3,
    data.isRecommended !== undefined ? (data.isRecommended ? 1 : 0) : 0,
    0
  );

  return { id, ...data };
}

async function handleIncomeStrategyUpdate(_event: any, id: string, data: any) {
  const stmt = db.prepare(`
    UPDATE income_strategies
    SET title = ?, description = ?, steps = ?, expected_income = ?, time_frame = ?,
        difficulty = ?, priority = ?, is_recommended = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(
    data.title,
    data.description,
    JSON.stringify(data.steps || []),
    data.expectedIncome || data.expected_income,
    data.timeFrame || data.time_frame,
    data.difficulty,
    data.priority,
    data.isRecommended !== undefined ? (data.isRecommended ? 1 : 0) : 0,
    id
  );

  return { id, ...data };
}

async function handleIncomeStrategyDelete(_event: any, id: string) {
  const stmt = db.prepare('DELETE FROM income_strategies WHERE id = ?');
  stmt.run(id);
  return { id };
}

async function handleIncomeStrategyApply(_event: any, id: string) {
  const stmt = db.prepare(`
    UPDATE income_strategies
    SET applied = 1, updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(id);

  // 自动生成行动计划
  const strategy = await handleIncomeStrategyGetById(null, id);
  if (strategy && Array.isArray(strategy.steps)) {
    for (let i = 0; i < strategy.steps.length; i++) {
      const step = strategy.steps[i];
      await handleIncomeActionCreate(null, {
        userId: strategy.user_id,
        strategyId: id,
        title: step.title || `步骤 ${i + 1}`,
        description: step.description,
        priority: step.priority || 3,
        dueDate: step.dueDate,
      });
    }
  }

  return { id };
}

// ==================== 收入行动计划处理函数 ====================

async function handleIncomeActionGetAll(_event: any, filters?: any) {
  let sql = 'SELECT * FROM income_actions WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.strategyId || filters?.strategy_id) {
    sql += ' AND strategy_id = ?';
    params.push(filters.strategyId || filters.strategy_id);
  }

  sql += ' ORDER BY priority DESC, due_date ASC, created_at DESC';

  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

async function handleIncomeActionGetById(_event: any, id: string) {
  const stmt = db.prepare('SELECT * FROM income_actions WHERE id = ?');
  return stmt.get(id);
}

async function handleIncomeActionCreate(_event: any, data: any) {
  const id = `income-action-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO income_actions (
      id, user_id, strategy_id, title, description, priority, status, due_date
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.userId || data.user_id,
    data.strategyId || data.strategy_id || null,
    data.title,
    data.description || null,
    data.priority || 3,
    data.status || 'pending',
    data.dueDate || data.due_date || null
  );

  return { id, ...data };
}

async function handleIncomeActionUpdate(_event: any, id: string, data: any) {
  const stmt = db.prepare(`
    UPDATE income_actions
    SET title = ?, description = ?, priority = ?, status = ?, due_date = ?, completed_at = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(
    data.title,
    data.description,
    data.priority,
    data.status,
    data.dueDate || data.due_date,
    data.status === 'completed' ? new Date().toISOString() : null,
    id
  );

  return { id, ...data };
}

async function handleIncomeActionDelete(_event: any, id: string) {
  const stmt = db.prepare('DELETE FROM income_actions WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 收入分析处理函数 ====================

async function handleIncomeGetDashboard(_event: any, params: any) {
  const sources = await handleIncomeSourceGetAll();
  const records = await handleIncomeRecordGetAll();

  const targetPassivePercentage = params?.targetPassivePercentage || 50;

  return generateIncomeDashboard(sources, records, targetPassivePercentage);
}

async function handleIncomeGetAnalysis() {
  const sources = await handleIncomeSourceGetAll();
  const records = await handleIncomeRecordGetAll();

  return generateIncomeAnalysisReport(sources, records);
}

async function handleIncomeGetStructure() {
  const sources = await handleIncomeSourceGetAll();

  return calculateIncomeStructure(sources);
}

// ==================== 收入模拟处理函数 ====================

async function handleIncomeSimulate(_event: any, params: any) {
  const {
    currentMonthlyIncome,
    activeGrowthRate,
    passiveGrowthRate,
    years = 10,
    newIncomeSources = [],
  } = params;

  return simulateIncomeGrowth(
    currentMonthlyIncome,
    activeGrowthRate,
    passiveGrowthRate,
    years,
    newIncomeSources
  );
}

async function handleIncomeSimulationGetAll() {
  const stmt = db.prepare('SELECT * FROM income_simulations ORDER BY created_at DESC');
  return stmt.all();
}

async function handleIncomeSimulationCreate(_event: any, data: any) {
  const id = `income-sim-${Date.now()}`;

  // 运行模拟
  const results = simulateIncomeGrowth(
    data.currentMonthlyIncome,
    data.activeGrowthRate || data.active_growth_rate || 5,
    data.passiveGrowthRate || data.passive_growth_rate || 8,
    data.simulationYears || data.simulation_years || 10,
    data.newIncomeSources || []
  );

  const stmt = db.prepare(`
    INSERT INTO income_simulations (
      id, user_id, name, current_monthly_income, current_annual_income,
      active_growth_rate, passive_growth_rate, new_income_sources, simulation_years, results
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.userId || data.user_id,
    data.name,
    data.currentMonthlyIncome || data.current_monthly_income,
    data.currentAnnualIncome || data.current_annual_income,
    data.activeGrowthRate || data.active_growth_rate,
    data.passiveGrowthRate || data.passive_growth_rate,
    JSON.stringify(data.newIncomeSources || []),
    data.simulationYears || data.simulation_years,
    JSON.stringify(results)
  );

  return { id, ...data, results };
}

async function handleIncomeSimulationDelete(_event: any, id: string) {
  const stmt = db.prepare('DELETE FROM income_simulations WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 财务自由预测处理函数 ====================

async function handlePredictFinancialFreedom(_event: any, params: any) {
  const {
    currentNetWorth,
    monthlyExpenses,
    monthlySavings,
    expectedReturnRate = 8.0,
    targetMultiplier = 150,
  } = params;

  return predictFinancialFreedom(
    currentNetWorth,
    monthlyExpenses,
    monthlySavings,
    expectedReturnRate,
    targetMultiplier
  );
}
