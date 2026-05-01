"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  fetchInvestments,
  createInvestment,
  updateInvestment as apiUpdateInvestment,
  deleteInvestment as apiDeleteInvestment,
} from "@/lib/api";
import type { ApiInvestment } from "@/lib/api";
import { INVESTMENT_TYPES, INVESTMENT_ICONS } from "@/lib/types";

type Tab = "holdings" | "trades";

function formatMoney(n: number) {
  if (n >= 10000) return `¥${(n / 10000).toFixed(2)}万`;
  return `¥${n.toLocaleString()}`;
}

export default function InvestmentsPage() {
  const [tab, setTab] = useState<Tab>("holdings");
  const [holdings, setHoldings] = useState<ApiInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "fund" as string,
    amount: 0,
    currentValue: 0,
    buyDate: new Date().toISOString().slice(0, 10),
    note: "",
  });

  const reload = useCallback(async () => {
    try {
      const data = await fetchInvestments();
      setHoldings(data);
    } catch (e) {
      console.error("Failed to fetch investments:", e);
    }
  }, []);

  useEffect(() => { reload().finally(() => setLoading(false)); }, [reload]);

  // Summary
  const totalInvested = useMemo(() => holdings.reduce((s, h) => s + h.amount, 0), [holdings]);
  const totalValue = useMemo(() => holdings.reduce((s, h) => s + h.currentValue, 0), [holdings]);
  const totalGain = totalValue - totalInvested;
  const totalGainRate = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // By type distribution
  const byType = useMemo(() => {
    const map: Record<string, { invested: number; value: number }> = {};
    for (const h of holdings) {
      if (!map[h.type]) map[h.type] = { invested: 0, value: 0 };
      map[h.type].invested += h.amount;
      map[h.type].value += h.currentValue;
    }
    return map;
  }, [holdings]);

  function openCreate() {
    setForm({ name: "", type: "fund", amount: 0, currentValue: 0, buyDate: new Date().toISOString().slice(0, 10), note: "" });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(h: ApiInvestment) {
    setForm({ name: h.name, type: h.type, amount: h.amount, currentValue: h.currentValue, buyDate: h.buyDate, note: h.note || "" });
    setEditId(h.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editId) {
        await apiUpdateInvestment(editId, { ...form, note: form.note || null });
      } else {
        await createInvestment({ ...form, note: form.note || null });
      }
      setShowForm(false);
      await reload();
    } catch (e) {
      console.error("Failed to save investment:", e);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该持仓？")) return;
    try {
      await apiDeleteInvestment(id);
      await reload();
    } catch (e) {
      console.error("Failed to delete investment:", e);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">📈 投资追踪</h1>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition">
          + 新增持仓
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">总投入</div>
          <div className="text-lg font-bold">{formatMoney(totalInvested)}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">当前市值</div>
          <div className="text-lg font-bold">{formatMoney(totalValue)}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">总收益</div>
          <div className={`text-lg font-bold ${totalGain >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalGain >= 0 ? "+" : ""}{formatMoney(totalGain)}
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">收益率</div>
          <div className={`text-lg font-bold ${totalGainRate >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalGainRate >= 0 ? "+" : ""}{totalGainRate.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Type Distribution */}
      <div className="bg-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-3">资产配置</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(byType).map(([type, data]) => {
            const pct = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
            return (
              <div key={type} className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                <span>{INVESTMENT_ICONS[type as keyof typeof INVESTMENT_ICONS]}</span>
                <span className="text-sm">{INVESTMENT_TYPES[type as keyof typeof INVESTMENT_TYPES]}</span>
                <span className="text-xs text-slate-400">{pct.toFixed(1)}%</span>
                <span className="text-sm font-medium">{formatMoney(data.value)}</span>
              </div>
            );
          })}
        </div>
        {/* Bar */}
        <div className="mt-3 h-3 bg-slate-700 rounded-full overflow-hidden flex">
          {Object.entries(byType).map(([type, data]) => {
            const pct = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
            const colors: Record<string, string> = { fund: "bg-blue-500", stock: "bg-amber-500", bond: "bg-green-500", deposit: "bg-purple-500", other: "bg-slate-500" };
            return <div key={type} className={`${colors[type] || "bg-slate-500"} transition-all`} style={{ width: `${pct}%` }} />;
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
        {(["holdings", "trades"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-sm rounded-md transition ${tab === t ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}>
            {t === "holdings" ? "持仓列表" : "交易记录"}
          </button>
        ))}
      </div>

      {/* Holdings Tab */}
      {tab === "holdings" && (
        <div className="space-y-3">
          {holdings.length === 0 && (
            <div className="text-center text-slate-500 py-10">暂无持仓记录，点击右上角新增</div>
          )}
          {holdings.map((h) => {
            const gain = h.currentValue - h.amount;
            const rate = h.amount > 0 ? (gain / h.amount) * 100 : 0;
            return (
              <div key={h.id} className="bg-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{(INVESTMENT_ICONS as Record<string, string>)[h.type]}</span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{h.name}</div>
                    <div className="text-xs text-slate-400">{(INVESTMENT_TYPES as Record<string, string>)[h.type]} · 买入 {h.buyDate}</div>
                    {h.note && <div className="text-xs text-slate-500 mt-0.5 truncate">{h.note}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">市值</div>
                    <div className="font-medium">{formatMoney(h.currentValue)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">收益</div>
                    <div className={`font-medium ${gain >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {gain >= 0 ? "+" : ""}{formatMoney(gain)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">收益率</div>
                    <div className={`font-medium ${rate >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {rate >= 0 ? "+" : ""}{rate.toFixed(2)}%
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(h)} className="text-xs text-blue-400 hover:text-blue-300">编辑</button>
                    <button onClick={() => handleDelete(h.id)} className="text-xs text-red-400 hover:text-red-300">删除</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trades Tab placeholder */}
      {tab === "trades" && (
        <div className="text-center text-slate-500 py-10">交易记录功能开发中，敬请期待</div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editId ? "编辑持仓" : "新增持仓"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">名称</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 bg-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">类型</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1 bg-slate-700 rounded-lg px-3 py-2 text-sm outline-none">
                    {(Object.entries(INVESTMENT_TYPES) as [string, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">买入日期</label>
                  <input type="date" required value={form.buyDate} onChange={(e) => setForm({ ...form, buyDate: e.target.value })} className="w-full mt-1 bg-slate-700 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">投入本金</label>
                  <input type="number" required min={0} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="w-full mt-1 bg-slate-700 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">当前市值</label>
                  <input type="number" required min={0} value={form.currentValue || ""} onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })} className="w-full mt-1 bg-slate-700 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">备注</label>
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full mt-1 bg-slate-700 rounded-lg px-3 py-2 text-sm outline-none" placeholder="可选" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 transition">取消</button>
                <button type="submit" className="flex-1 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 font-medium transition">
                  {editId ? "保存" : "创建"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
