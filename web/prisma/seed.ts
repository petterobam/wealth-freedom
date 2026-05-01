import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 创建演示用户
  const passwordHash = await bcrypt.hash("demo123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@wealthfreedom.com" },
    update: {},
    create: { email: "demo@wealthfreedom.com", name: "演示用户", passwordHash },
  });

  // 创建账户
  const accounts = await Promise.all([
    prisma.account.create({ data: { userId: user.id, name: "招商银行", type: "checking", balance: 45000, icon: "💳", color: "#e74c3c" } }),
    prisma.account.create({ data: { userId: user.id, name: "支付宝余额", type: "savings", balance: 25000, icon: "🏦", color: "#3b82f6" } }),
    prisma.account.create({ data: { userId: user.id, name: "基金投资", type: "investment", balance: 680000, icon: "📈", color: "#10b981" } }),
    prisma.account.create({ data: { userId: user.id, name: "股票账户", type: "investment", balance: 320000, icon: "📈", color: "#f59e0b" } }),
    prisma.account.create({ data: { userId: user.id, name: "现金", type: "cash", balance: 30000, icon: "💵", color: "#8b5cf6" } }),
  ]);

  // 创建交易
  const txData = [
    { date: "2026-04-28", type: "expense", category: "餐饮", amount: 45, note: "午餐" },
    { date: "2026-04-28", type: "expense", category: "交通", amount: 12, note: "地铁" },
    { date: "2026-04-27", type: "income", category: "工资", amount: 30000, note: "4月工资" },
    { date: "2026-04-27", type: "expense", category: "房租", amount: 4500, note: "月租" },
    { date: "2026-04-26", type: "expense", category: "购物", amount: 299, note: "书籍" },
    { date: "2026-04-25", type: "income", category: "投资", amount: 3200, note: "基金分红" },
    { date: "2026-04-25", type: "expense", category: "餐饮", amount: 68, note: "晚餐" },
    { date: "2026-04-24", type: "expense", category: "通讯", amount: 128, note: "手机话费" },
    { date: "2026-04-23", type: "expense", category: "医疗", amount: 350, note: "体检" },
    { date: "2026-04-22", type: "expense", category: "娱乐", amount: 88, note: "电影" },
  ];
  await Promise.all(txData.map(t => prisma.transaction.create({ data: { userId: user.id, ...t } })));

  // 创建预算
  const budgetData = [
    { category: "餐饮", limit: 2000, icon: "🍜", color: "#e74c3c" },
    { category: "交通", limit: 500, icon: "🚇", color: "#3b82f6" },
    { category: "购物", limit: 1500, icon: "🛍️", color: "#f59e0b" },
    { category: "娱乐", limit: 800, icon: "🎮", color: "#8b5cf6" },
    { category: "房租", limit: 4500, icon: "🏠", color: "#10b981" },
  ];
  await Promise.all(budgetData.map(b => prisma.budget.create({ data: { userId: user.id, ...b } })));

  // 创建目标
  const goalData = [
    { name: "财务安全", target: 3160000, current: 1100000, icon: "🛡️", deadline: "2030-11", color: "from-blue-500 to-emerald-500" },
    { name: "6个月储备金", target: 180000, current: 135000, icon: "🏦", deadline: "2026-06", color: "from-purple-500 to-pink-500" },
    { name: "产品月收入 ¥2,000", target: 2000, current: 0, icon: "💻", deadline: "2026-08", color: "from-amber-500 to-orange-500" },
    { name: "财务自由", target: 8000000, current: 1100000, icon: "🏝️", deadline: "2031-04", color: "from-emerald-400 to-teal-300" },
  ];
  await Promise.all(goalData.map(g => prisma.goal.create({ data: { userId: user.id, ...g } })));

  // 创建投资
  const invData = [
    { name: "沪深300指数基金", type: "fund", amount: 380000, currentValue: 398000, buyDate: "2025-06-15", note: "定投核心仓位" },
    { name: "中证500指数", type: "fund", amount: 150000, currentValue: 162000, buyDate: "2025-09-01", note: "卫星仓位" },
    { name: "国债逆回购", type: "bond", amount: 150000, currentValue: 153200, buyDate: "2025-12-01", note: "现金管理" },
    { name: "腾讯控股", type: "stock", amount: 120000, currentValue: 136800, buyDate: "2025-08-20", note: "个股持仓" },
    { name: "3年期定期", type: "deposit", amount: 100000, currentValue: 102500, buyDate: "2025-03-01", note: "安全垫" },
  ];
  await Promise.all(invData.map(i => prisma.investment.create({ data: { userId: user.id, ...i } })));

  console.log("✅ Seed data created for user:", user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
