"use client";

import { useState, useRef } from "react";
import { exportAllData, importAllData, resetAllData } from "@/lib/api";

type ImportResult = { ok: boolean; error?: string; count?: number };

export default function SettingsPage() {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 桌面端 JSON → 网页端格式转换
  function convertDesktopExport(raw: any): any {
    if (!raw._meta && !raw.transactions) return null;
    if (raw.transactions && Array.isArray(raw.transactions) && raw.transactions[0]?.type !== undefined && raw.transactions[0]?.category !== undefined) {
      return raw;
    }

    const transactions = (raw.transactions || []).map((t: any) => ({
      id: t.id || "t_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      date: t.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      type: t.type === "income" ? "income" : "expense",
      category: t.category || "其他",
      amount: Number(t.amount) || 0,
      note: t.description || t.note || "",
      createdAt: t.created_at || new Date().toISOString(),
    }));

    const accounts = (raw.accounts || []).map((a: any) => ({
      id: a.id || "a_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      name: a.name || "未命名账户",
      type: a.type || "other",
      balance: Number(a.balance) || 0,
      icon: a.icon || "🏦",
      color: a.color || "#3b82f6",
      createdAt: a.created_at || new Date().toISOString(),
      updatedAt: a.updated_at || new Date().toISOString(),
    }));

    const goals = (raw.goals || []).map((g: any) => ({
      id: g.id || "g_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      name: g.name || "未命名目标",
      target: Number(g.target_amount || g.target) || 0,
      current: Number(g.current_amount || g.current) || 0,
      icon: g.icon || "🎯",
      deadline: g.deadline?.slice(0, 7) || "",
      color: g.color || "from-blue-500 to-emerald-500",
      createdAt: g.created_at || new Date().toISOString(),
    }));

    return {
      transactions,
      accounts,
      goals,
      stats: {
        totalAssets: accounts.reduce((s: number, a: any) => s + a.balance, 0),
        monthlyIncome: 0,
        monthlyExpense: 0,
        savingsRate: 0,
        investmentReturn: 0,
        netWorth: accounts.reduce((s: number, a: any) => s + a.balance, 0),
        passiveIncome: 0,
      },
      version: 2,
    };
  }

  async function handleImport(json: string, fileName: string) {
    try {
      let parsed = JSON.parse(json);

      if (parsed._meta) {
        parsed = convertDesktopExport(parsed);
        if (!parsed) {
          setImportResult({ ok: false, error: "无法识别的数据格式" });
          return;
        }
      }

      setLoading(true);
      const result = await importAllData(parsed);
      const count = (parsed.transactions?.length || 0) + (parsed.accounts?.length || 0) + (parsed.goals?.length || 0);
      setImportResult({ ok: true, count });
    } catch (err: any) {
      setImportResult({ ok: false, error: err.message || `${fileName} 不是有效的 JSON 文件` });
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleImport(reader.result as string, file.name);
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleImport(reader.result as string, file.name);
    reader.readAsText(file);
  }

  async function handleExport() {
    try {
      setLoading(true);
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wealth-freedom-web-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("导出失败：" + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    try {
      setLoading(true);
      await resetAllData();
      setShowResetConfirm(false);
      setImportResult({ ok: true });
      window.location.reload();
    } catch (err: any) {
      alert("重置失败：" + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">⚙️ 设置</h1>

      {/* 数据导入 */}
      <section className="mb-8 bg-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-3">📥 数据导入</h2>
        <p className="text-sm text-slate-400 mb-4">
          支持导入桌面端导出的 JSON 文件，或网页端导出的备份数据。
        </p>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
            dragOver ? "border-blue-500 bg-blue-500/10" : "border-slate-600 hover:border-slate-500"
          } ${loading ? "opacity-50 pointer-events-none" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-3xl mb-2">📂</div>
          <p className="text-slate-400 text-sm">
            {loading ? "⏳ 正在导入..." : <>拖拽 JSON 文件到这里，或 <span className="text-blue-400 underline">点击选择文件</span></>}
          </p>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </div>
        {importResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            importResult.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          }`}>
            {importResult.ok
              ? `✅ 导入成功！共导入 ${importResult.count} 条数据，刷新页面查看。`
              : `❌ 导入失败：${importResult.error}`}
          </div>
        )}
      </section>

      {/* 数据导出 */}
      <section className="mb-8 bg-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-3">📤 数据导出</h2>
        <p className="text-sm text-slate-400 mb-4">
          导出所有数据为 JSON 文件，可用于备份或迁移到其他设备。
        </p>
        <button
          onClick={handleExport}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm transition"
        >
          {loading ? "⏳ 导出中..." : "导出 JSON 文件"}
        </button>
      </section>

      {/* 数据重置 */}
      <section className="mb-8 bg-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-3">🗑️ 重置数据</h2>
        <p className="text-sm text-slate-400 mb-4">
          恢复为默认演示数据。此操作不可撤销！建议先导出备份。
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={loading}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 disabled:opacity-50 rounded-lg text-sm transition"
          >
            重置所有数据
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={handleReset} disabled={loading} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-sm">
              {loading ? "⏳ 重置中..." : "确认重置"}
            </button>
            <button onClick={() => setShowResetConfirm(false)} disabled={loading} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">
              取消
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
