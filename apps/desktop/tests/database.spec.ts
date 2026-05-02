import { describe, it, expect, beforeAll } from 'vitest'
import initSqlJs, { type Database } from 'sql.js'

describe('数据库核心业务逻辑', () => {
  let db: Database

  beforeAll(async () => {
    const SQL = await initSqlJs()
    db = new SQL.Database()

    db.run(`
      CREATE TABLE accounts (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
        balance REAL DEFAULT 0, currency TEXT DEFAULT 'CNY',
        is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT '2026-05-02'
      );
      CREATE TABLE transactions (
        id TEXT PRIMARY KEY, account_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
        amount REAL NOT NULL, category TEXT DEFAULT '', date TEXT NOT NULL
      );
      CREATE TABLE budgets (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, amount REAL NOT NULL,
        spent REAL DEFAULT 0, period TEXT DEFAULT 'monthly', start_date TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
      );
      CREATE TABLE goals (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, target_amount REAL NOT NULL,
        current_amount REAL DEFAULT 0, deadline TEXT, is_active INTEGER DEFAULT 1
      );
      CREATE TABLE investments (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
        quantity REAL DEFAULT 0, cost_price REAL DEFAULT 0, current_price REAL DEFAULT 0
      );
      CREATE TABLE recurring_rules (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
        amount REAL NOT NULL, frequency TEXT DEFAULT 'monthly',
        next_date TEXT NOT NULL, is_active INTEGER DEFAULT 1
      );
    `)
  })

  describe('账户 CRUD', () => {
    it('创建账户', () => {
      db.run('INSERT INTO accounts (id, name, type, balance) VALUES (?, ?, ?, ?)', ['acc-001', '招商银行', 'debit', 50000])
      const [row] = db.exec('SELECT * FROM accounts WHERE id = ?', ['acc-001'])[0].values as any[][]
      expect(row[1]).toBe('招商银行')
      expect(row[3]).toBe(50000)
    })

    it('更新余额', () => {
      db.run('UPDATE accounts SET balance = ? WHERE id = ?', [60000, 'acc-001'])
      const [row] = db.exec('SELECT balance FROM accounts WHERE id = ?', ['acc-001'])[0].values as any[][]
      expect(row[0]).toBe(60000)
    })

    it('软删除（设为不活跃）', () => {
      db.run('INSERT INTO accounts (id, name, type) VALUES (?, ?, ?)', ['acc-del', '待删除', 'debit'])
      db.run('UPDATE accounts SET is_active = 0 WHERE id = ?', ['acc-del'])
      const result = db.exec('SELECT is_active FROM accounts WHERE id = ?', ['acc-del'])
      expect((result[0].values[0] as any[])[0]).toBe(0)
    })

    it('查询活跃账户', () => {
      const result = db.exec('SELECT COUNT(*) FROM accounts WHERE is_active = 1')
      expect((result[0].values[0] as any[])[0]).toBeGreaterThan(0)
    })
  })

  describe('交易记录', () => {
    it('记录收入', () => {
      db.run('INSERT INTO transactions (id, account_id, type, amount, category, date) VALUES (?, ?, ?, ?, ?, ?)',
        ['tx-001', 'acc-001', 'income', 15000, '工资', '2026-05-01'])
      const [row] = db.exec('SELECT type, amount FROM transactions WHERE id = ?', ['tx-001'])[0].values as any[][]
      expect(row[0]).toBe('income')
      expect(row[1]).toBe(15000)
    })

    it('记录支出', () => {
      db.run('INSERT INTO transactions (id, account_id, type, amount, category, date) VALUES (?, ?, ?, ?, ?, ?)',
        ['tx-002', 'acc-001', 'expense', 200, '餐饮', '2026-05-02'])
      const [row] = db.exec('SELECT type, amount FROM transactions WHERE id = ?', ['tx-002'])[0].values as any[][]
      expect(row[0]).toBe('expense')
    })

    it('按月统计收支', () => {
      const result = db.exec("SELECT type, SUM(amount) as total FROM transactions WHERE date LIKE '2026-05%' GROUP BY type")
      const cols = result[0].columns
      const income = result[0].values.find(r => r[0] === 'income')!
      const expense = result[0].values.find(r => r[0] === 'expense')!
      expect(income[1]).toBe(15000)
      expect(expense[1]).toBe(200)
    })

    it('type 约束：非法类型应拒绝', () => {
      expect(() => {
        db.run("INSERT INTO transactions (id, account_id, type, amount, date) VALUES ('tx-bad', 'acc-001', 'hack', 999, '2026-05-01')")
      }).toThrow()
    })
  })

  describe('预算管理', () => {
    it('创建预算并检查是否超支', () => {
      db.run('INSERT INTO budgets (id, name, amount, spent, start_date) VALUES (?, ?, ?, ?, ?)',
        ['bud-001', '餐饮预算', 3000, 200, '2026-05-01'])
      const [row] = db.exec('SELECT amount, spent FROM budgets WHERE id = ?', ['bud-001'])[0].values as any[][]
      expect(row[1]).toBeLessThan(row[0])
    })

    it('预算使用率计算', () => {
      const [row] = db.exec('SELECT amount, spent FROM budgets WHERE id = ?', ['bud-001'])[0].values as any[][]
      const rate = row[1] / row[0] * 100
      expect(rate).toBeCloseTo(6.67, 0)
    })
  })

  describe('目标追踪', () => {
    it('创建目标并更新进度', () => {
      db.run('INSERT INTO goals (id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)',
        ['goal-001', '紧急储备金', 100000, 60000, '2026-12-31'])
      db.run('UPDATE goals SET current_amount = ? WHERE id = ?', [75000, 'goal-001'])
      const [row] = db.exec('SELECT current_amount FROM goals WHERE id = ?', ['goal-001'])[0].values as any[][]
      expect(row[0]).toBe(75000)
    })

    it('完成率计算', () => {
      const [row] = db.exec('SELECT target_amount, current_amount FROM goals WHERE id = ?', ['goal-001'])[0].values as any[][]
      expect(row[1] / row[0] * 100).toBe(75)
    })
  })

  describe('投资收益', () => {
    it('持仓收益计算', () => {
      db.run('INSERT INTO investments (id, name, type, quantity, cost_price, current_price) VALUES (?, ?, ?, ?, ?, ?)',
        ['inv-001', '沪深300ETF', 'fund', 1000, 3.5, 3.8])
      const [row] = db.exec('SELECT quantity, cost_price, current_price FROM investments WHERE id = ?', ['inv-001'])[0].values as any[][]
      const cost = row[0] * row[1]
      const current = row[0] * row[2]
      expect(current - cost).toBe(300)
      expect((current - cost) / cost * 100).toBeCloseTo(8.57, 1)
    })
  })

  describe('周期性交易', () => {
    it('创建周期规则', () => {
      db.run('INSERT INTO recurring_rules (id, name, type, amount, frequency, next_date) VALUES (?, ?, ?, ?, ?, ?)',
        ['rec-001', '月租', 'expense', 3000, 'monthly', '2026-06-01'])
      const [row] = db.exec('SELECT name, frequency FROM recurring_rules WHERE id = ?', ['rec-001'])[0].values as any[][]
      expect(row[0]).toBe('月租')
      expect(row[1]).toBe('monthly')
    })
  })

  describe('财务健康度', () => {
    it('净资产计算', () => {
      const [row] = db.exec('SELECT SUM(balance) FROM accounts WHERE is_active = 1')[0].values as any[][]
      expect(row[0]).toBe(60000)
    })

    it('月度储蓄率', () => {
      const result = db.exec("SELECT type, SUM(amount) FROM transactions WHERE date LIKE '2026-05%' GROUP BY type")
      const income = result[0].values.find(r => r[0] === 'income')![1] as number
      const expense = result[0].values.find(r => r[0] === 'expense')![1] as number
      expect((income - expense) / income * 100).toBeCloseTo(98.67, 0)
    })
  })
})
