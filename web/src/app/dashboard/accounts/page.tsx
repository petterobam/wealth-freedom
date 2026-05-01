"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchAccounts,
  createAccount,
  updateAccount as apiUpdateAccount,
  deleteAccount as apiDeleteAccount,
} from "@/lib/api";
import type { ApiAccount } from "@/lib/api";
import { ACCOUNT_TYPES, ACCOUNT_ICONS } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type AccountType = ApiAccount["type"];

const TYPE_COLORS: Record<string, string> = {
  checking: "#e74c3c",
  savings: "#3b82f6",
  investment: "#10b981",
  credit: "#f59e0b",
  cash: "#8b5cf6",
  other: "#6b7280",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [assetsByType, setAssetsByType] = useState<{ type: string; label: string; value: number; color: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "checking" as AccountType, balance: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAccounts();
      setAccounts(data);
      const total = data.reduce((s, a) => s + a.balance, 0);
      setTotalAssets(total);
      const byType = Object.entries(
        data.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + a.balance; return acc; }, {} as Record<string, number>)
      ).map(([type, value]) => ({ type, label: (ACCOUNT_TYPES as Record<string, string>)[type] || type, value, color: (TYPE_COLORS as Record<string, string>)[type] || "#6b7280" }));
      setAssetsByType(byType);
    } catch (e) {
      console.error("Failed to fetch accounts:", e);
    }
  }, []);

  useEffect(() => { refresh().finally(() => setLoading(false)); }, [refresh]);

  if (loading) return <div className="p-6 text-slate-500">加载中...</div>;

  const fmt = (n: number) => "¥" + n.toLocaleString("zh-CN", { minimumFractionDigits: 2 });

  function openCreate() {
    setEditId(null);
    setForm({ name: "", type: "checking", balance: 0 });
    setShowModal(true);
  }

  function openEdit(acct: ApiAccount) {
    setEditId(acct.id);
    setForm({ name: acct.name, type: acct.type, balance: acct.balance });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    try {
      if (editId) {
        await apiUpdateAccount(editId, {
          name: form.name,
          type: form.type,
          balance: form.balance,
          icon: (ACCOUNT_ICONS as Record<string, string>)[form.type],
          color: TYPE_COLORS[form.type],
        });
      } else {
        await createAccount({
          name: form.name,
          type: form.type,
          balance: form.balance,
          icon: (ACCOUNT_ICONS as Record<string, string>)[form.type],
          color: TYPE_COLORS[form.type],
        });
      }
      setShowModal(false);
      await refresh();
    } catch (e) {
      console.error("Failed to save account:", e);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除该账户？")) return;
    try {
      await apiDeleteAccount(id);
      await refresh();
    } catch (e) {
      console.error("Failed to delete account:", e);
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">🏦 账户管理</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition">
          + 新增账户
        </button>
      </div>

      {/* 总资产 + 饼图 */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">总资产</div>
          <div className="text-3xl font-bold text-emerald-400">{fmt(totalAssets)}</div>
          <div className="text-xs text-slate-500 mt-2">{accounts.length} 个账户</div>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <h3 className="font-bold mb-3 text-sm">资产分布</h3>
          {assetsByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={assetsByType} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" nameKey="label">
                  {assetsByType.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `¥${Number(v).toLocaleString()}`} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">暂无数据</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {assetsByType.map((d) => (
              <span key={d.type} className="text-xs text-slate-400 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.label} {((d.value / totalAssets) * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 账户列表 */}
      <div className="space-y-3">
        {accounts.map((acct) => (
          <div key={acct.id} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 flex items-center gap-4 hover:border-slate-600/50 transition">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: acct.color + "20" }}>
              {acct.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{acct.name}</div>
              <div className="text-xs text-slate-400">{(ACCOUNT_TYPES as Record<string, string>)[acct.type]}</div>
            </div>
            <div className={`text-lg font-mono font-semibold ${acct.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fmt(acct.balance)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(acct)} className="text-xs px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition">编辑</button>
              <button onClick={() => handleDelete(acct.id)} className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition">删除</button>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-3xl mb-2">🏦</p>
            <p>还没有账户，点击上方按钮添加</p>
          </div>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editId ? "编辑账户" : "新增账户"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">账户名称</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="如：招商银行储蓄卡"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">账户类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(ACCOUNT_TYPES) as [AccountType, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, type: key })}
                      className={`px-3 py-2 rounded-lg text-sm transition border ${
                        form.type === key
                          ? "border-blue-500 bg-blue-500/20 text-blue-400"
                          : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {ACCOUNT_ICONS[key]} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">余额 (¥)</label>
                <input
                  type="number"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition">取消</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition">
                {editId ? "保存" : "添加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
