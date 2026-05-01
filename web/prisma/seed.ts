import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── 工具函数 ──
function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── 生成6个月真实感交易数据（2025-11 ~ 2026-04）──
function generateTransactions(userId: string) {
  const data: { userId: string; date: string; type: string; category: string; amount: number; note: string }[] = [];

  // 日常支出模板
  const dailyExpenses = [
    { category: "餐饮", notes: ["午餐", "早餐", "晚餐", "外卖", "奶茶", "水果"], range: [15, 120] },
    { category: "交通", notes: ["地铁", "公交", "打车", "共享单车"], range: [2, 45] },
    { category: "购物", notes: ["日用品", "衣服", "书籍", "数码配件", "家居用品"], range: [30, 500] },
    { category: "娱乐", notes: ["电影", "游戏", "视频会员", "音乐会员"], range: [15, 150] },
    { category: "医疗", notes: ["药品", "体检", "牙科", "挂号"], range: [50, 600] },
    { category: "教育", notes: ["网课", "书籍", "技术课程", "英语学习"], range: [50, 300] },
  ];

  const months = [
    { year: 2025, month: 11 }, { year: 2025, month: 12 },
    { year: 2026, month: 1 }, { year: 2026, month: 2 },
    { year: 2026, month: 3 }, { year: 2026, month: 4 },
  ];

  for (const { year, month } of months) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;

    // ── 固定月度收支 ──
    // 工资（每月10号）
    data.push({ userId, date: `${monthStr}-10`, type: "income", category: "工资", amount: 30000, note: `${month}月工资` });

    // 房租（每月1号）
    data.push({ userId, date: `${monthStr}-01`, type: "expense", category: "房租", amount: 4500, note: "月租" });

    // 投资分红（每季度末月）
    if (month === 12 || month === 3) {
      data.push({ userId, date: `${monthStr}-20`, type: "income", category: "投资", amount: randomBetween(2800, 4500), note: "基金分红" });
    }

    // 副业/咨询收入（随机月）
    if (Math.random() > 0.4) {
      const day = Math.floor(Math.random() * 20) + 5;
      data.push({ userId, date: `${monthStr}-${String(day).padStart(2, "0")}`, type: "income", category: "副业", amount: randomBetween(800, 3000), note: pick(["技术咨询", "外包项目", "课程收入", "写作稿费"]) });
    }

    // 通讯费
    data.push({ userId, date: `${monthStr}-${String(Math.floor(Math.random() * 5) + 1).padStart(2, "0")}`, type: "expense", category: "通讯", amount: 128, note: "手机话费" });

    // 水电燃气
    data.push({ userId, date: `${monthStr}-${String(Math.floor(Math.random() * 5) + 5).padStart(2, "0")}`, type: "expense", category: "居住", amount: randomBetween(200, 380), note: pick(["水电费", "燃气费", "物业费"]) });

    // ── 日常随机支出 ──
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;
      const dow = new Date(year, month - 1, day).getDay();

      // 工作日：午餐90%概率
      if (dow >= 1 && dow <= 5 && Math.random() > 0.1) {
        const meal = dailyExpenses[0];
        data.push({ userId, date: dateStr, type: "expense", category: meal.category, amount: randomBetween(20, 55), note: pick(meal.notes) });
      }

      // 工作日：交通80%
      if (dow >= 1 && dow <= 5 && Math.random() > 0.2) {
        const trans = dailyExpenses[1];
        data.push({ userId, date: dateStr, type: "expense", category: trans.category, amount: randomBetween(trans.range[0], trans.range[1]), note: pick(trans.notes) });
      }

      // 周末：外出就餐60%
      if ((dow === 0 || dow === 6) && Math.random() > 0.4) {
        data.push({ userId, date: dateStr, type: "expense", category: "餐饮", amount: randomBetween(60, 200), note: pick(["聚餐", "火锅", "日料", "烧烤", "下午茶"]) });
      }

      // 随机购物（每周1-2次）
      if (Math.random() > 0.82) {
        const shop = dailyExpenses[2];
        data.push({ userId, date: dateStr, type: "expense", category: shop.category, amount: randomBetween(shop.range[0], shop.range[1]), note: pick(shop.notes) });
      }

      // 随机娱乐（每周0-1次）
      if (Math.random() > 0.9) {
        const ent = dailyExpenses[3];
        data.push({ userId, date: dateStr, type: "expense", category: ent.category, amount: randomBetween(ent.range[0], ent.range[1]), note: pick(ent.notes) });
      }
    }

    // 月度大额支出（偶发）
    if (Math.random() > 0.5) {
      const bigDay = Math.floor(Math.random() * 20) + 5;
      data.push({ userId, date: `${monthStr}-${String(bigDay).padStart(2, "0")}`, type: "expense", category: pick(["购物", "医疗", "教育"]), amount: randomBetween(300, 2000), note: pick(["衣服换季", "体检加项", "技术培训", "数码产品"]) });
    }
  }

  return data;
}

async function main() {
  // 清空旧数据（开发环境）
  await prisma.investment.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 创建演示用户
  const passwordHash = await bcrypt.hash("demo123", 10);
  const user = await prisma.user.create({
    data: { email: "demo@wealthfreedom.com", name: "演示用户", passwordHash },
  });
  console.log(`👤 用户: ${user.email}`);

  // 创建账户
  const accountData = [
    { name: "招商银行", type: "checking", balance: 45000, icon: "💳", color: "#e74c3c" },
    { name: "支付宝余额", type: "savings", balance: 25000, icon: "🏦", color: "#3b82f6" },
    { name: "基金投资", type: "investment", balance: 680000, icon: "📈", color: "#10b981" },
    { name: "股票账户", type: "investment", balance: 320000, icon: "📊", color: "#f59e0b" },
    { name: "现金", type: "cash", balance: 30000, icon: "💵", color: "#8b5cf6" },
  ];
  await Promise.all(accountData.map(a => prisma.account.create({ data: { userId: user.id, ...a } })));
  console.log(`💳 账户: ${accountData.length} 个`);

  // 创建6个月交易数据
  const transactions = generateTransactions(user.id);
  // 分批写入（每批200条）
  for (let i = 0; i < transactions.length; i += 200) {
    const batch = transactions.slice(i, i + 200);
    await Promise.all(batch.map(t => prisma.transaction.create({ data: t })));
  }
  console.log(`💰 交易: ${transactions.length} 条（6个月）`);

  // 创建预算
  const budgetData = [
    { category: "餐饮", limit: 2000, icon: "🍜", color: "#e74c3c" },
    { category: "交通", limit: 500, icon: "🚇", color: "#3b82f6" },
    { category: "购物", limit: 1500, icon: "🛍️", color: "#f59e0b" },
    { category: "娱乐", limit: 800, icon: "🎮", color: "#8b5cf6" },
    { category: "房租", limit: 4500, icon: "🏠", color: "#10b981" },
    { category: "通讯", limit: 200, icon: "📱", color: "#06b6d4" },
    { category: "居住", limit: 400, icon: "💡", color: "#84cc16" },
    { category: "教育", limit: 500, icon: "📚", color: "#f43f5e" },
  ];
  await Promise.all(budgetData.map(b => prisma.budget.create({ data: { userId: user.id, ...b } })));
  console.log(`🎯 预算: ${budgetData.length} 项`);

  // 创建目标
  const goalData = [
    { name: "财务安全", target: 3160000, current: 1100000, icon: "🛡️", deadline: "2030-11", color: "from-blue-500 to-emerald-500" },
    { name: "6个月储备金", target: 180000, current: 135000, icon: "🏦", deadline: "2026-06", color: "from-purple-500 to-pink-500" },
    { name: "产品月收入 ¥2,000", target: 2000, current: 0, icon: "💻", deadline: "2026-08", color: "from-amber-500 to-orange-500" },
    { name: "财务自由", target: 8000000, current: 1100000, icon: "🏝️", deadline: "2031-04", color: "from-emerald-400 to-teal-300" },
  ];
  await Promise.all(goalData.map(g => prisma.goal.create({ data: { userId: user.id, ...g } })));
  console.log(`🏆 目标: ${goalData.length} 个`);

  // 创建投资
  const invData = [
    { name: "沪深300指数基金", type: "fund", amount: 380000, currentValue: 398000, buyDate: "2025-06-15", note: "定投核心仓位" },
    { name: "中证500指数", type: "fund", amount: 150000, currentValue: 162000, buyDate: "2025-09-01", note: "卫星仓位" },
    { name: "国债逆回购", type: "bond", amount: 150000, currentValue: 153200, buyDate: "2025-12-01", note: "现金管理" },
    { name: "腾讯控股", type: "stock", amount: 120000, currentValue: 136800, buyDate: "2025-08-20", note: "个股持仓" },
    { name: "3年期定期", type: "deposit", amount: 100000, currentValue: 102500, buyDate: "2025-03-01", note: "安全垫" },
    { name: "纳指100 ETF", type: "fund", amount: 80000, currentValue: 92400, buyDate: "2025-10-10", note: "海外配置" },
    { name: "比特币", type: "crypto", amount: 30000, currentValue: 43500, buyDate: "2025-11-05", note: "高风险探索" },
  ];
  await Promise.all(invData.map(i => prisma.investment.create({ data: { userId: user.id, ...i } })));
  console.log(`📈 投资: ${invData.length} 项`);

  // 统计
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  console.log(`\n📊 6个月汇总:`);
  console.log(`   总收入: ¥${totalIncome.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
  console.log(`   总支出: ¥${totalExpense.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
  console.log(`   月均结余: ¥${((totalIncome - totalExpense) / 6).toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
  console.log(`   储蓄率: ${(((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1)}%`);
  console.log(`\n✅ Seed 完成! 登录: demo@wealthfreedom.com / demo123`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
